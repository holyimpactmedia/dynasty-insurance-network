import { UnionLogo } from "@/components/union/brand"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <a href="/">
            <UnionLogo size={44} />
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last Updated: May 7, 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              This Privacy Policy describes how Holy Impact Media, LLC (&ldquo;Holy Impact Media,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
              &ldquo;our&rdquo;), the operator of this website (the &ldquo;Site&rdquo;), collects, uses, shares, and protects
              information about you. By using the Site, you agree to the practices described here.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Because we collect information used to apply for insurance products, we are subject to the federal
              Gramm-Leach-Bliley Act (GLBA) and corresponding state insurance privacy regulations. This policy serves
              as our GLBA Privacy Notice in addition to general consumer privacy law disclosures.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>
            <h3 className="text-xl font-semibold mb-2 mt-4">2.1 Information You Provide</h3>
            <p className="text-muted-foreground leading-relaxed mb-2">
              We collect personal information that you voluntarily provide when using the Site, including:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Name and contact information (email, phone, mailing address)</li>
              <li>Date of birth and age</li>
              <li>Location information (ZIP code, city, state)</li>
              <li>Household size and composition</li>
              <li>Estimated annual household income range</li>
              <li>Current insurance status and coverage needs</li>
              <li>General health-related preferences relevant to plan matching (e.g. whether you have a significant medical history)</li>
              <li>Communications consent records (TCPA / FTSA / state telemarketing law consents and TrustedForm certificates)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">2.2 Automatically Collected Information</h3>
            <p className="text-muted-foreground leading-relaxed mb-2">
              We automatically collect certain information when you visit the Site:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>IP address and device identifiers</li>
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Pages visited, time spent, and click events</li>
              <li>Referring website or source (UTM parameters)</li>
              <li>Date and time of visit</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">2.3 Sensitive Personal Information</h3>
            <p className="text-muted-foreground leading-relaxed">
              We do not knowingly collect Social Security numbers, government identification numbers, financial
              account numbers, precise geolocation, biometric data, racial or ethnic origin, religious beliefs, sexual
              orientation, or detailed medical records through the Site. If a licensed insurance agent later requires
              this information to complete an enrollment, that information is collected directly by the agent or
              carrier under their own privacy practices and is not retained by Holy Impact Media.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Connect you with licensed insurance agents who can present coverage options</li>
              <li>Provide private health insurance plan recommendations</li>
              <li>Communicate with you about insurance products and follow up on your inquiry</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Improve the Site and our services</li>
              <li>Comply with legal, regulatory, and audit obligations</li>
              <li>Prevent fraud and maintain security</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Information Sharing and Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Lead Recipients:</strong> Holy Impact Media shares your information
              with Dynasty Forever LLC, operated by licensed independent insurance agents, and the US Health Advisors agent
              network so that licensed agents can present you with coverage options. Compensation we receive for
              providing qualified leads is described in our Terms of Use.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">4.1 Licensed Insurance Agents</h3>
            <p className="text-muted-foreground leading-relaxed">
              We share your information with licensed insurance agents and brokers who can help you evaluate and
              enroll in private health insurance plans. Those agents are independent contractors or employees who are
              licensed in the state where you reside.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">4.2 Insurance Carriers</h3>
            <p className="text-muted-foreground leading-relaxed">
              With your consent, we and our licensed insurance partners may share your information with insurance
              carriers to obtain quotes and process applications.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">4.3 Service Providers</h3>
            <p className="text-muted-foreground leading-relaxed">
              We share information with third-party service providers performing services on our behalf, including
              hosting and database infrastructure (Vercel, Neon), email delivery (Resend), TCPA proof-of-consent (TrustedForm by ActiveProspect),
              analytics (Google Analytics), and lead distribution (LeadArena / USHA Marketplace). These providers are
              contractually obligated to protect your information and use it only for the purposes we specify.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">4.4 Legal Requirements</h3>
            <p className="text-muted-foreground leading-relaxed">
              We may disclose information if required by law, subpoena, court order, or government regulation, or if
              we believe disclosure is necessary to protect our rights, your safety, or the safety of others.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">4.5 Business Transfers</h3>
            <p className="text-muted-foreground leading-relaxed">
              If Holy Impact Media is involved in a merger, acquisition, or sale of all or part of its assets, your
              information may be transferred to the acquiring entity, subject to this Privacy Policy.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">4.6 We Do Not Sell Your Information for Advertising</h3>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your information to data brokers, advertisers, or unrelated third parties for their own
              marketing. Routing your information to a licensed insurance partner so a real agent can contact you is
              considered &ldquo;sharing&rdquo; or &ldquo;selling&rdquo; under some state laws (see Section 11 below). You can opt
              out at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. GLBA Privacy Notice (Insurance Information)</h2>
            <p className="text-muted-foreground leading-relaxed">
              Because we collect personal information used to apply for an insurance product, we are subject to the
              federal Gramm-Leach-Bliley Act (GLBA) and applicable state insurance privacy laws.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              <strong className="text-foreground">Categories of nonpublic personal information we collect:</strong>{" "}
              identifiers (name, email, phone, mailing address); demographic information (age, household composition,
              estimated income range); and limited insurance-related information (current coverage status, general
              coverage preferences, qualifying-event status).
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              <strong className="text-foreground">How we share it:</strong> with our licensed insurance partners,
              their carriers, and our service providers as described in Section 4. We do not share or disclose
              nonpublic personal information for marketing purposes unrelated to the insurance services you requested.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              <strong className="text-foreground">Your right to opt out of certain sharing:</strong> Under GLBA and
              corresponding state insurance regulations, you have the right to opt out of certain disclosures of your
              nonpublic personal information to nonaffiliated third parties. To opt out, email{" "}
              <a href="mailto:privacy@holyimpactmedia.com?subject=GLBA%20Opt-Out" className="text-navy underline">
                privacy@holyimpactmedia.com
              </a>{" "}
              with the subject line &ldquo;GLBA Opt-Out.&rdquo; Note that opting out may prevent us from connecting you with
              a licensed insurance agent.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              <strong className="text-foreground">Information security:</strong> We maintain administrative, technical,
              and physical safeguards designed to protect nonpublic personal information against unauthorized access,
              disclosure, or misuse.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Cookies and Tracking Technologies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar tracking technologies to enhance your experience on the Site. Cookies are
              small files stored on your device that help us remember your preferences, understand how you use the
              Site, and improve our services. You can control cookies through your browser settings, but disabling
              cookies may limit certain Site features.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Third-Party Analytics &amp; Advertising</h2>
            <h3 className="text-xl font-semibold mb-2 mt-4">7.1 Google Analytics</h3>
            <p className="text-muted-foreground leading-relaxed">
              We use Google Analytics to understand how visitors use the Site. You can opt out by installing
              Google&apos;s opt-out browser add-on at{" "}
              <a href="https://tools.google.com/dlpage/gaoptout" className="text-navy underline" target="_blank" rel="noopener noreferrer">
                tools.google.com/dlpage/gaoptout
              </a>
              .
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">7.2 Advertising and Remarketing</h3>
            <p className="text-muted-foreground leading-relaxed">
              We may use third-party advertising services to show ads to users who have previously visited the Site.
              These services may use cookies to serve ads based on prior visits. We do not share the personal
              information you submit through quiz forms with advertisers.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">7.3 Global Privacy Control</h3>
            <p className="text-muted-foreground leading-relaxed">
              We honor browser-based Global Privacy Control (GPC) signals. If your browser sends a GPC signal, we
              treat that as a request to opt out of any sharing or sale of your personal information for cross-context
              behavioral advertising.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement reasonable administrative, technical, and physical security measures to protect your
              information from unauthorized access, disclosure, alteration, or destruction. No method of transmission
              over the Internet or electronic storage is 100% secure. We will notify affected individuals and
              regulators of a security breach involving personal information as required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain quiz submission data and TCPA consent records for at least four (4) years from the date of
              collection, the federal statute of limitations for TCPA claims, and longer where state law or
              audit/litigation needs require. Marketing-suppression and Do-Not-Call records are retained
              indefinitely. Aggregated and de-identified analytics data may be retained without time limit. When we no
              longer need your personal information, we securely delete or anonymize it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Your Rights and Choices</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">You have these rights regarding your personal information:</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Access:</strong> Request a copy of the personal information we have about you</li>
              <li><strong>Correction:</strong> Request that we correct inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request that we delete your personal information, subject to legal exceptions</li>
              <li><strong>Opt-Out of Marketing:</strong> Reply STOP to a text message, click the unsubscribe link in any email, or email us</li>
              <li><strong>Internal Do-Not-Call:</strong> Be added to our internal Do-Not-Call list. We also honor the National Do Not Call Registry as required by law.</li>
              <li><strong>Honor Global Privacy Control:</strong> See Section 7.3.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:privacy@holyimpactmedia.com" className="text-navy underline">privacy@holyimpactmedia.com</a>.
              We will verify your identity before responding.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. State Privacy Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Depending on the state where you reside, you may have additional rights under the privacy laws listed
              below. Where state law conflicts with this policy, the state-law rights apply for residents of that
              state. To exercise any of these rights, email{" "}
              <a href="mailto:privacy@holyimpactmedia.com?subject=State%20Privacy%20Request" className="text-navy underline">
                privacy@holyimpactmedia.com
              </a>{" "}
              with the subject line &ldquo;State Privacy Request&rdquo; and include your full legal name, residency
              ZIP code, and the email/phone you submitted to us. We will verify your identity and respond within the
              timeframe required by your state&apos;s law (typically 45 days, with one 45-day extension if reasonably
              necessary).
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">11.1 California (CCPA / CPRA)</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              California residents have the right to know, delete, correct, opt out of sale or sharing for
              cross-context behavioral advertising, limit use of sensitive personal information, and not face
              discrimination for exercising these rights.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              <strong className="text-foreground">Do Not Sell or Share My Personal Information:</strong> Holy Impact
              Media shares your contact information with licensed insurance partners. Under the CCPA, this transfer
              may be considered a &ldquo;sale&rdquo; or &ldquo;sharing&rdquo; of personal information. You have the right
              to opt out at any time by emailing the address above with subject line &ldquo;CCPA Opt-Out.&rdquo;
            </p>
            <p className="text-muted-foreground leading-relaxed">
              California &ldquo;Shine the Light&rdquo; (Civil Code &sect; 1798.83): California residents may request a list
              of third parties to whom we have disclosed personal information for direct-marketing purposes during the
              prior calendar year.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">11.2 Virginia (VCDPA)</h3>
            <p className="text-muted-foreground leading-relaxed">
              Virginia residents have the right to access, correct, delete, obtain a copy, and opt out of the
              processing of personal data for targeted advertising, the sale of personal data, or profiling that
              produces legal or similarly significant effects. You may also appeal a denial of these rights.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">11.3 Colorado (CPA)</h3>
            <p className="text-muted-foreground leading-relaxed">
              Colorado residents have the right to access, correct, delete, obtain a portable copy, and opt out of
              targeted advertising, the sale of personal data, or profiling. You may also appeal a denial. Colorado
              residents may use a Universal Opt-Out Mechanism (such as Global Privacy Control) to exercise opt-out
              rights.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">11.4 Connecticut (CTDPA)</h3>
            <p className="text-muted-foreground leading-relaxed">
              Connecticut residents have rights substantially similar to Colorado, including access, correction,
              deletion, portability, and opt-out of targeted advertising, sale, and significant profiling.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">11.5 Utah (UCPA)</h3>
            <p className="text-muted-foreground leading-relaxed">
              Utah residents (a serviced state) have the right to access, delete, obtain a copy of personal data, and
              opt out of the sale of personal data and targeted advertising.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">11.6 Texas (TDPSA)</h3>
            <p className="text-muted-foreground leading-relaxed">
              Texas residents (a serviced state) have rights to access, correct, delete, obtain a portable copy, and
              opt out of targeted advertising, sale of personal data, and significant profiling, under the Texas Data
              Privacy and Security Act.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">11.7 Florida (FDBR)</h3>
            <p className="text-muted-foreground leading-relaxed">
              Florida residents (a serviced state) have rights under the Florida Digital Bill of Rights to access,
              correct, delete, obtain a copy, and opt out of targeted advertising, the sale of personal data, and
              profiling. Florida residents are also covered by the Florida Telephone Solicitation Act (FTSA), and our
              communications consents are designed to comply with FTSA in addition to federal TCPA.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">11.8 Authorized Agents</h3>
            <p className="text-muted-foreground leading-relaxed">
              In every state above, you may designate an authorized agent to make a request on your behalf by
              including a signed written authorization with the request.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">12. European Privacy Rights (GDPR)</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you are located in the European Economic Area (EEA) or the United Kingdom, you have rights under the
              General Data Protection Regulation (GDPR / UK GDPR), including the right to access, rectify, erase,
              restrict processing, object to processing, and data portability. The Site is primarily directed at
              United States residents, and we do not specifically target EEA residents. If GDPR applies to you,
              contact us at <a href="mailto:privacy@holyimpactmedia.com" className="text-navy underline">privacy@holyimpactmedia.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">13. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Site is not directed to children under 18 and we do not knowingly collect personal information from
              children. If we become aware that a child has submitted information, we will delete it. If you believe
              we have collected information from a child, contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">14. Changes to This Privacy Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices or applicable
              laws. We will post the updated policy on this page and update the &ldquo;Last Updated&rdquo; date.
              Continued use of the Site after changes are posted constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">15. Third-Party Websites</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Site may contain links to third-party websites. We are not responsible for the privacy practices of
              those websites. We encourage you to review the privacy policies of any third-party sites you visit.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">16. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions, concerns, or to submit a privacy request:
            </p>
            <div className="mt-3 text-muted-foreground">
              <p className="font-medium">Holy Impact Media, LLC</p>
              <p>Attn: Privacy Officer</p>
              <p>Email: <a href="mailto:privacy@holyimpactmedia.com" className="text-navy underline">privacy@holyimpactmedia.com</a></p>
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-muted border-t border-border mt-12 py-6">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 Holy Impact Media, LLC. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
