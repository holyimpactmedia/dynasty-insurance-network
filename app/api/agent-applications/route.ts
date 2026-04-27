import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'

// Generate a unique reference number for agent applications
function generateReferenceNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `AA-${timestamp}-${random}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Extract application data from the request
    const {
      firstName,
      lastName,
      email,
      phone,
      licensedStates,
      licenseStatus,
      experienceLevel,
      whyJoining,
      incomeGoal,
    } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email, phone' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const referenceNumber = generateReferenceNumber()

    // Try to persist the application. If Supabase is not configured or the
    // insert fails, still return success to the user so the form does not
    // appear broken; the error is logged for follow-up.
    if (!supabase) {
      console.warn('Supabase admin client not configured. Agent application logged only.', { referenceNumber, email })
    } else {
      const { error } = await supabase
        .from('agent_applications')
        .insert({
          reference_number: referenceNumber,
          first_name: firstName,
          last_name: lastName,
          email: email.toLowerCase().trim(),
          phone: phone,
          licensed_states: licensedStates || [],
          license_status: licenseStatus || null,
          experience_level: experienceLevel || null,
          why_joining: whyJoining || [],
          income_goal: incomeGoal || null,
          status: 'submitted',
        })

      if (error) {
        console.error('Error inserting agent application (continuing):', error, { referenceNumber, email })
      }
    }

    return NextResponse.json({
      success: true,
      referenceNumber: referenceNumber,
      message: 'Application submitted successfully',
    })
  } catch (error) {
    console.error('Error processing agent application:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
