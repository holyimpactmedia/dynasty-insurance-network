import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, note } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    const validStatuses = ['new', 'contacted', 'appointment', 'follow-up', 'sold', 'lost']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Update lead status
    const updateData: Record<string, unknown> = { status }
    
    // Set contacted_at timestamp when status changes to contacted
    if (status === 'contacted') {
      updateData.contacted_at = new Date().toISOString()
    }

    const { data: lead, error: updateError } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating lead status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update lead status' },
        { status: 500 }
      )
    }

    // Log the status change event
    const { error: eventError } = await supabase
      .from('lead_events')
      .insert({
        lead_id: id,
        event_type: 'status_change',
        event_data: { 
          old_status: body.oldStatus,
          new_status: status 
        },
        note: note || null,
      })

    if (eventError) {
      console.error('Error logging lead event:', eventError)
      // Don't fail the request if event logging fails
    }

    return NextResponse.json({
      success: true,
      lead,
    })
  } catch (error) {
    console.error('Error in status update:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
