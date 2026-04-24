import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? searchParams.get("redirectTo") ?? "/dashboard/agent"

  const errorRedirect = (msg: string) =>
    NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent(msg)}`)

  if (!code) return errorRedirect("Missing authentication code.")

  const supabase = await createClient()
  if (!supabase) return errorRedirect("Authentication is not configured. Set Supabase environment variables.")

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return errorRedirect(error.message)

  const forwardedHost = request.headers.get("x-forwarded-host")
  const isLocalEnv = process.env.NODE_ENV === "development"

  if (isLocalEnv || !forwardedHost) {
    return NextResponse.redirect(`${origin}${next}`)
  }
  return NextResponse.redirect(`https://${forwardedHost}${next}`)
}
