import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database, ExternalLink } from "lucide-react"

export function SetupRequired({ page }: { page: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1128] via-[#1a2744] to-[#0A1128] flex items-center justify-center p-6">
      <Card className="w-full max-w-lg bg-white/5 border-white/10 backdrop-blur-sm p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mx-auto">
          <Database className="w-8 h-8 text-[#D4AF37]" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Supabase Not Configured</h1>
          <p className="text-gray-400">
            The {page} dashboard needs Supabase environment variables to load. Set
            <code className="mx-1 px-1.5 py-0.5 rounded bg-white/10 text-[#D4AF37] text-xs">NEXT_PUBLIC_SUPABASE_URL</code>
            and
            <code className="mx-1 px-1.5 py-0.5 rounded bg-white/10 text-[#D4AF37] text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
            in your environment, then redeploy.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button asChild className="bg-[#D4AF37] text-[#0A1128] hover:bg-[#D4AF37]/90 font-semibold">
            <a href="https://vercel.com/docs/projects/environment-variables" target="_blank" rel="noopener noreferrer">
              Set Vercel Env Vars
              <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </Button>
          <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
