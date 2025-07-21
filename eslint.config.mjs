import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh"; // This might not be strictly necessary with Next.js's Fast Refresh
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next"; // Import the Next.js ESLint plugin

export default tseslint.config(
  {
    // Ignore files and directories that should not be linted
    ignores: ["dist", ".next", "node_modules"],
  },
  {
    // Apply recommended JavaScript and TypeScript configurations
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      // Integrate Next.js recommended and core web vitals rules
      // Note: @next/eslint-plugin-next does not directly export "recommended" or "core-web-vitals"
      // as extends. You typically add them as rules within the config or use the
      // `next lint` command which sets up the default config.
      // For flat config, you'd usually import specific rules or use the plugin directly.
    ],
    files: ["**/*.{ts,tsx,js,jsx,mjs,cjs}"], // Apply to all relevant file types
    languageOptions: {
      ecmaVersion: 2020, // Or higher, e.g., 2022 or "latest"
      sourceType: "module", // Use ES modules
      globals: {
        ...globals.browser, // Browser globals
        // Add Node.js globals if you have server-side files that need linting
        // ...globals.node,
      },
      parser: tseslint.parser, // Specify TypeScript parser
      parserOptions: {
        project: "./tsconfig.json", // Point to your main tsconfig.json
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh, // Keep for now, but Next.js has its own Fast Refresh
      "@next/next": nextPlugin, // Register the Next.js plugin
    },
    rules: {
      // Inherited React Hooks rules
      ...reactHooks.configs.recommended.rules,

      // React Refresh rule (might be less critical with Next.js Fast Refresh)
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // TypeScript ESLint rules
      "@typescript-eslint/no-unused-vars": "off", // Keeping your original override

      // Next.js specific rules (examples - you might want to add more based on next lint defaults)
      // These are typically enabled by `eslint-config-next` when using the default setup.
      // With flat config, you might need to explicitly enable them if not using a preset.
      "@next/next/no-html-link-for-pages": "off", // Often turned off if you prefer standard <a> tags for internal navigation
      "@next/next/no-img-element": "warn", // Warns about using <img> instead of <Image>
      // You can add more Next.js rules as needed, e.g.:
      // "@next/next/no-sync-scripts": "error",
      // "@next/next/no-script-component-in-head": "error",
    },
    settings: {
      // Configure settings for plugins, e.g., React version detection
      react: {
        version: "detect", // Automatically detect React version
      },
      // If you're using the App Router, you might need to configure this for the Next.js plugin
      // This setting is typically handled by `eslint-config-next` automatically.
      next: {
        rootDir: true, // Assumes the root of your project is where Next.js runs
      },
    },
  }
);
