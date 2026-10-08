# Build log

## 2026-10-06
- Spec approved; plan written and reviewed (pressure test: clear after fixes; senior review: go with changes); fixes folded in.

## 2026-10-08
- Task 1 (toolchain): `pnpm lint` now runs with the redesign's `eslint.config.mjs`. Baseline on main: 0 errors in legal-frozen files (only `@next/next/no-img-element` warnings, left as warnings); 3 errors in 2 non-frozen files.
- Disabled rule, deferred fix: `react-hooks/immutability` for `app/dashboard/admin/page.tsx` only (line 55, `errored` reassigned inside `Promise.all` async closures). Not a mechanical fix. Task 8 replaces the file; remove the override then.
- Disabled rule, deferred fix: `react-hooks/refs` for `components/dashboard/AdminDashboardClient.tsx` only (lines 186 and 190, refs written during render for realtime handlers). Moving them into effects changes timing. Task 8 replaces the data layer; remove the override then.
- Warnings left as is: 16 `@next/next/no-img-element` in landing, funnel, legal and footer files (legal-frozen), and 2 unused `eslint-disable` directives at `components/dashboard/AdminDashboardClient.tsx:196` and `:318`.
