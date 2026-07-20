import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database, ExternalLink } from "lucide-react"
import { UnionLogo, dotGrid } from "@/components/union/brand"

export function SetupRequired({ page }: { page: string }) {
  return (
    <div
      className="relative min-h-screen overflow-hidden flex items-center justify-center p-6"
      style={{
        background:
          "linear-gradient(165deg, var(--color-navy) 0%, var(--color-navy-deep) 100%)",
      }}
    >
      {/* Same navy treatment as AuthShell, but this screen has a different
          content shape (wider card, no logo lockup), so it carries the two
          background layers itself rather than reusing that component. */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={dotGrid} />

      <div className="relative w-full max-w-lg">
        <div className="mb-7 flex justify-center">
          <UnionLogo size={40} onDark />
        </div>
        <Card className="p-8 text-center space-y-6 rounded-2xl shadow-[0_30px_70px_-30px_rgba(4,16,31,0.7)]">
          <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center mx-auto">
            <Database className="w-8 h-8 text-navy" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold text-navy">Database Not Configured</h1>
            <p className="text-body">
              The {page} dashboard needs the database configured. Set{" "}
              <code className="px-1.5 py-0.5 rounded bg-surface-2 text-navy text-xs">
                DATABASE_URL + BETTER_AUTH_SECRET + BETTER_AUTH_URL
              </code>{" "}
              in your environment, then redeploy.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button asChild className="bg-red text-white font-bold hover:bg-red/90">
              <a href="https://vercel.com/docs/projects/environment-variables" target="_blank" rel="noopener noreferrer">
                Set Vercel Env Vars
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
