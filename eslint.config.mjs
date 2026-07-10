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
  globalIgnores([".next/**", "node_modules/**", "drizzle/meta/**"]),
])
