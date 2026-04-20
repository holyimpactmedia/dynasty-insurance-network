import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1128] via-[#1a2744] to-[#0A1128] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-red-500/20">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl text-white">Authentication Error</CardTitle>
            <CardDescription className="text-gray-400">
              There was a problem signing you in. Please try again.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full bg-[#D4AF37] text-[#0A1128] hover:bg-[#D4AF37]/90">
            <Link href="/auth/login">Try Again</Link>
          </Button>
          <Button asChild variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
            <Link href="/">Back to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
