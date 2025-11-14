import { NextResponse } from "next/server"
import { Resend } from "resend"
import { createSupabaseServerClient } from "@/lib/supabase/server"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ success: false, error: "Email is required" })
  }

  const supabase = await createSupabaseServerClient()

  // IMPORTANT: redirect to /auth/callback (NOT admin)
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
  })
  

  if (error) {
    return NextResponse.json({ success: false, error: error.message })
  }

  await resend.emails.send({
    from: "Wandering Lens <no-reply@wanderinglens.com>",
    to: email,
    subject: "Reset your password",
    html: `<p>Click to reset:</p><p><a href="${data?.action_link}" target="_self">Reset password</a></p>`,
  })

  return NextResponse.json({ success: true })
}
