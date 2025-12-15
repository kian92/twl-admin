"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Eye } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import type { Database } from "@/types/database"
import {
  Pagination,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
type CustomerRow = Database["public"]["Tables"]["customer_profiles"]["Row"]

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

const normalizeDate = (value: string | null) => {
  if (!value) return null
  return new Date(value.endsWith("Z") ? value : value + "Z")
}

const getStatusBadge = (status: string | null | undefined) => {
  if (!status) return <Badge variant="secondary">unknown</Badge>

  switch (status.toLowerCase()) {
    case "active":
      return <Badge className="bg-black text-white">active</Badge>
    case "inactive":
      return <Badge className="bg-[oklch(88%_0.01_60)] text-black">inactive</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function UsersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tierFilter, setTierFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<CustomerRow | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    let isMounted = true

    const loadUsers = async () => {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch("/api/users")
        if (!res.ok) throw new Error("Failed to fetch users")

        const result = await res.json()
        if (!isMounted) return

        setCustomers(result.users)
      } catch (err) {
        console.error("Failed to load users", err)
        if (!isMounted) return
        setError("Unable to load users. Please try again.")
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void loadUsers()

    return () => {
      isMounted = false
    }
  }, [])

  // const tiers = useMemo(() => {
  //   const unique = new Set<string>()
  //   customers.forEach((customer) => unique.add(customer.membership_tier))
  //   return ["all", ...Array.from(unique)]
  // }, [customers])

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    return customers.filter((user) => {
      const matchesSearch =
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      // const matchesTier = tierFilter === "all" || user.membership_tier === tierFilter
      // return matchesSearch && matchesTier
      return matchesSearch
    })
  }, [customers, searchQuery, tierFilter])

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredUsers.slice(start, end)
  }, [filteredUsers, currentPage])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage users ({customers.length.toLocaleString()} total)
        </p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-10"
          />
        </div>
         {/* <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by tier" />
          </SelectTrigger>
          <SelectContent>
            {tiers.map((tier) => (
              <SelectItem key={tier} value={tier}>
                {tier === "all" ? "All Tiers" : tier.charAt(0).toUpperCase() + tier.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select> */}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[0, 1, 2].map((item) => (
                <Skeleton key={`user-row-${item}`} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">User</th>
                    <th className="text-left p-4 font-medium">Bookings</th>
                    <th className="text-left p-4 font-medium">Total Spent</th>
                    <th className="text-left p-4 font-medium">Joined</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-gradient-to-br from-teal-500 to-coral-500 text-white">
                              {user.name?.charAt(0) ?? "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name ?? "Unknown"}</p>
                            <p className="text-sm text-muted-foreground">{user.email ?? "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{user.total_bookings ?? 0}</td>
                      <td className="p-4 font-semibold">$0</td>
                      <td className="p-4">
                        {user.joinedDate
                          ? dateFormatter.format(normalizeDate(user.joinedDate)!)
                          : "—"}
                      </td>
                      <td className="p-4">{getStatusBadge(user.status)}</td>
                      <td className="p-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                              className="flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                          </DialogTrigger>
                          {/* <DialogContent className="max-w-xl">
                            <DialogHeader>
                              <DialogTitle>{selectedUser?.name}</DialogTitle>
                              <DialogDescription>User details and membership insights</DialogDescription>
                            </DialogHeader>
                            {selectedUser && (
                              <div className="space-y-4">
                                <div className="grid gap-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Email: </span>
                                    {selectedUser.email}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Joined: </span>
                                    {selectedUser.joinedDate
                                      ? dateFormatter.format(normalizeDate(selectedUser.joinedDate)!)
                                      : "—"}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Status: </span>
                                    <span className="capitalize">{selectedUser.status}</span>
                                  </div>
                                </div>

                                <div>
                                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <Award className="w-4 h-4" />
                                    Membership Benefits
                                  </h3>
                                  <ul className="list-disc list-inside text-sm space-y-1">
                                    {getTierBenefits(selectedUser.membershipTier.toLowerCase()).map((benefit) => (
                                      <li key={benefit}>{benefit}</li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Total Bookings</Label>
                                    <p className="text-sm font-semibold">{selectedUser.total_bookings}</p>
                                  </div>
                                  <div>
                                    <Label>Total Spent</Label>
                                    <p className="text-sm font-semibold">${selectedUser.total_spent.toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <Label>Points Balance</Label>
                                    <p className="text-sm font-semibold">{selectedUser.points.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <Label>Membership Tier</Label>
                                    <p className="text-sm font-semibold capitalize">{selectedUser.membershipTier}</p>
                                  </div>
                                </div>

                                <div className="flex justify-end gap-2">
                                  <Button variant="outline">Adjust Points</Button>
                                  <Button>Send Message</Button>
                                </div>
                              </div>
                            )}
                          </DialogContent> */}
                        </Dialog>
                      </td>
                    </tr>
                  ))}
                  {paginatedUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">
                        No users match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination>
                    <PaginationPrevious
                      onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationLink
                        key={page}
                        isActive={page === currentPage}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </PaginationLink>
                    ))}
                    <PaginationNext
                      onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </Pagination>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
