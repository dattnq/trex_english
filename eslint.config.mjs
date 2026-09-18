import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // The seed CLI is deliberately CommonJS (.cjs), as in the Word guide.
  { files: ["scripts/seed.cjs", "scripts/test-auth.cjs", "scripts/test-admin.cjs", "scripts/test-logic.cjs", "scripts/test-session-sync.cjs", "scripts/test-pronunciation.cjs", "scripts/test-learning.cjs", "scripts/test-ops.cjs", "scripts/check-readiness.cjs", "scripts/finalize-sessions.cjs", "scripts/backup.cjs"], rules: { "@typescript-eslint/no-require-imports": "off" } },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/generated/prisma/**",
  ]),
]);

export default eslintConfig;
