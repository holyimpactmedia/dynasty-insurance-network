import { NextRequest, NextResponse } from 'next/server'

const TRUSTEDFORM_API_KEY = process.env.TRUSTEDFORM_API_KEY
const TRUSTEDFORM_API_BASE = 'https://cert.trustedform.com'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { certUrl, email, phone, reference, vendor } = body

    if (!certUrl) {
      return NextResponse.json(
        { error: 'Certificate URL is required' },
        { status: 400 }
      )
    }

    if (!TRUSTEDFORM_API_KEY) {
      return NextResponse.json(
        { error: 'TrustedForm API key not configured' },
        { status: 500 }
      )
    }

    // Extract cert ID from URL (e.g., https://cert.trustedform.com/xxxxx)
    const certId = certUrl.split('/').pop()

    if (!certId) {
      return NextResponse.json(
        { error: 'Invalid certificate URL' },
        { status: 400 }
      )
    }

    // Claim the certificate
    const claimBody: any = {}
    
    if (email) claimBody.email = email
    if (phone) claimBody.phone = phone
    if (reference) claimBody.reference = reference
    if (vendor) claimBody.vendor = vendor

    // Add required TCPA scan terms
    claimBody.required_scan_terms = [
      'I agree to the terms',
      'I consent to be contacted',
    ]

    const response = await fetch(`${TRUSTEDFORM_API_BASE}/${certId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`API:${TRUSTEDFORM_API_KEY}`).toString('base64')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(claimBody),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[v0] TrustedForm claim error:', error)
      return NextResponse.json(
        { error: `Failed to claim certificate: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Extract key compliance data
    const complianceData = {
      certId,
      certUrl,
      claimedAt: new Date().toISOString(),
      outcome: data.outcome,
      isCompliant: data.outcome === 'success',
      browser: data.cert?.browser?.full,
      operatingSystem: data.cert?.operating_system?.full,
      ipGeo: data.cert?.approx_ip_geo,
      eventDuration: data.cert?.event_duration_ms,
      formInputMethod: data.cert?.form_input_method,
      expiresAt: data.cert?.expires_at,
      warnings: data.warnings || [],
      scanResults: {
        requiredFound: data.scans?.required_found || [],
        requiredNotFound: data.scans?.required_not_found || [],
        forbiddenFound: data.scans?.forbidden_found || [],
      },
      fingerprints: {
        matching: data.fingerprints?.matching || [],
        nonMatching: data.fingerprints?.non_matching || [],
      }
    }

    return NextResponse.json(complianceData, { status: 201 })
  } catch (error) {
    console.error('[v0] TrustedForm API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve certificate data
export async function GET(request: NextRequest) {
  try {
    const certId = request.nextUrl.searchParams.get('certId')

    if (!certId) {
      return NextResponse.json(
        { error: 'Certificate ID is required' },
        { status: 400 }
      )
    }

    if (!TRUSTEDFORM_API_KEY) {
      return NextResponse.json(
        { error: 'TrustedForm API key not configured' },
        { status: 500 }
      )
    }

    const response = await fetch(`${TRUSTEDFORM_API_BASE}/${certId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${Buffer.from(`API:${TRUSTEDFORM_API_KEY}`).toString('base64')}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Certificate not found or expired` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] TrustedForm GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
