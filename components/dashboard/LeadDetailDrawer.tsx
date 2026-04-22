"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AIScoreBadge } from "@/components/dashboard/AIScoreBadge"
import type { Lead } from "@/lib/types/lead"
import { FUNNEL_LABELS, STATUS_LABELS } from "@/lib/types/lead"
import {
  User,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Users,
  Zap,
  ShieldCheck,
  BarChart2,
  ExternalLink,
  Calendar,
  Globe,
  Cpu,
} from "lucide-react"

interface LeadDetailDrawerProps {
  lead: Lead | null
  open: boolean
  onClose: () => void
}

// ── helpers ────────────────────────────────────────────────────────────────────

function fmt(value: string | null | undefined): string {
  return value?.trim() || "—"
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  })
}

const urgencyColor: Record<string, string> = {
  hot: "bg-red-100 text-red-700 border-red-200",
  warm: "bg-amber-100 text-amber-700 border-amber-200",
  qualified: "bg-blue-100 text-blue-700 border-blue-200",
  nurture: "bg-purple-100 text-purple-700 border-purple-200",
  cold: "bg-gray-100 text-gray-600 border-gray-200",
}

const ushaStatusColor: Record<string, string> = {
  sent: "bg-green-100 text-green-700 border-green-200",
  failed: "bg-red-100 text-red-700 border-red-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
}

// ── section wrapper ────────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="text-xs font-700 tracking-widest uppercase text-gray-400">
          {title}
        </span>
      </div>
      <div className="space-y-2 pl-6">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-gray-500 shrink-0 w-40">{label}</span>
      <span className="text-gray-900 font-medium text-right">{value}</span>
    </div>
  )
}

// ── component ──────────────────────────────────────────────────────────────────

