import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getDashboardData } from "@/lib/supabase/admin-data"
import DashboardClient from "./DashboardClient"

export const revalidate = 60 // cache for 60 seconds

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient()

  const data = await getDashboardData(supabase)

  return <DashboardClient data={data} />
}
