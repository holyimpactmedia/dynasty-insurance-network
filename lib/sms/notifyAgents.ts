import { createClient } from '@/lib/supabase/admin'
import twilio from 'twilio'

interface LeadNotification {
  firstName: string
  lastName: string
  state: string | null
  aiScore: number | null
  referenceNumber: string
}

export async function notifyAgentsOfNewLead(lead: LeadNotification): Promise<{ success: boolean; notifiedCount: number; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !twilioPhone) {
    console.error('[v0] Twilio credentials not configured')
    return { success: false, notifiedCount: 0, error: 'Twilio not configured' }
  }

  if (!lead.state) {
    console.log('[v0] Lead has no state, skipping agent notification')
    return { success: true, notifiedCount: 0 }
  }

  try {
    const supabase = createClient()
    const client = twilio(accountSid, authToken)

    // Query active agents licensed in the lead's state who have SMS notifications enabled
    const { data: agents, error } = await supabase
      .from('agents')
      .select('phone')
      .eq('is_active', true)
      .eq('notify_sms', true)
      .contains('licensed_states', [lead.state])

    if (error) {
      console.error('[v0] Error querying agents:', error)
      return { success: false, notifiedCount: 0, error: error.message }
    }

    if (!agents || agents.length === 0) {
      console.log('[v0] No agents to notify for state:', lead.state)
      return { success: true, notifiedCount: 0 }
    }

    // Build SMS message (keep under 160 chars)
    const scoreText = lead.aiScore !== null ? lead.aiScore.toString() : 'Pending'
    const message = `🔥 New Lead: ${lead.firstName} ${lead.lastName} | ${lead.state} | Score: ${scoreText} | Ref: ${lead.referenceNumber} | Login: dynasty.app/dashboard/agent`

    // Send SMS to each agent (in parallel)
    const sendPromises = agents
      .filter(agent => agent.phone)
      .map(agent => 
        client.messages.create({
          body: message,
          from: twilioPhone,
          to: agent.phone,
        }).catch(err => {
          console.error(`[v0] Failed to send SMS to ${agent.phone}:`, err)
          return null
        })
      )

    const results = await Promise.all(sendPromises)
    const successCount = results.filter(r => r !== null).length

    console.log(`[v0] Notified ${successCount}/${agents.length} agents of new lead`)
    return { success: true, notifiedCount: successCount }
  } catch (error) {
    console.error('[v0] Failed to notify agents:', error)
    return { success: false, notifiedCount: 0, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
