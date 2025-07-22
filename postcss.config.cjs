// sports-disscussing-field/postcss.config.cjs
// This file uses CommonJS syntax because it's renamed to .cjs
// to be compatible with "type": "module" in package.json.

module.exports = {
  plugins: {
    // Change 'tailwindcss' to '@tailwindcss/postcss' for Tailwind CSS v4
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};
