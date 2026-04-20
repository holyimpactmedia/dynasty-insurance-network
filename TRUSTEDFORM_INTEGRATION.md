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
- Automatic certificate claiming after form submission
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

### API Integration

**Endpoint:** `POST /api/trustedform/claim`

**Request Body:**
```json
{
  "certUrl": "https://cert.trustedform.com/xxxxx",
  "email": "user@example.com",
  "phone": "5125551234",
  "reference": "HC-1234",
  "vendor": "Dynasty Health Insurance"
}
```

**Response:**
```json
{
  "certId": "xxxxx",
  "certUrl": "https://cert.trustedform.com/xxxxx",
  "claimedAt": "2026-02-23T10:30:00Z",
  "outcome": "success",
  "isCompliant": true,
  "browser": "Chrome 120.0",
  "operatingSystem": "Windows 10",
  "ipGeo": {
    "city": "Austin",
    "state": "TX",
    "country_code": "US"
  },
  "expiresAt": "2026-02-26T10:30:00Z",
  "warnings": [],
  "scanResults": {
    "requiredFound": ["I agree to the terms"],
    "requiredNotFound": [],
    "forbiddenFound": []
  }
}
```

### Client-Side Hook: `useTrustedForm`

**Usage:**
```tsx
import { useTrustedForm, getTrustedFormCertId } from "@/lib/hooks/useTrustedForm"

export function MyForm() {
  const { claimCertificate } = useTrustedForm()

  const handleSubmit = async () => {
    const certId = getTrustedFormCertId()
    
    try {
      const compliance = await claimCertificate({
        certUrl: `https://cert.trustedform.com/${certId}`,
        email: formData.email,
        phone: formData.phone,
        reference: "HC-1234",
        vendor: "Dynasty Health Insurance",
      })
      
      console.log("Certified:", compliance.isCompliant)
    } catch (error) {
      console.error("Certification failed:", error)
    }
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

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

### 4. Configure Required Scan Terms
In `/api/trustedform/claim/route.ts`, update the required_scan_terms to match your actual TCPA language:

```tsx
claimBody.required_scan_terms = [
  "I agree to be contacted",
  "I authorize phone calls",
  // Add your actual consent language
]
```

## Data Storage & Privacy

### What Gets Stored
When a certificate is claimed, we store:
- Certificate ID
- Certificate URL
- Timestamp of claim
- Compliance outcome
- Browser/OS information
- Geographic data (city, state)
- Lead fingerprints (SHA1 hashes, not raw data)

### What Gets Transmitted
- Form data is transmitted to TrustedForm during submission
- Only summaries are sent to your backend
- Full data is available via TrustedForm's portal

### Compliance
- Certificates are automatically claimed within 72 hours
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
**Issue:** `Failed to claim certificate: 401`
- **Fix:** Check TRUSTEDFORM_API_KEY is correct and set

**Issue:** `Certificate has expired`
- **Fix:** TrustedForm has 72-hour claim window. Claim immediately after submission.

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
