"use client"

import { useEffect, useMemo, useState } from "react"
import { useAdmin } from "@/components/admin-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Eye, Award } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { getCustomers } from "@/lib/supabase/admin-data"
import type { Database } from "@/types/database"

type CustomerRow = Database["public"]["Tables"]["customer_profiles"]["Row"]

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "short",
  day: "numeric",
})

const normalizeDate = (value: string | null) => {
  if (!value) return null
  return new Date(`${value}T12:00:00.000Z`)
}

export default function UsersPage() {
  const { supabase } = useAdmin()
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [tierFilter, setTierFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<CustomerRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadCustomers = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getCustomers(supabase)
        if (!isMounted) return
        setCustomers(data as CustomerRow[])
      } catch (err) {
        console.error("Failed to load customers", err)
        if (!isMounted) return
        setError("Unable to load customers. Please try again.")
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadCustomers()

    return () => {
      isMounted = false
    }
  }, [supabase])

  const tiers = useMemo(() => {
    const unique = new Set<string>()
    customers.forEach((customer) => unique.add(customer.membership_tier))
    return ["all", ...Array.from(unique)]
  }, [customers])

  const filteredUsers = useMemo(() => {
    return customers.filter((user) => {
      const matchesSearch =
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesTier = tierFilter === "all" || user.membership_tier === tierFilter
      return matchesSearch && matchesTier
    })
  }, [customers, searchQuery, tierFilter])

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "explorer":
        return "bg-blue-100 text-blue-700"
      case "adventurer":
        return "bg-purple-100 text-purple-700"
      case "voyager":
        return "bg-amber-100 text-amber-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getTierBenefits = (tier: string) => {
    switch (tier) {
      case "explorer":
        return ["5% discount on bookings", "Monthly newsletter", "Basic support"]
      case "adventurer":
        return [
          "10% discount on bookings",
          "Early access to new experiences",
          "Free add-ons (up to $20)",
          "Priority support",
          "Referral bonus: 200 points",
        ]
      case "voyager":
        return [
          "15% discount on bookings",
          "Exclusive experiences",
          "Free add-ons (up to $50)",
          "VIP support",
          "Referral bonus: 500 points",
          "Complimentary upgrades",
        ]
      default:
        return []
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage users and membership tiers ({customers.length.toLocaleString()} total customers)
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={tierFilter} onValueChange={setTierFilter}>
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
        </Select>
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
                    <th className="text-left p-4 font-medium">Membership</th>
                    <th className="text-left p-4 font-medium">Points</th>
                    <th className="text-left p-4 font-medium">Bookings</th>
                    <th className="text-left p-4 font-medium">Total Spent</th>
                    <th className="text-left p-4 font-medium">Joined</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const tierKey = user.membership_tier.toLowerCase()
                    return (
                      <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-gradient-to-br from-teal-500 to-coral-500 text-white">
                              {user.full_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={getTierColor(tierKey)}>{user.membership_tier}</Badge>
                      </td>
                      <td className="p-4 font-medium">{user.points_balance.toLocaleString()}</td>
                      <td className="p-4">{user.total_bookings}</td>
                      <td className="p-4 font-semibold">${user.total_spent.toFixed(2)}</td>
                      <td className="p-4">
                        {user.joined_at ? dateFormatter.format(normalizeDate(user.joined_at)!) : "—"}
                      </td>
                      <td className="p-4 capitalize">{user.status}</td>
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
                          <DialogContent className="max-w-xl">
                            <DialogHeader>
                              <DialogTitle>{selectedUser?.full_name}</DialogTitle>
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
                                    {selectedUser.joined_at
                                      ? dateFormatter.format(normalizeDate(selectedUser.joined_at)!)
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
                                    {getTierBenefits(selectedUser.membership_tier.toLowerCase()).map((benefit) => (
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
                                    <p className="text-sm font-semibold">{selectedUser.points_balance.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <Label>Membership Tier</Label>
                                    <p className="text-sm font-semibold capitalize">{selectedUser.membership_tier}</p>
                                  </div>
                                </div>

                                <div className="flex justify-end gap-2">
                                  <Button variant="outline">Adjust Points</Button>
                                  <Button>Send Message</Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  )
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-sm text-muted-foreground">
                      No users match the current filters.
                    </td>
                  </tr>
                )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
