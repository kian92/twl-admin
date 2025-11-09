"use client"

import { useCallback, useEffect, useState } from "react"
import { ShieldCheck, Mail, UserPlus } from "lucide-react"

import { useAdmin } from "@/components/admin-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { Database } from "@/types/database"

type StaffMember = Database["public"]["Tables"]["admin_profiles"]["Row"]

const roleDescriptions: Record<string, string> = {
  admin: "Full access to manage settings, staff, and platform configuration.",
  manager: "Manage experiences, bookings, and customer operations.",
  support: "View data needed for support workflows.",
}

const ROLE_OPTIONS: Array<{ label: string; value: "admin" | "manager" | "support" }> = [
  { label: "Administrator", value: "admin" },
  { label: "Manager", value: "manager" },
  { label: "Support", value: "support" },
]

const formatDate = (value?: string | null) => {
  if (!value) return "—"
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value))
}

const roleBadgeStyles = (role: string) => {
  switch (role) {
    case "admin":
      return "bg-rose-100 text-rose-700"
    case "manager":
      return "bg-blue-100 text-blue-700"
    case "support":
    default:
      return "bg-emerald-100 text-emerald-700"
  }
}

export default function StaffPage() {
  const { profile } = useAdmin()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteName, setInviteName] = useState("")
  const [invitePassword, setInvitePassword] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "manager" | "support">("support")
  const [inviteStatus, setInviteStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const loadStaff = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/staff")
      const payload = (await response.json().catch(() => null)) as StaffMember[] | { error?: string } | null
      if (!response.ok) {
        const message = (payload as { error?: string } | null)?.error ?? "Unable to load staff directory. Please try again."
        throw new Error(message)
      }
      setStaff(Array.isArray(payload) ? payload : [])
    } catch (err) {
      console.error("Failed to load staff directory", err)
      setError(err instanceof Error ? err.message : "Unable to load staff directory. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStaff()
  }, [loadStaff])

  const canInvite = profile?.role === "admin"

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault()
    setInviteStatus(null)
    setSubmitting(true)

    try {
      const response = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          full_name: inviteName,
          password: invitePassword,
          role: inviteRole,
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to create account")
      }

      setInviteStatus({ type: "success", message: "Account created successfully." })
      setInviteEmail("")
      setInviteName("")
      setInvitePassword("")
      setInviteRole("support")
      await loadStaff()
    } catch (err) {
      console.error("Account creation error", err)
      setInviteStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to create account",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleStaffAction = async (member: StaffMember, action: "disable" | "enable" | "delete") => {
    if (action === "delete") {
      if (!window.confirm(`Permanently delete ${member.full_name ?? member.id}? This cannot be undone.`)) {
        return
      }
    }

    setInviteStatus(null)

    try {
      const endpoint = `/api/admin/staff/${member.id}`
      const options: RequestInit = action === "delete"
        ? { method: "DELETE" }
        : {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
          }

      const response = await fetch(endpoint, options)
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to update staff member")
      }

      setInviteStatus({ type: "success", message: "Staff updated." })
      await loadStaff()
    } catch (err) {
      console.error("Staff action failed", err)
      setInviteStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update staff member",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Access</h1>
          <p className="text-muted-foreground">
            Create team accounts and manage staff permissions across the admin portal.
          </p>
        </div>
        <Button variant="outline" onClick={loadStaff}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create Team Account</CardTitle>
            <CardDescription>Create a new admin account instantly with a password.</CardDescription>
          </CardHeader>
          <CardContent>
            {canInvite ? (
              <form className="space-y-4" onSubmit={handleInvite}>
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    placeholder="Jane Doe"
                    value={inviteName}
                    onChange={(event) => setInviteName(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="jane@wanderinglens.com"
                      value={inviteEmail}
                      onChange={(event) => setInviteEmail(event.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter a strong password"
                    value={invitePassword}
                    onChange={(event) => setInvitePassword(event.target.value)}
                    minLength={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as typeof inviteRole)}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{roleDescriptions[inviteRole]}</p>
                </div>

                {inviteStatus && (
                  <p
                    className={`text-sm ${
                      inviteStatus.type === "success" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {inviteStatus.message}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Creating account..." : "Create account"}
                </Button>
              </form>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Only administrators can create new team accounts. Please contact an admin if you need access changes.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role Overview</CardTitle>
            <CardDescription>Choose the level of access that best matches each teammate&apos;s responsibilities.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ROLE_OPTIONS.map((role) => (
              <div key={role.value} className="rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Badge className={roleBadgeStyles(role.value)}>{role.label}</Badge>
                  <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{roleDescriptions[role.value]}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Directory</CardTitle>
          <CardDescription>
            {staff.length.toLocaleString()} member{staff.length === 1 ? "" : "s"} have access to the admin portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          {loading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((skeleton) => (
                <div key={`staff-skeleton-${skeleton}`} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="mt-2 h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : staff.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              <UserPlus className="h-5 w-5" />
              No staff members yet. Create an account to get started.
            </div>
          ) : (
            <div className="space-y-3">
          {staff.map((member) => {
            const initials = member.full_name?.charAt(0)?.toUpperCase() ?? "?"
            return (
              <div key={member.id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.full_name ?? "Pending invite"}</p>
                    <p className="text-sm text-muted-foreground">
                      Added {formatDate(member.created_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="flex items-center gap-2 justify-end">
                    <Badge className={roleBadgeStyles(member.role || "support")}>
                      {(member.role || "support").charAt(0).toUpperCase() + (member.role || "support").slice(1)}
                    </Badge>
                    <Badge variant={member.is_active ? "outline" : "destructive"}>
                      {member.is_active ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Updated {formatDate(member.updated_at)}</p>
                  {canInvite && (
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant={member.is_active ? "outline" : "secondary"}
                        onClick={() =>
                          handleStaffAction(member, member.is_active ? "disable" : "enable")
                        }
                      >
                        {member.is_active ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleStaffAction(member, "delete")}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
