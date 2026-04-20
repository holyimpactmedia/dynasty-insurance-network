import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/admin'

interface Lead {
  id: string
  referenceNumber: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  age?: number | null
  state?: string | null
  householdSize?: string | null
  incomeRange?: string | null
  qualifyingEvent?: string | null
  priorities?: string | null
  created_at?: string
}

interface AIScoreResult {
  score: number
  reasons: string[]
  predictedCloseRate: number
  urgencyLevel: 'hot' | 'warm' | 'qualified' | 'nurture' | 'cold'
  recommendedApproach: string
}

/**
 * Scores a lead using Claude AI based on likelihood to purchase health insurance.
 * Returns a score 0-100 with reasons and recommendations.
 */
export async function scoreLeadWithAI(lead: Lead): Promise<AIScoreResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not configured')
    return null
  }

  const anthropic = new Anthropic({
    apiKey,
  })

  const prompt = `You are a lead quality scorer for a private health insurance sales team. Score this lead 0-100 based on likelihood to purchase.

Lead data:
- Qualifying event: ${lead.qualifyingEvent || 'Not specified'}
- Age: ${lead.age || 'Not specified'}
- State: ${lead.state || 'Not specified'}
- Household size: ${lead.householdSize || 'Not specified'}
- Income range: ${lead.incomeRange || 'Not specified'}
- Coverage priority: ${lead.priorities || 'Not specified'}
- Has phone number: ${lead.phone ? 'yes' : 'no'}
- Time submitted: ${lead.created_at || new Date().toISOString()}

Scoring criteria:
- Lost job / COBRA situation = highest urgency (add 20 points)
- Having a baby = high urgency (add 15 points)
- Age 30-55 = optimal buyer age (add 10 points)
- Household of 3+ = higher premium, higher value (add 10 points)
- Income $35K-$75K = ACA subsidy sweet spot (add 10 points)
- Phone number provided = 15 points
- Valid state (not a high-Medicaid state) = 5 points
- Open enrollment / uninsured = moderate urgency

Return ONLY valid JSON in this exact format, no markdown:
{"score": [0-100 integer], "reasons": ["reason 1", "reason 2", "reason 3"], "predictedCloseRate": [0.0-1.0 decimal], "urgencyLevel": "hot|warm|qualified|nurture|cold", "recommendedApproach": "One sentence for the agent"}`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // Extract text from the response
    const textContent = message.content.find(block => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      console.error('No text content in Claude response')
      return null
    }

    // Parse the JSON response
    const result = JSON.parse(textContent.text) as AIScoreResult

    // Validate the response structure
    if (
      typeof result.score !== 'number' ||
      !Array.isArray(result.reasons) ||
      typeof result.predictedCloseRate !== 'number' ||
      !['hot', 'warm', 'qualified', 'nurture', 'cold'].includes(result.urgencyLevel) ||
      typeof result.recommendedApproach !== 'string'
    ) {
      console.error('Invalid AI score response structure:', result)
      return null
    }

    // Clamp score to 0-100
    result.score = Math.max(0, Math.min(100, Math.round(result.score)))
    result.predictedCloseRate = Math.max(0, Math.min(1, result.predictedCloseRate))

    return result
  } catch (error) {
    console.error('Error scoring lead with AI:', error)
    return null
  }
}

/**
 * Scores a lead and updates the database with the results.
 * This is the main function to call from the leads API.
 */
export async function scoreAndUpdateLead(lead: Lead): Promise<void> {
  const supabase = createClient()

  try {
    const scoreResult = await scoreLeadWithAI(lead)

    if (scoreResult) {
      // Update the lead with the AI score
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          ai_score: scoreResult.score,
          ai_score_reasons: scoreResult.reasons,
          predicted_close_rate: scoreResult.predictedCloseRate,
        })
        .eq('id', lead.id)

      if (updateError) {
        console.error('Error updating lead with AI score:', updateError)
        return
      }

      // Insert a lead_events row for the scoring
      const { error: eventError } = await supabase
        .from('lead_events')
        .insert({
          lead_id: lead.id,
          event_type: 'scored',
          event_data: {
            score: scoreResult.score,
            urgencyLevel: scoreResult.urgencyLevel,
            predictedCloseRate: scoreResult.predictedCloseRate,
            reasons: scoreResult.reasons,
            recommendedApproach: scoreResult.recommendedApproach,
          },
        })

      if (eventError) {
        console.error('Error inserting lead_events for scoring:', eventError)
      }

      // If the score is 80+, send a hot lead SMS alert
      if (scoreResult.score >= 80) {
        await sendHotLeadAlert(lead, scoreResult.score)
      }

      console.log(`Lead ${lead.referenceNumber} scored: ${scoreResult.score}/100 (${scoreResult.urgencyLevel})`)
    } else {
      console.log(`Lead ${lead.referenceNumber} could not be scored`)
    }
  } catch (error) {
    console.error('Error in scoreAndUpdateLead:', error)
  }
}

/**
 * Sends a hot lead SMS alert to agents when a lead scores 80+
 */
async function sendHotLeadAlert(lead: Lead, score: number): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !fromNumber) {
    console.log('Twilio not configured, skipping hot lead SMS alert')
    return
  }

  const supabase = createClient()

  try {
    // Get active agents licensed in the lead's state with SMS notifications enabled
    let query = supabase
      .from('agents')
      .select('phone')
      .eq('is_active', true)
      .eq('notify_sms', true)
      .not('phone', 'is', null)

    if (lead.state) {
      query = query.contains('licensed_states', [lead.state])
    }

    const { data: agents, error } = await query

    if (error || !agents || agents.length === 0) {
      console.log('No agents to notify for hot lead')
      return
    }

    const message = `HOT LEAD ALERT: ${lead.firstName} from ${lead.state || 'Unknown'} scored ${score}/100. Call NOW. Ref: ${lead.referenceNumber}`

    // Import Twilio dynamically to avoid issues if not installed
    const twilio = await import('twilio')
    const client = twilio.default(accountSid, authToken)

    // Send SMS to each agent
    const sendPromises = agents.map(async (agent) => {
      if (!agent.phone) return

      try {
        await client.messages.create({
          body: message,
          from: fromNumber,
          to: agent.phone,
        })
        console.log(`Hot lead SMS sent to agent: ${agent.phone}`)
      } catch (err) {
        console.error(`Failed to send hot lead SMS to ${agent.phone}:`, err)
      }
    })

    await Promise.allSettled(sendPromises)
  } catch (error) {
    console.error('Error sending hot lead alerts:', error)
  }
}
