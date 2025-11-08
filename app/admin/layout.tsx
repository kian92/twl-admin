import type { ReactNode } from "react"
import type { Session } from "@supabase/supabase-js"

import { AdminLayoutShell } from "@/components/admin/admin-layout-shell"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { AdminProfile, AdminRole } from "@/components/admin-context"
import type { Database } from "@/types/database"

export const dynamic = "force-dynamic"

const normalizeRole = (role?: string | null): AdminRole => {
  if (role === "admin" || role === "manager" || role === "support") {
    return role
  }
  return "support"
}

async function getInitialState(): Promise<{
  session: Session | null
  profile: AdminProfile | null
}> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    console.error("Failed to read server auth session", sessionError)
  }

  if (!session?.user) {
    return { session: null, profile: null }
  }

  type AdminProfileRow = Pick<Database["public"]["Tables"]["admin_profiles"]["Row"], "id" | "full_name" | "role" | "avatar_url">

  const { data, error } = await supabase
    .from("admin_profiles")
    .select("id, full_name, role, avatar_url")
    .eq("id", session.user.id)
    .maybeSingle<AdminProfileRow>()

  if (error) {
    console.error("Failed to fetch admin profile on server", error)
    return { session, profile: null }
  }

  if (!data) {
    return { session, profile: null }
  }

  return {
    session,
    profile: {
      id: data.id,
      full_name: data.full_name,
      role: normalizeRole(data.role),
      avatar_url: data.avatar_url,
    },
  }
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { session, profile } = await getInitialState()

  return (
    <AdminLayoutShell initialSession={session} initialProfile={profile}>
      {children}
    </AdminLayoutShell>
  )
}
