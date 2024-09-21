module.exports = {
    // ... existing configuration ...
    rules: {
        // ... existing rules ...
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": ["error", { "varsIgnorePattern": "^_" }],
        "react-hooks/exhaustive-deps": "off",
        "@next/next/no-img-element": "off",
    },
    // ... rest of the configuration ...
}