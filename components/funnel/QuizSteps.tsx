import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { DollarSign, AlertCircle, Phone, Mail, ArrowRight, Lock } from "lucide-react"
import { Icon, RichLine } from "./primitives"
import type { CardChoiceStep, StepConfig } from "@/lib/funnels/types"

export interface QuizStepsProps {
  step: StepConfig
  stepNumber: number
  totalSteps: number
  answers: Record<string, any>
  errors: Record<string, string>
  updateAnswer: (key: string, value: any) => void
  handleAutoAdvance: (key: string, value: any) => void
  stateSearch: string
  setStateSearch: (v: string) => void
  filteredStates: string[]
  onContactSubmit: () => void
  onNameSubmit: () => void
  isSubmitting: boolean
  submitError: string | null
}

function CardChoice({
  step,
  answers,
  handleAutoAdvance,
}: {
  step: CardChoiceStep
  answers: Record<string, any>
  handleAutoAdvance: (key: string, value: any) => void
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">{step.heading}</h2>
        <p className="text-muted-foreground">{step.subhead}</p>
      </div>
      <div className="grid gap-3">
        {step.options.map((option) => {
          const selected = answers[step.fieldKey] === option.value
          return (
            <Card
              key={option.value}
              onClick={() => handleAutoAdvance(step.fieldKey, option.value)}
              className={`p-5 cursor-pointer border-2 transition-all duration-150 hover:border-[#D4AF37] hover:shadow-md active:scale-[0.99] active:bg-[#D4AF37]/10 ${
                selected ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-border"
              }`}
            >
              {step.layout === "plain" && (
                <div className="flex items-center gap-4">
                  <span className="text-2xl"></span>
                  <div>
                    <div className="font-semibold text-foreground">{option.label ?? option.value}</div>
                    <div className="text-sm text-muted-foreground">{option.desc}</div>
                  </div>
                </div>
              )}
              {step.layout === "trailingDollar" && (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground">{option.label ?? option.value}</div>
                    <div className="text-sm text-muted-foreground">{option.desc}</div>
                  </div>
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              {step.layout === "iconGold" && (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
                    {option.icon && <Icon name={option.icon} className="w-5 h-5 text-[#D4AF37]" />}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{option.label ?? option.value}</div>
                    <div className="text-sm text-muted-foreground">{option.desc}</div>
                  </div>
                </div>
              )}
              {step.layout === "iconMuted" && (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    {option.icon && <Icon name={option.icon} className={`w-5 h-5 ${option.iconColor ?? ""}`} />}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{option.label ?? option.value}</div>
                    <div className="text-sm text-muted-foreground">{option.desc}</div>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export function QuizSteps(props: QuizStepsProps) {
  const {
    step,
    stepNumber,
    totalSteps,
    answers,
    errors,
    updateAnswer,
    handleAutoAdvance,
    stateSearch,
    setStateSearch,
    filteredStates,
    onContactSubmit,
    onNameSubmit,
    isSubmitting,
    submitError,
  } = props

  return (
    <div className="space-y-6">
      {/* Step counter */}
      <div className="text-center text-sm text-muted-foreground font-medium">
        Step {stepNumber} of {totalSteps}
      </div>

      {step.type === "cardChoice" && (
        <CardChoice step={step} answers={answers} handleAutoAdvance={handleAutoAdvance} />
      )}

      {step.type === "stateSearch" && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-foreground">{step.heading}</h2>
            <p className="text-muted-foreground">{step.subhead}</p>
          </div>
          <Input
            type="text"
            placeholder="Search states..."
            value={stateSearch}
            onChange={(e) => setStateSearch(e.target.value)}
            className="h-12 text-base"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
            {filteredStates.map((state) => (
              <button
                key={state}
                onClick={() => handleAutoAdvance(step.fieldKey, state)}
                className={`p-3 text-sm rounded-lg border-2 text-left font-medium transition-all hover:border-[#D4AF37] ${
                  answers[step.fieldKey] === state
                    ? "border-[#D4AF37] bg-[#D4AF37]/10 text-foreground"
                    : "border-border text-foreground hover:bg-muted/50"
                }`}
              >
                {state}
              </button>
            ))}
          </div>
          {errors[step.fieldKey] && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> {errors[step.fieldKey]}
            </p>
          )}
        </div>
      )}

      {step.type === "contact" && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-foreground">{step.heading}</h2>
            <p className="text-muted-foreground">{step.subhead}</p>
          </div>
          <div className="space-y-4">
            {step.askAge && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Age <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="Age"
                  value={answers.age || ""}
                  onChange={(e) => updateAnswer("age", e.target.value)}
                  min={18}
                  max={100}
                  className={`h-12 ${errors.age ? "border-destructive" : ""}`}
                />
                {errors.age && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.age}
                  </p>
                )}
              </div>
            )}
            {step.askGovCoverage && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{step.govCoverageLabel}</label>
                <div className="grid grid-cols-2 gap-3">
                  {["No", "Yes"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => updateAnswer("govCoverage", opt)}
                      className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                        answers.govCoverage === opt
                          ? "border-[#D4AF37] bg-[#D4AF37]/10"
                          : "border-border hover:border-[#D4AF37]"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {answers.govCoverage === "Yes" && step.govCoverageWarning && (
                  <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded p-2">
                    {step.govCoverageWarning}
                  </p>
                )}
                {errors.govCoverage && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.govCoverage}
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Phone <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="(555) 000-0000"
                  value={answers.phone || ""}
                  onChange={(e) => updateAnswer("phone", e.target.value)}
                  className={`pl-10 h-12 ${errors.phone ? "border-destructive" : ""}`}
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.phone}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Email <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={answers.email || ""}
                  onChange={(e) => updateAnswer("email", e.target.value)}
                  className={`pl-10 h-12 ${errors.email ? "border-destructive" : ""}`}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.email}
                </p>
              )}
            </div>

            {/* TCPA consent */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={answers.tcpaConsent || false}
                  onChange={(e) => updateAnswer("tcpaConsent", e.target.checked)}
                  className="mt-1 w-4 h-4 accent-[#D4AF37]"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  <RichLine segments={step.consentText} linkClassName="underline hover:text-foreground" />
                </span>
              </label>
              {errors.tcpaConsent && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.tcpaConsent}
                </p>
              )}
            </div>

            <Button
              onClick={onContactSubmit}
              className="w-full h-12 bg-[#D4AF37] text-[#0A1128] hover:bg-[#c9a430] active:bg-[#b89228] font-semibold text-base"
            >
              {step.submitLabel}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step.type === "name" && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-foreground">{step.heading}</h2>
            <p className="text-muted-foreground">{step.subhead}</p>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">First name</label>
                <Input
                  type="text"
                  placeholder="Jane"
                  value={answers.firstName || ""}
                  onChange={(e) => updateAnswer("firstName", e.target.value)}
                  className={`h-12 ${errors.firstName ? "border-destructive" : ""}`}
                />
                {errors.firstName && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.firstName}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Last name</label>
                <Input
                  type="text"
                  placeholder="Smith"
                  value={answers.lastName || ""}
                  onChange={(e) => updateAnswer("lastName", e.target.value)}
                  className={`h-12 ${errors.lastName ? "border-destructive" : ""}`}
                />
                {errors.lastName && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            {submitError && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {submitError}
              </div>
            )}

            <Button
              onClick={onNameSubmit}
              disabled={isSubmitting}
              className="w-full h-12 bg-[#D4AF37] text-[#0A1128] hover:bg-[#D4AF37]/90 font-bold text-base disabled:opacity-50"
            >
              {isSubmitting ? step.submittingLabel : step.submitLabel}
              {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Lock className="w-3 h-3" />
              <span>{step.secureNote}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
