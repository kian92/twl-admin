"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Eye } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Pagination,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"

// Users table schema (not in database.ts yet)
type UserRow = {
  id: string
  name: string | null
  email: string
  password: string | null
  image: string | null
  provider: string | null
  membershipTier: string | null
  points: number | null
  joinedDate: string | null
  last_login: string | null
  created_at: string | null
  updated_at: string | null
  status: string
  total_bookings?: number | null
  total_spent?: number | null
}

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
  const hasTimezone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(value)
  const dateString = hasTimezone ? value : value + "Z"
  const date = new Date(dateString)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatDate = (value: string | null, fallback: string) => {
  const date = normalizeDate(value)
  return date ? dateFormatter.format(date) : fallback
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
  const router = useRouter()
  const [customers, setCustomers] = useState<UserRow[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      return matchesSearch
    })
  }, [customers, searchQuery])

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
                    <th className="text-left p-4 font-medium">Last Login</th>
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
                        {formatDate(user.joinedDate, "—")}
                      </td>
                      <td className="p-4">
                        {formatDate(user.last_login, "Never")}
                      </td>
                      <td className="p-4">{getStatusBadge(user.status)}</td>
                      <td className="p-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {paginatedUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">
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
