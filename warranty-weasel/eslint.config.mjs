import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": ["warn", { 
                "argsIgnorePattern": "^_", 
                "varsIgnorePattern": "^_",
                "caughtErrorsIgnorePattern": "^_"
            }],
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/triple-slash-reference": "off"
        }
    },
    {
        ignores: [".next/*", "node_modules/*", "next-env.d.ts"]
    }
];
