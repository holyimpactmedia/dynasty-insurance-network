-- TrustedForm claim persistence.
-- Certify (cert URL capture) works and lands in trusted_form_cert_url.
-- These three persist the *claim* result, which the leads route
-- already writes to. They were missing from the baseline.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS trusted_form_cert_id TEXT,
  ADD COLUMN IF NOT EXISTS trusted_form_claimed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trusted_form_claimed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_leads_trusted_form_claimed
  ON public.leads (trusted_form_claimed)
  WHERE trusted_form_claimed = false;