export function LeadDetailDrawer({ lead, open, onClose }: LeadDetailDrawerProps) {
  if (!lead) return null

  const statusLabel = STATUS_LABELS[lead.status] ?? lead.status
  const funnelLabel = FUNNEL_LABELS[lead.funnel_type ?? ""] ?? lead.funnel_type ?? "Unknown"

  // Derive urgency from ai_score if not stored separately
  const urgency =
    lead.ai_score !== null && lead.ai_score !== undefined
      ? lead.ai_score >= 80
        ? "hot"
        : lead.ai_score >= 65
          ? "warm"
          : lead.ai_score >= 45
            ? "qualified"
            : lead.ai_score >= 25
              ? "nurture"
              : "cold"
      : null

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[540px] overflow-y-auto p-0"
      >
        {/* ── header ── */}
        <SheetHeader className="bg-gradient-to-br from-[#0A1128] to-[#1a2744] px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-white text-xl font-bold">
                {lead.first_name} {lead.last_name}
              </SheetTitle>
              <p className="text-[#D4AF37] text-sm font-mono mt-0.5">
                {lead.reference_number}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className="bg-white/10 text-white border-white/20 text-xs">
                {statusLabel}
              </Badge>
              {lead.usha_status && (
                <Badge className={`text-xs ${ushaStatusColor[lead.usha_status] ?? "bg-gray-100 text-gray-600"}`}>
                  USHA: {lead.usha_status}
                </Badge>
              )}
            </div>
          </div>

          {/* AI score bar */}
          {lead.ai_score !== null && (
            <div className="mt-4 flex items-center gap-4">
              <AIScoreBadge score={lead.ai_score} reasons={lead.ai_score_reasons} />
              {urgency && (
                <Badge className={urgencyColor[urgency]}>
                  {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
                </Badge>
              )}
              {lead.predicted_close_rate !== null && lead.predicted_close_rate !== undefined && (
                <span className="text-xs text-gray-400">
                  {Math.round(lead.predicted_close_rate * 100)}% predicted close
                </span>
              )}
            </div>
          )}
        </SheetHeader>

        {/* ── body ── */}
        <div className="px-6 py-6 space-y-6">

          {/* Contact */}
          <Section icon={User} title="Contact Information">
            <Row label="Full Name" value={`${lead.first_name} ${lead.last_name}`} />
            <Row
              label="Email"
              value={
                <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                  {lead.email}
                </a>
              }
            />
            <Row
              label="Phone"
              value={
                lead.phone ? (
                  <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline flex items-center gap-1 justify-end">
                    <Phone className="w-3 h-3" />
                    {lead.phone}
                  </a>
                ) : "—"
              }
            />
            <Row label="Age" value={fmt(lead.age?.toString())} />
            <Row
              label="State"
              value={
                lead.state ? (
                  <span className="flex items-center gap-1 justify-end">
                    <MapPin className="w-3 h-3" />
                    {lead.state}
                  </span>
                ) : "—"
              }
            />
          </Section>

          <Separator />

          {/* Insurance profile */}
          <Section icon={ShieldCheck} title="Insurance Profile">
            <Row label="Funnel" value={funnelLabel} />
            <Row label="Qualifying Event" value={fmt(lead.qualifying_event)} />
            <Row label="Household Size" value={fmt(lead.household_size)} />
            <Row label="Income Range" value={fmt(lead.income_range)} />
            <Row label="Coverage Priority" value={fmt(lead.priorities)} />
          </Section>

          <Separator />

          {/* AI analysis */}
          <Section icon={Cpu} title="AI Analysis">
            {lead.ai_score !== null ? (
              <>
                <Row label="Score" value={`${lead.ai_score} / 100`} />
                {urgency && <Row label="Urgency" value={urgency.charAt(0).toUpperCase() + urgency.slice(1)} />}
                {lead.predicted_close_rate !== null && lead.predicted_close_rate !== undefined && (
                  <Row label="Predicted Close" value={`${Math.round(lead.predicted_close_rate * 100)}%`} />
                )}
                {lead.ai_score_reasons && lead.ai_score_reasons.length > 0 && (
                  <div className="pt-1">
                    <p className="text-xs text-gray-400 mb-2">Score reasons</p>
                    <ul className="space-y-1">
                      {lead.ai_score_reasons.map((r, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-[#D4AF37] font-bold mt-0.5">·</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400 italic">Scoring pending…</p>
            )}
          </Section>

          <Separator />

          {/* USHA */}
          <Section icon={Globe} title="USHA Marketplace">
            <Row
              label="Status"
              value={
                lead.usha_status ? (
                  <Badge className={`text-xs ${ushaStatusColor[lead.usha_status] ?? "bg-gray-100"}`}>
                    {lead.usha_status}
                  </Badge>
                ) : "Not submitted"
              }
            />
            <Row label="USHA Lead ID" value={fmt(lead.usha_lead_id)} />
            <Row label="Sent At" value={fmtDate(lead.usha_sent_at)} />
          </Section>

          <Separator />

          {/* Attribution */}
          <Section icon={BarChart2} title="Attribution">
            <Row label="UTM Source" value={fmt(lead.utm_source)} />
            <Row label="UTM Medium" value={fmt(lead.utm_medium)} />
            <Row label="UTM Campaign" value={fmt(lead.utm_campaign)} />
            <Row label="IP Address" value={fmt(lead.ip_address)} />
          </Section>

          <Separator />

          {/* Compliance */}
          <Section icon={ShieldCheck} title="Compliance">
            <Row
              label="TCPA Consent"
              value={
                lead.tcpa_consent ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                    Verified
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                    Missing
                  </Badge>
                )
              }
            />
            <Row label="Consent At" value={fmtDate(lead.tcpa_consent_at)} />
            {lead.trusted_form_cert_url && (
              <Row
                label="TrustedForm Cert"
                value={
                  <a
                    href={lead.trusted_form_cert_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 justify-end"
                  >
                    View Cert
                    <ExternalLink className="w-3 h-3" />
                  </a>
                }
              />
            )}
          </Section>

          <Separator />

          {/* Timeline */}
          <Section icon={Calendar} title="Timeline">
            <Row label="Submitted" value={fmtDate(lead.created_at)} />
          </Section>

        </div>
      </SheetContent>
    </Sheet>
  )
}
