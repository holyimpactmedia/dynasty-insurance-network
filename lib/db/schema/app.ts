import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    referenceNumber: text("reference_number").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    age: integer("age"),
    state: text("state"),
    incomeRange: text("income_range"),
    householdSize: text("household_size"),
    qualifyingEvent: text("qualifying_event"),
    priorities: text("priorities"),
    tcpaConsent: boolean("tcpa_consent").notNull().default(false),
    tcpaConsentAt: timestamp("tcpa_consent_at", { withTimezone: true, mode: "string" }),
    trustedFormCertUrl: text("trusted_form_cert_url"),
    funnelType: text("funnel_type").default("private_health"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    ipAddress: text("ip_address"),
    quizAnswers: jsonb("quiz_answers").$type<Record<string, unknown> | null>(),
    status: text("status").notNull().default("new"),
    aiScore: integer("ai_score"),
    aiScoreReasons: text("ai_score_reasons").array(),
    predictedCloseRate: numeric("predicted_close_rate", { mode: "number" }),
    aiScoredAt: timestamp("ai_scored_at", { withTimezone: true, mode: "string" }),
    sellPrice: numeric("sell_price", { mode: "number" }).notNull().default(28),
    ushaStatus: text("usha_status").$type<"pending" | "sent" | "failed" | null>(),
    ushaSentAt: timestamp("usha_sent_at", { withTimezone: true, mode: "string" }),
    ushaLeadId: text("usha_lead_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("leads_reference_number_key").on(table.referenceNumber),
    index("idx_leads_email").on(table.email),
    index("idx_leads_created_at").on(table.createdAt.desc()),
    index("idx_leads_usha_status").on(table.ushaStatus),
    index("idx_leads_funnel_type").on(table.funnelType),
    check("leads_usha_status_check", sql`${table.ushaStatus} in ('pending', 'sent', 'failed')`),
  ],
)

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
})

export const emailSuppressions = pgTable("email_suppressions", {
  email: text("email").primaryKey(),
  source: text("source"),
  suppressedAt: timestamp("suppressed_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
})

export type LeadRow = typeof leads.$inferSelect
export type NewLeadRow = typeof leads.$inferInsert
