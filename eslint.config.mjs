import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"

export default defineConfig([
  ...nextVitals,
  {
    // Preserve the existing funnel/UI baseline. These predate this migration
    // and are tracked separately from the database/auth cutover.
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react/no-unescaped-entities": "off",
      "@next/next/no-html-link-for-pages": "off",
    },
  },
  {
    // Deferred, scoped to one file: server component reassigns `errored` inside Promise.all async closures; fixing it means restructuring the data loading, not a mechanical edit. Task 8 replaces this file; remove this override then.
    files: ["app/dashboard/admin/page.tsx"],
    rules: { "react-hooks/immutability": "off" },
  },
  {
    // Deferred, scoped to one file: writes filtersRef/pageSizeRef during render so realtime handlers never see stale values; moving them into effects changes timing. Task 8 replaces this file; remove this override then.
    files: ["components/dashboard/AdminDashboardClient.tsx"],
    rules: { "react-hooks/refs": "off" },
  },
  globalIgnores([".next/**", "node_modules/**", "drizzle/meta/**"]),
])
