// Canonical Lead type matching the Supabase `leads` table.
// usha_status / usha_sent_at / usha_lead_id require these columns to exist in Supabase:
//   ALTER TABLE leads ADD COLUMN usha_status text;
//   ALTER TABLE leads ADD COLUMN usha_sent_at timestamptz;
//   ALTER TABLE leads ADD COLUMN usha_lead_id text;

export interface Lead {
  id: string
  reference_number: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  age: number | null
  state: string | null
  income_range: string | null
  household_size: string | null
  qualifying_event: string | null
  priorities: string | null
  tcpa_consent: boolean
  tcpa_consent_at: string | null
  trusted_form_cert_url: string | null
  funnel_type: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  ip_address: string | null
  status: string
  ai_score: number | null
  ai_score_reasons: string[] | null
  predicted_close_rate: number | null
  sell_price: number | null
  // USHA Marketplace integration fields (add columns in Supabase before these populate)
  usha_status: 'pending' | 'sent' | 'failed' | null
  usha_sent_at: string | null
  usha_lead_id: string | null
  created_at: string
}

// Subset returned by the admin leads list query
export type LeadListItem = Pick<
  Lead,
  | 'id'
  | 'reference_number'
  | 'first_name'
  | 'last_name'
  | 'email'
  | 'phone'
  | 'state'
  | 'funnel_type'
  | 'status'
  | 'ai_score'
  | 'ai_score_reasons'
  | 'usha_status'
  | 'utm_source'
  | 'utm_campaign'
  | 'created_at'
>

export const FUNNEL_LABELS: Record<string, string> = {
  healthcare_aca: 'ACA / Individual',
  family: 'Family',
  cobra: 'COBRA',
  self_employed: 'Self-Employed',
  ppo: 'PPO',
  business: 'Small Business',
}

export const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  appointment_set: 'Appointment Set',
  sold: 'Sold',
  disqualified: 'Disqualified',
}
