-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  age INTEGER,
  state TEXT,
  income_range TEXT,
  household_size TEXT,
  qualifying_event TEXT,
  priorities TEXT,
  tcpa_consent BOOLEAN NOT NULL DEFAULT FALSE,
  tcpa_consent_at TIMESTAMPTZ,
  trusted_form_cert_url TEXT,
  funnel_type TEXT DEFAULT 'healthcare_aca',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  ai_score INTEGER,
  status TEXT DEFAULT 'new',
  assigned_agent_id UUID,
  sell_price DECIMAL DEFAULT 28.00,
  acquisition_cost DECIMAL,
  crm_sync_status TEXT DEFAULT 'pending',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create agent_applications table
CREATE TABLE IF NOT EXISTS agent_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  licensed_states TEXT[],
  license_status TEXT,
  experience_level TEXT,
  why_joining TEXT[],
  income_goal TEXT,
  status TEXT DEFAULT 'submitted',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for leads (for duplicate checking)
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- Create index on reference_number for quick lookups
CREATE INDEX IF NOT EXISTS idx_leads_reference_number ON leads(reference_number);
CREATE INDEX IF NOT EXISTS idx_agent_applications_reference_number ON agent_applications(reference_number);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for leads updated_at
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (but allow public inserts for the lead forms)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_applications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous inserts (for public form submissions)
CREATE POLICY "Allow anonymous lead inserts" ON leads
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anonymous application inserts" ON agent_applications
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow service role full access
CREATE POLICY "Allow service role full access to leads" ON leads
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to applications" ON agent_applications
  FOR ALL
  USING (auth.role() = 'service_role');
