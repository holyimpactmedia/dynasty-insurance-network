# TrustedForm Integration Guide

## Overview
This document explains how TrustedForm TCPA compliance is integrated into the Dynasty Lead Generation System.

## What is TrustedForm?

TrustedForm is a TCPA compliance platform that:
- **Captures Consent:** Records visual proof of user consent during form submission
- **Generates Certificates:** Creates verified compliance records with unique shareable URLs
- **Stores Evidence:** Keeps page snapshots for up to 5 years for regulatory defense
- **Verifies Lead Data:** Fingerprints submitted data to detect fraud or lead tampering

## Integration Points

### 1. Healthcare Insurance Funnel (`/`)

**What's Tracked:**
- Healthcare quiz form submissions
- TCPA consent verification
- User browser and OS information
- Lead data fingerprinting
- Duration on form (fraud detection)

**Features:**
- Automatic certificate claiming after form submission, server side, by the lead intake (see "Server-side claim" below)
- Compliance badge on thank you page
- Certificate URL storage for compliance audit
- Subsidy estimates only shown after consent verification

### 2. Agent Recruiting Funnel (`/recruit`)

**What's Tracked:**
- Agent application submissions
- License state verification
- Income/commission data collection
- TCPA consent for contact

**Features:**
- Certificate ID linked to agent reference number
- Agent eligibility verification
- Contact preference documentation

### 3. Agent Dashboard (`/dashboard/agent`)

**Features to Add (Future):**
- View compliance status for assigned leads
- Quick certificate links for verification disputes
- TCPA violation detector for leads with issues

### 4. Admin Dashboard (`/dashboard/admin`)

**Features to Add (Future):**
- Compliance rate by campaign
- Certificate expiration tracking
- TCPA violation alerts
- Bulk certificate export for audits

## Implementation Details

### Server-side claim

The lead intake ([`app/api/leads/route.ts`](app/api/leads/route.ts)) claims the certificate in its background work, after the consumer's response has been sent, by calling `claimTrustedFormCertificate` in [`lib/trustedform/claim.ts`](lib/trustedform/claim.ts) directly.

There is no public claim route and no client-side claim hook. The claim uses `TRUSTEDFORM_API_KEY` and runs server side only, so nobody else can spend Dynasty's claims or read its certificates. Do not add an endpoint or a browser call for it.

```ts
const claim = await claimTrustedFormCertificate({
  certUrl: trustedFormCertUrl, // https://cert.trustedform.com/<id>, from the funnel's hidden field
  reference: referenceNumber,
  email: normalizedEmail,
  phone,
})
```

What the function does:
- Accepts only an `https` URL on `cert.trustedform.com` whose last path segment is letters and digits. Anything else is a failed claim and TrustedForm is not called.
- Sends the reference, email, phone and `required_scan_terms` to that certificate, with a 10 second timeout. It never throws.
- Returns `{ status: "claimed", outcome, warnings, requiredFound, requiredNotFound }` or `{ status: "failed", reason }`. A claimed certificate whose response body cannot be read is reported as claimed with an unknown outcome.
- Replaces anything that looks like an email address or a phone number in TrustedForm's warnings before anything logs them.

### Log lines

The intake logs the outcome of every claim to the Vercel runtime logs (no email address or phone number is ever logged):

| Log line | Meaning |
|---|---|
| `TRUSTEDFORM CLAIM OK` | claimed, and every required phrase was found on the page snapshot |
| `TRUSTEDFORM SCAN MISMATCH` | claimed, but a required phrase was not found or the outcome was not `success`; TrustedForm keeps the certificate, but the evidence is weaker |
| `TRUSTEDFORM CLAIM FAILED` | not claimed (API key missing, unusable certificate URL, TrustedForm error or timeout); an unclaimed certificate expires |

See `docs/RUNBOOK.md` ("TrustedForm claims") for how to read and act on these.

### Components

#### ComplianceBadge
Displays TCPA compliance status with interactive certificate viewing.

```tsx
import { ComplianceBadge } from "@/components/trustedform/ComplianceBadge"

<ComplianceBadge
  isCompliant={true}
  certUrl="https://cert.trustedform.com/xxxxx"
  certId="xxxxx"
  size="md"
  interactive={true}
/>
```

#### ComplianceDetails
Shows full compliance verification details.

```tsx
import { ComplianceDetails } from "@/components/trustedform/ComplianceBadge"

<ComplianceDetails data={complianceData} />
```

## Setup Instructions

