import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-[#0A1128] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-4 gap-8 text-center md:text-left">
          {/* Company Info */}
          <div className="space-y-3">
            <img src="/images/logo.avif" alt="Dynasty" className="h-20 md:h-24 w-auto mx-auto md:mx-0" />
            <p className="text-sm text-gray-400">
              Independent insurance agency helping Americans find quality healthcare coverage.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white">Coverage Options</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                  All Plans
                </Link>
              </li>
              <li>
                <Link href="/individual" className="text-gray-400 hover:text-white transition-colors">
                  Individual Coverage
                </Link>
              </li>
              <li>
                <Link href="/family" className="text-gray-400 hover:text-white transition-colors">
                  Family Coverage
                </Link>
              </li>
              <li>
                <Link href="/ppo" className="text-gray-400 hover:text-white transition-colors">
                  PPO Coverage
                </Link>
              </li>
              <li>
                <Link href="/cobra" className="text-gray-400 hover:text-white transition-colors">
                  COBRA Alternatives
                </Link>
              </li>
              <li>
                <Link href="/self-employed" className="text-gray-400 hover:text-white transition-colors">
                  Self-Employed Coverage
                </Link>
              </li>
              <li>
                <Link href="/business" className="text-gray-400 hover:text-white transition-colors">
                  Group Health Benefits
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Get Started */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white">Get Started</h3>
            <p className="text-sm text-gray-400">
              See your private PPO options in 90 seconds.
            </p>
            <Link
              href="/individual"
              className="inline-flex items-center justify-center w-full md:w-auto px-5 h-11 rounded-md bg-[#D4AF37] text-[#0A1128] hover:bg-[#c9a430] font-semibold text-base transition-colors"
            >
              Find My Plan
            </Link>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm text-gray-400">
          <p className="mb-2">
            &copy; 2026 Holy Impact Media, LLC. All rights reserved.
          </p>
          <p className="text-xs max-w-3xl mx-auto">
            This website is operated by Holy Impact Media, LLC, a marketing company and lead generation service.
            Holy Impact Media is not an insurance agency. Dynasty Insurance Group is an independent licensed insurance
            agency and is not affiliated with or endorsed by any government entity, Healthcare.gov, or the Centers for
            Medicare &amp; Medicaid Services. Holy Impact Media connects consumers with Dynasty Insurance Group and its
            licensed agents. We may receive compensation for leads provided.
          </p>
        </div>
      </div>
    </footer>
  )
}
