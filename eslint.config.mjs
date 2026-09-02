import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Üretilen ve üçüncü taraf dosyalar bizim kural setimize tabi değil:
    // Prisma client üretiliyor, .claude/skills dış depolardan kopyalandı,
    // .devdb yerel PostgreSQL veri dizini.
    "src/generated/**",
    ".claude/**",
    ".devdb/**",
    "public/**",
  ]),
]);

export default eslintConfig;
