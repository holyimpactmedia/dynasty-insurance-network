import { Suspense } from "react"
import LoginForm from "./LoginForm"
import { getPlatformProvider } from "@/lib/platform/provider"

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#0A1128] via-[#1a2744] to-[#0A1128] flex items-center justify-center p-4">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <LoginForm provider={getPlatformProvider()} />
    </Suspense>
  )
}
