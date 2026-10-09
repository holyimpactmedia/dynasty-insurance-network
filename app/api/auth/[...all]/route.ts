import { NextResponse } from "next/server"
import { isPlatformConfigured } from "@/lib/platform/provider"

export const runtime = "nodejs"

// Fail closed: with the database, secret or site URL missing, refuse every
// auth call before Better Auth (and its placeholder fallbacks) ever loads.
// The lazy import also keeps `next build` from evaluating lib/auth/server.ts.
async function handler(request: Request): Promise<Response> {
  if (!isPlatformConfigured()) {
    return NextResponse.json({ message: "Sign-in is not configured yet." }, { status: 503 })
  }
  const { auth } = await import("@/lib/auth/server")
  return auth.handler(request)
}

export const GET = handler
export const POST = handler
