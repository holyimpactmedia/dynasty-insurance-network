import Link from "next/link"
import { AuthShell } from "@/components/auth/AuthShell"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams
  const detail = message?.trim() || "There was a problem signing you in. Please try again."

  return (
    <AuthShell
      title="Authentication Error"
      description={detail}
      icon={
        <div className="p-3 rounded-full bg-red-50">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
      }
    >
      <CardContent className="space-y-3">
        <Button asChild className="w-full h-11 bg-red text-white font-bold hover:bg-red/90">
          <Link href="/auth/login">Try Again</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/">Back to Home</Link>
        </Button>
      </CardContent>
    </AuthShell>
  )
}
