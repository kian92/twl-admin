import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const { data, error } = await supabase.from("users").select("*").eq("id", id).single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ user: data }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
