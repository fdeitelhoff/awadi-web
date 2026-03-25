import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";
import { fixupPluginRules } from "@eslint/compat";

// eslint-plugin-react@7.x uses context.getFilename() which was removed in
// ESLint 10. fixupPluginRules adds the missing shim so the plugin works again.
// Only the react plugin needs patching — other plugins (@typescript-eslint,
// @next/next, etc.) are already ESLint 10 compatible.
const patchedCoreWebVitals = coreWebVitals.map((config) => {
  if (!config.plugins?.react) return config;
  return {
    ...config,
    plugins: { ...config.plugins, react: fixupPluginRules(config.plugins.react) },
  };
});

const eslintConfig = [
  { ignores: [".next/**"] },
  ...patchedCoreWebVitals,
  ...typescript,
  {
    rules: {
      // Setting state synchronously in useEffect is an intentional project-wide
      // pattern for showing loading skeletons before async data fetches begin.
      // The react-hooks@7 rule is too strict for this valid use case.
      "react-hooks/set-state-in-effect": "off",

      // Allow variables prefixed with _ to be unused (discard convention).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
];

export default eslintConfig;
