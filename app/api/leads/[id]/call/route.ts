import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { outcome, duration, note } = body

    const supabase = createClient()

    // Log the call event
    const { error: eventError } = await supabase
      .from('lead_events')
      .insert({
        lead_id: id,
        event_type: 'call',
        event_data: { 
          outcome: outcome || 'attempted',
          duration: duration || 0,
        },
        note: note || null,
      })

    if (eventError) {
      console.error('Error logging call event:', eventError)
      return NextResponse.json(
        { error: 'Failed to log call' },
        { status: 500 }
      )
    }

    // If call was answered, update status to contacted
    if (outcome === 'answered' || outcome === 'connected') {
      const { error: updateError } = await supabase
        .from('leads')
        .update({ 
          status: 'contacted',
          contacted_at: new Date().toISOString()
        })
        .eq('id', id)

      if (updateError) {
        console.error('Error updating lead status:', updateError)
      }
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Error in call logging:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
