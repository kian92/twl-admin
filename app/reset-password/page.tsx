"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"

export default function ResetPasswordPage() {
  const supabase = createSupabaseBrowserClient()
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus("")

    const { error } = await supabase.auth.updateUser({ password })

    setLoading(false)

    // if (error) setStatus(error.message)
    // else setStatus("Password updated. You may now log in.")
    if (error) {
      setStatus(error.message)
    } else {
      setStatus("Password updated! Redirecting to login...")

      // Redirect after slight delay (optional)
      setTimeout(() => {
        router.push("/admin/login")
      }, 1500)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">Set New Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {status && <p className="text-sm">{status}</p>}

            <Button className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Save Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
