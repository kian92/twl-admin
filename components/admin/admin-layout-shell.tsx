"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { Session } from "@supabase/supabase-js"

import { AdminProvider, type AdminProfile, useAdmin } from "@/components/admin-context"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"

function AdminLayoutContent({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAdmin()
  const router = useRouter()
  const pathname = usePathname()

  const publicRoutes = [
    "/admin/login",
    "/auth/callback",          
    "/reset-password",         
    "/forgot-password",
  ]

  const isPublic = publicRoutes.includes(pathname)

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated && !isPublic) {
      router.push("/admin/login")
    }
  }, [isAuthenticated, isPublic, pathname, router, isLoading])

  if (isPublic) {
    return <>{children}</>
  }

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}

interface AdminLayoutShellProps {
  children: ReactNode
  initialSession: Session | null
  initialProfile: AdminProfile | null
}

export function AdminLayoutShell({ children, initialSession, initialProfile }: AdminLayoutShellProps) {
  return (
    <AdminProvider initialSession={initialSession} initialProfile={initialProfile}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminProvider>
  )
}
