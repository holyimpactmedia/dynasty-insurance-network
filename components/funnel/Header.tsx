// Shared funnel header (logo on navy). Previously inlined in every funnel page.
export function FunnelHeader() {
  return (
    <header className="w-full py-4 px-6 flex items-center justify-center border-b bg-[#0A1128]">
      <img src="/images/logo.avif" alt="Dynasty" className="h-16 w-auto" />
    </header>
  )
}
