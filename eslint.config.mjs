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
    // Not application code: infra/ holds CloudFront Functions, which run on the
    // cloudfront-js-2.0 runtime and expose `handler` to the platform rather than to any
    // caller in this repo. Linting them as Next source only ever reports that.
    "infra/**",
  ]),
]);

export default eslintConfig;
