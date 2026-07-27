# Meta (Facebook) Pixel + Conversions API

**Added:** 2026-07 on `redesign/union-private-healthcare`.

Client Pixel and server Conversions API (CAPI) run together, deduplicated by a shared `event_id` (the 2026 standard — recovers the conversions client-only pixels lose to iOS/ad-blockers). Everything is **env-driven and inert until configured**: no pixel id / token means nothing fires.

## Events

| Event | Fired from | Transport |
|---|---|---|
| `PageView` | every page | client Pixel (`components/meta/MetaPixel.tsx`) |
| `QuizStart` (custom) | quiz opens | client Pixel (`components/union/quiz.tsx`) |
| `Lead` | quiz submit succeeds | **client Pixel + server CAPI**, shared `event_id` |

The `Lead` `event_id` is generated in the quiz, fired client-side immediately, and sent in the `/api/leads` body so the server CAPI event (`app/api/leads/route.ts`, step 5) carries the same id. Meta keeps one and drops the duplicate.

## Environment variables

| Variable | Secret? | Scope | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_META_PIXEL_ID` | No (public) | Build-time, per env | Dataset (pixel) id. Powers the client pixel. |
| `META_CAPI_ACCESS_TOKEN` | **Yes** | Runtime, server only | CAPI token. Never `NEXT_PUBLIC_*`, never committed. |
| `META_CAPI_TEST_EVENT_CODE` | No | Runtime | Routes CAPI events to Meta's **Test Events** tool. **Remove for production** or real events won't count. |
| `META_GRAPH_VERSION` | No | Runtime | Defaults to `v25.0`. |

PII (email, phone, name, zip, country) is normalized and **SHA-256 hashed server-side** before it reaches Meta (`lib/meta/hash.ts`). Raw PII never leaves the server.

## Two datasets (Union vs Dynasty)

The code is dataset-agnostic — it reads whatever `NEXT_PUBLIC_META_PIXEL_ID` + `META_CAPI_ACCESS_TOKEN` the environment provides. So each brand/environment points at its own dataset by setting different values per Vercel scope. This branch (Union) uses dataset `3488467954634719`. The Dynasty dataset only receives data if the live Dynasty site is instrumented separately (this codebase, once live as Union, emits to the Union dataset only).

## Activating it

**Local** (`.env.local`, gitignored): `NEXT_PUBLIC_META_PIXEL_ID` and `META_CAPI_TEST_EVENT_CODE` are set. Add the token:

```bash
echo 'META_CAPI_ACCESS_TOKEN=<your-token>' >> .env.local
```

**Vercel** (Settings → Environment Variables): add all four to the appropriate scope (Preview for this branch, Production at cutover). Redeploy.

## Verifying

1. Meta Events Manager → your dataset → **Test Events**, enter code `TEST2519`.
2. Submit one quiz lead on the site.
3. Expect to see `PageView`, `QuizStart`, and a **deduplicated** `Lead` (browser + server, collapsed to one) tagged with the test code.
4. Check **Event Match Quality** on the Lead — the hashed email/phone/name/zip should push it up.

## Before production

- **Remove `META_CAPI_TEST_EVENT_CODE`** so events count as real conversions.
- **Rotate `META_CAPI_ACCESS_TOKEN`** if it was ever shared in plaintext (chat, docs).
- Confirm the privacy policy disclosure of Meta tracking (already added to `/privacy`).
