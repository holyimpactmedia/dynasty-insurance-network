import Link from "next/link"
import { AuthShell } from "@/components/auth/AuthShell"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

// Fixed copy only. The page no longer echoes a ?message= value, so nobody can
// craft a Dynasty-branded page that says whatever they want.
export default function AuthErrorPage() {
  return (
    <AuthShell
      title="Authentication Error"
      description="There was a problem signing you in. Please try again."
      icon={
        <div className="p-3 rounded-full bg-red-500/20">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
      }
    >
      <CardContent className="space-y-4">
        <Button asChild className="w-full bg-[#D4AF37] text-[#0A1128] hover:bg-[#D4AF37]/90">
          <Link href="/auth/login">Try Again</Link>
        </Button>
        <Button asChild variant="outline" className="w-full bg-transparent border-white/20 text-white hover:bg-white/10">
          <Link href="/">Back to Home</Link>
        </Button>
      </CardContent>
    </AuthShell>
  )
}
