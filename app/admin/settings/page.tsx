"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useAdmin } from "@/components/admin-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

export default function SettingsPage() {
  const t = useTranslations('settings')
  const { profile, user, supabase } = useAdmin()
  const [fullName, setFullName] = useState(profile?.full_name || "")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordStatus, setPasswordStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const isAdmin = profile?.role === "admin"
  const [sgdRate, setSgdRate] = useState("")
  const [myrRate, setMyrRate] = useState("")
  const [loadingFxRates, setLoadingFxRates] = useState(true)
  const [savingFxRates, setSavingFxRates] = useState(false)

  useEffect(() => {
    if (!isAdmin) {
      setLoadingFxRates(false)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const response = await fetch("/api/admin/fx-rates")
        const payload = await response.json().catch(() => [])
        if (!response.ok) throw new Error(payload?.error ?? t('fxRates.loadFailed'))
        if (cancelled) return

        const rows = Array.isArray(payload) ? payload : []
        const sgd = rows.find((row: any) => row.currency_code === "SGD")
        const myr = rows.find((row: any) => row.currency_code === "MYR")
        if (sgd) setSgdRate(String(sgd.rate_to_usd))
        if (myr) setMyrRate(String(myr.rate_to_usd))
      } catch (err: any) {
        if (!cancelled) toast.error(err?.message || t('fxRates.loadFailed'))
      } finally {
        if (!cancelled) setLoadingFxRates(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isAdmin, t])

  const handleSaveFxRates = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingFxRates(true)
    try {
      const updates = [
        { currency_code: "SGD" as const, rate_to_usd: Number(sgdRate) },
        { currency_code: "MYR" as const, rate_to_usd: Number(myrRate) },
      ]

      for (const update of updates) {
        const response = await fetch("/api/admin/fx-rates", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(update),
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(payload?.error ?? t('fxRates.saveFailed'))
      }

      toast.success(t('fxRates.saved'))
    } catch (err: any) {
      toast.error(err?.message || t('fxRates.saveFailed'))
    } finally {
      setSavingFxRates(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.id) return

    setSavingProfile(true)
    try {
      const { error } = await supabase
        .from("admin_profiles")
        // @ts-expect-error - Supabase type inference issue
        .update({
          full_name: fullName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (error) throw error

      toast.success(t('messages.profileUpdated'))
    } catch (err: any) {
      console.error("Failed to update profile:", err)
      toast.error(err?.message || t('messages.failedToUpdateProfile'))
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error(t('messages.passwordsDoNotMatch'))
      return
    }

    if (newPassword.length < 6) {
      toast.error(t('messages.passwordTooShort'))
      return
    }

    setChangingPassword(true)
    setPasswordStatus(null)

    try {
      const response = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error ?? t('messages.failedToChangePassword'))
      }

      setPasswordStatus({ type: "success", message: t('messages.passwordChangeSuccess') })
      toast.success(t('messages.passwordChanged'))
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      const message = err?.message || t('messages.failedToChangePassword')
      setPasswordStatus({ type: "error", message })
      toast.error(message)
    } finally {
      setChangingPassword(false)
    }
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('loadingProfile')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t('profileInformation.title')}</CardTitle>
          <CardDescription>{t('profileInformation.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('profileInformation.emailAddress')}</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">{t('profileInformation.emailCannotChange')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">{t('profileInformation.fullName')}</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('profileInformation.fullNamePlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">{t('profileInformation.role')}</Label>
              <Input
                id="role"
                value={profile.role || ""}
                disabled
                className="bg-muted capitalize"
              />
              <p className="text-xs text-muted-foreground">{t('profileInformation.roleAssignedByAdmin')}</p>
            </div>

            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? t('profileInformation.saving') : t('profileInformation.saveChanges')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>{t('changePassword.title')}</CardTitle>
          <CardDescription>{t('changePassword.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('changePassword.newPassword')}</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('changePassword.newPasswordPlaceholder')}
                minLength={6}
                required
              />
              <p className="text-xs text-muted-foreground">{t('changePassword.minimumCharacters')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('changePassword.confirmNewPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('changePassword.confirmPasswordPlaceholder')}
                minLength={6}
                required
              />
            </div>

            <Button type="submit" disabled={changingPassword}>
              {changingPassword ? t('changePassword.changingPassword') : t('changePassword.changePassword')}
            </Button>
            {passwordStatus && (
              <p
                className={`text-sm ${
                  passwordStatus.type === "success" ? "text-green-600" : "text-red-600"
                }`}
              >
                {passwordStatus.message}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* FX Rates (admin only) */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>{t('fxRates.title')}</CardTitle>
            <CardDescription>{t('fxRates.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveFxRates} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sgdRate">{t('fxRates.sgdLabel')}</Label>
                <Input
                  id="sgdRate"
                  type="number"
                  min="0"
                  step="0.0001"
                  value={sgdRate}
                  onChange={(e) => setSgdRate(e.target.value)}
                  disabled={loadingFxRates}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="myrRate">{t('fxRates.myrLabel')}</Label>
                <Input
                  id="myrRate"
                  type="number"
                  min="0"
                  step="0.0001"
                  value={myrRate}
                  onChange={(e) => setMyrRate(e.target.value)}
                  disabled={loadingFxRates}
                  required
                />
              </div>

              <Button type="submit" disabled={savingFxRates || loadingFxRates}>
                {savingFxRates ? t('fxRates.saving') : t('fxRates.saveChanges')}
              </Button>
              <p className="text-xs text-muted-foreground">{t('fxRates.note')}</p>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
