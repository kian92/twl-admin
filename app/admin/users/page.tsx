"use client"

import { useState } from "react"
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

// Mock user data
const mockUsers = [
  {
    id: "1",
    name: "Alex Explorer",
    email: "explorer@test.com",
    membershipTier: "explorer",
    points: 250,
    joinedDate: "2024-01-15",
    totalBookings: 1,
    totalSpent: 100,
    status: "active",
  },
  {
    id: "2",
    name: "Sam Adventurer",
    email: "adventurer@test.com",
    membershipTier: "adventurer",
    points: 1500,
    joinedDate: "2023-08-20",
    totalBookings: 4,
    totalSpent: 260,
    status: "active",
  },
  {
    id: "3",
    name: "Jordan Voyager",
    email: "voyager@test.com",
    membershipTier: "voyager",
    points: 5000,
    joinedDate: "2023-03-10",
    totalBookings: 8,
    totalSpent: 595,
    status: "active",
  },
  {
    id: "4",
    name: "Emily Chen",
    email: "emily@example.com",
    membershipTier: "explorer",
    points: 180,
    joinedDate: "2024-02-20",
    totalBookings: 2,
    totalSpent: 150,
    status: "active",
  },
  {
    id: "5",
    name: "Michael Brown",
    email: "michael@example.com",
    membershipTier: "adventurer",
    points: 2200,
    joinedDate: "2023-11-05",
    totalBookings: 5,
    totalSpent: 420,
    status: "inactive",
  },
]

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [tierFilter, setTierFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<(typeof mockUsers)[0] | null>(null)

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTier = tierFilter === "all" || user.membershipTier === tierFilter
    return matchesSearch && matchesTier
  })

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
        <p className="text-muted-foreground">Manage users and membership tiers</p>
      </div>

      {/* Filters */}
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
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="explorer">Explorer</SelectItem>
            <SelectItem value="adventurer">Adventurer</SelectItem>
            <SelectItem value="voyager">Voyager</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
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
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-gradient-to-br from-teal-500 to-coral-500 text-white">
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={getTierColor(user.membershipTier)}>{user.membershipTier}</Badge>
                    </td>
                    <td className="p-4 font-medium">{user.points}</td>
                    <td className="p-4">{user.totalBookings}</td>
                    <td className="p-4 font-semibold">${user.totalSpent}</td>
                    <td className="p-4">{user.joinedDate}</td>
                    <td className="p-4">
                      <Badge variant={user.status === "active" ? "default" : "secondary"}>{user.status}</Badge>
                    </td>
                    <td className="p-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setSelectedUser(user)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>User Details - {user.name}</DialogTitle>
                            <DialogDescription>Manage user information and membership</DialogDescription>
                          </DialogHeader>
                          {selectedUser && (
                            <div className="space-y-6">
                              <div className="flex items-center gap-4">
                                <Avatar className="w-16 h-16">
                                  <AvatarFallback className="bg-gradient-to-br from-teal-500 to-coral-500 text-white text-2xl">
                                    {selectedUser.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                                  <p className="text-muted-foreground">{selectedUser.email}</p>
                                </div>
                              </div>

                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  <Label className="text-muted-foreground">Membership Tier</Label>
                                  <Select defaultValue={selectedUser.membershipTier}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="explorer">Explorer</SelectItem>
                                      <SelectItem value="adventurer">Adventurer</SelectItem>
                                      <SelectItem value="voyager">Voyager</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Reward Points</Label>
                                  <Input type="number" defaultValue={selectedUser.points} />
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Total Bookings</Label>
                                  <p className="font-medium text-lg">{selectedUser.totalBookings}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Total Spent</Label>
                                  <p className="font-medium text-lg">${selectedUser.totalSpent}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Joined Date</Label>
                                  <p className="font-medium">{selectedUser.joinedDate}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Account Status</Label>
                                  <Select defaultValue={selectedUser.status}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="active">Active</SelectItem>
                                      <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div>
                                <Label className="text-muted-foreground mb-2 block">Current Tier Benefits</Label>
                                <div className="space-y-2">
                                  {getTierBenefits(selectedUser.membershipTier).map((benefit, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded">
                                      <Award className="w-4 h-4 text-primary" />
                                      <span className="text-sm">{benefit}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button>Save Changes</Button>
                                <Button variant="outline">Add Bonus Points</Button>
                                <Button variant="outline">View Booking History</Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No users found matching your criteria</p>
        </div>
      )}
    </div>
  )
}
