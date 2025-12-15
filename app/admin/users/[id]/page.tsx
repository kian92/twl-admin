"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft } from "lucide-react"
// Using any type since 'users' table schema is flexible and not fully defined in database types
type UserRow = any

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

export default function UserDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [user, setUser] = useState<UserRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadUser = async () => {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/users/${userId}`)
        if (!res.ok) throw new Error("Failed to fetch user")

        const result = await res.json()
        if (!isMounted) return

        setUser(result.user)
      } catch (err) {
        console.error("Failed to load user", err)
        if (!isMounted) return
        setError("Unable to load user details. Please try again.")
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void loadUser()

    return () => {
      isMounted = false
    }
  }, [userId])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4 text-sm text-red-700">
            {error ?? "User not found"}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" disabled>
            Edit User
          </Button>
          <Button disabled>Send Email</Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarFallback className="bg-gradient-to-br from-teal-500 to-coral-500 text-white text-3xl">
            {user.name?.charAt(0) ?? "?"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{user.name ?? "Unknown"}</h1>
          <p className="text-muted-foreground">{user.email ?? "—"}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">User Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-sm mt-1">{user.email ?? "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge(user.status)}</div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Joined Date</p>
                <p className="text-sm mt-1">
                  {user.joinedDate ? dateFormatter.format(normalizeDate(user.joinedDate)!) : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Login</p>
                <p className="text-sm mt-1">
                  {user.last_login ? dateFormatter.format(normalizeDate(user.last_login)!) : "Never"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">Booking Statistics</h2>
            <div className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="text-3xl font-bold mt-1">{user.total_bookings ?? 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-3xl font-bold mt-1">${user.total_spent?.toFixed(2) ?? "0.00"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Booking Value</p>
                <p className="text-3xl font-bold mt-1">
                  $
                  {user.total_bookings && user.total_bookings > 0
                    ? ((user.total_spent ?? 0) / user.total_bookings).toFixed(2)
                    : "0.00"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="text-sm text-muted-foreground">
            <p>No recent activity data available.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