### 1. Get TrustedForm Account
Contact TrustedForm (support@activeprospect.com) to:
- Request API access
- Receive your API key
- Set up form tracking

### 2. Add Environment Variable
Add to your Vercel project's environment variables:
```
TRUSTEDFORM_API_KEY=your_api_key_here
```

### 3. Get Form ID
TrustedForm will provide you with a Form ID for each funnel:
- Healthcare Quiz: `healthcare-quote-quiz`
- Agent Recruiting: `agent-recruitment-app`

### 4. Required Scan Terms
The phrases TrustedForm must find on the consent page live in `TRUSTEDFORM_SCAN_TERMS` in `lib/trustedform/claim.ts`. Each one must appear verbatim in the approved consent text of every live funnel, and `lib/trustedform/claim.test.ts` fails if one is missing from `app/<funnel>/page.tsx`. Counsel's documents are the source of truth for that text, so change a phrase only together with an approved legal change.

## Data Storage & Privacy

### What Gets Stored
For each lead we store, on the `leads` row:
- The certificate URL (`trusted_form_cert_url`)
- The consent time (`tcpa_consent_at`) and IP address

The claim result (outcome, warnings, scan results) is logged, not stored, and the logs keep no email address or phone number. TrustedForm itself keeps the certificate, the page snapshot, the browser/OS and geographic data, and the lead fingerprints (SHA1 hashes, not raw data).

### What Gets Transmitted
- Form data is transmitted to TrustedForm during submission
- The claim sends TrustedForm the lead's reference number, email and phone, and the required scan terms
- Full data is available via TrustedForm's portal

### Compliance
- The intake claims each certificate in the background right after the response; TrustedForm's claim window is 72 hours
- Data retention follows ACA requirements (5+ years)
- Fingerprinting is SHA1 hashed (not reversible)

## Monitoring & Auditing

### View Compliance Status
**Dashboard Location:** `/dashboard/admin` → Governance & Alerts

**Metrics:**
- Compliance rate by campaign
- Certificate expiration tracking
- Lead data fingerprint mismatches
- TCPA violation alerts

### Export Certificates
To prepare for regulatory audit:
1. Go to TrustedForm portal
2. Filter by date range
3. Export as CSV
4. Reference numbers link to your leads

## Troubleshooting

### Certificate Not Claiming
**Issue:** `TRUSTEDFORM CLAIM FAILED: HTTP 401` in the Vercel runtime logs
- **Fix:** Check TRUSTEDFORM_API_KEY is correct and set for that environment

**Issue:** `TRUSTEDFORM CLAIM FAILED: TRUSTEDFORM_API_KEY is not set`
- **Fix:** Add the key to that Vercel environment and redeploy

**Issue:** `Certificate has expired` (an HTTP 4xx from TrustedForm)
- **Fix:** TrustedForm has 72-hour claim window. The intake claims right after submission, so an expired certificate usually means the claim failed earlier; search the logs for `TRUSTEDFORM CLAIM FAILED`

**Issue:** `TRUSTEDFORM SCAN MISMATCH` lists a required phrase
- **Fix:** The page snapshot did not contain that phrase. Compare the funnel's consent text with `TRUSTEDFORM_SCAN_TERMS` (the test in `lib/trustedform/claim.test.ts` should have caught this)

### Form Not Tracking
**Issue:** No certificate ID captured
- **Fix:** Verify TrustedForm script is loaded and form ID is correct

**Issue:** `tf_cert_id` is undefined
- **Fix:** Add `tf_form_id` script tag to page (see code in page.tsx)

### Fingerprint Mismatch
**Issue:** Compliance shows "non_matching" fingerprints
- **Fix:** This indicates lead data tampering - investigate for fraud

## Future Enhancements

1. **Session Replay:** Display video of form submission for dispute resolution
2. **Compliance Scoring:** Rate each lead's compliance quality
3. **Automated Audits:** Daily compliance rate reports
4. **Lead Protection:** Flag leads with compliance issues before distribution
5. **Agent Education:** Dashboard training on TCPA requirements

## Resources

- **TrustedForm Docs:** https://trustedform.redoc.ly
- **ActiveProspect Support:** support@activeprospect.com
- **TCPA Compliance Guide:** https://www.ftc.gov/business-guidance/privacy-security/telemarketing

## Cost Considerations

TrustedForm pricing typically:
- $0.10-0.25 per certificate claimed
- Volume discounts available
- Extended storage (beyond 72 hours) available

For 1,000 leads/month: ~$100-250/month
For 10,000 leads/month: ~$1,000-2,500/month
