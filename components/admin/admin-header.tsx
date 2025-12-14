"use client"

import { useState } from "react"
import { useAdmin } from "@/components/admin-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { LanguageSwitcher } from "@/components/admin/language-switcher"
import { useTranslations } from 'next-intl'
import { toast } from "sonner"

export function AdminHeader() {
  const { profile, user, signOut, isLoading } = useAdmin()
  const router = useRouter()
  const t = useTranslations()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    if (signingOut) return

    setSigningOut(true)
    try {
      await signOut()
      toast.success("Signed out successfully")
      router.push("/admin/login")
      // Force a hard reload to clear all state
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = "/admin/login"
        }, 100)
      }
    } catch (error) {
      console.error("Sign out error:", error)
      toast.error("Failed to sign out")
      setSigningOut(false)
    }
  }

  if (isLoading || !user) return null

  const displayName = profile?.full_name || user.email || "Administrator"
  const role = profile?.role ?? "support"
  const badgeLetter = displayName.charAt(0).toUpperCase()

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6">
      <div>
        <h2 className="text-lg font-semibold">{t('header.welcomeBack', { name: displayName })}</h2>
        <p className="text-sm text-muted-foreground capitalize">{t('header.account', { role })}</p>
      </div>

      <div className="flex items-center gap-4">
        <LanguageSwitcher />

        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar>
              <AvatarFallback className="bg-gradient-to-br from-teal-500 to-coral-500 text-white">
                {badgeLetter}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            {t('common.profile')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSignOut} disabled={signingOut}>
            <LogOut className="mr-2 h-4 w-4" />
            {signingOut ? "Signing out..." : t('common.signOut')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  )
}
