# TCPA Compliance Audit - Dynasty Healthcare Funnel

## CRITICAL ISSUES FOUND

### 1. **MISSING EXPRESS WRITTEN CONSENT** ⚠️⚠️⚠️
**Current State:** No TCPA consent checkbox or language anywhere in the funnel
**Risk Level:** LAWSUIT LEVEL - This is the #1 cause of TCPA lawsuits
**Fix Required:** Add explicit consent checkbox with proper legal language BEFORE collecting phone number

### 2. **MISLEADING SAVINGS CLAIMS** ⚠️⚠️
**Current Issue:** "Save Up to 40% on Life Insurance" mixed with healthcare messaging
**Risk:** False advertising, deceptive marketing practices
**Fix:** Remove all "save" claims unless backed by documented data

### 3. **SPECIFIC RATE PROMISES** ⚠️⚠️
**Current Issue:** Showing "$89-$329/mo" estimates without proper disclaimers
**Risk:** Rate estimates without underwriting = misleading consumers
**Fix:** Remove specific dollar amounts OR add prominent disclaimer

### 4. **SUBSIDY GUARANTEES** ⚠️
**Current Issue:** "87% of applicants qualify for federal subsidies averaging $500/month"
**Risk:** Cannot guarantee subsidy amounts without income verification
**Fix:** Change to "may qualify" and add income verification disclaimer

### 5. **GOVERNMENT AFFILIATION CONCERN** ⚠️
**Current Issue:** "Certified ACA Marketplace Broker" could imply government endorsement
**Risk:** FTC regulations prohibit misleading government affiliation
**Fix:** Clarify private broker status

### 6. **PRE-EXISTING CONDITIONS LANGUAGE** ✓
**Current State:** Correctly states "Pre-existing conditions are covered"
**Status:** COMPLIANT - ACA law allows this claim

---

## REQUIRED TCPA CONSENT LANGUAGE (Must Include)

```
By checking this box and providing my phone number, I consent to receive calls 
and text messages, including through the use of an automated dialing system or 
prerecorded voice, from [Company Name] and its partners at the number provided 
regarding health insurance products. I understand that consent is not required 
as a condition of purchase. Message and data rates may apply.
```

---

## REQUIRED DISCLAIMERS

1. **Rate Estimates:**
   "Rates shown are estimates only and subject to change based on plan selection, 
   location, age, household size, and tobacco use. Final rates require full application 
   and income verification."

2. **Subsidy Qualification:**
   "Subsidy eligibility requires income verification through Healthcare.gov. Estimates 
   are based on 2026 federal poverty levels and may not reflect your actual subsidy amount."

3. **Agent Compensation:**
   "Our licensed agents may receive compensation from insurance carriers. This does not 
   affect the rates you pay."

4. **No Government Affiliation:**
   "We are an independent insurance agency, not affiliated with or endorsed by any 
   government entity or Healthcare.gov."

---

## SAFE COPY ALTERNATIVES

### UNSAFE:
- "Save up to 40%"
- "Get covered for $0"  
- "Guaranteed approval"
- "Best rates in America"

### SAFE:
- "See if you qualify for federal subsidies"
- "Coverage may be available for as low as $0/month for qualifying individuals"
- "Cannot be denied coverage due to pre-existing conditions (ACA requirement)"
- "Compare multiple plan options"

---

## RECOMMENDED QUESTION CHANGES

### CURRENT INCOME QUESTION:
"What's your household income?" → Direct, no context

### COMPLIANT VERSION:
"What is your estimated annual household income? (This helps determine subsidy eligibility. 
Final verification required through Healthcare.gov)"

---

## FILES TO UPDATE:
1. app/page.tsx - Add TCPA consent checkbox at step 6 (before phone collection)
2. app/page.tsx - Add disclaimers to thank you page
3. app/page.tsx - Remove specific dollar promises
4. app/page.tsx - Update hero copy to be compliant
