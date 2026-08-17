import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module", // Use "commonjs" here if your project uses require() instead of import
      globals: {
        ...globals.node, // Gives ESLint knowledge of Node globals (process, __dirname, etc.)
      },
    },
    rules: {
      // You can add custom backend rules here later
    },
  },
];
