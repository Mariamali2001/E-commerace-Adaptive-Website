
// postcss.config.js
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},   // <-- Tailwind v4 plugin
    autoprefixer: {},
  },
};

// module.exports = {
//   plugins: {
//     "@tailwindcss/postcss": {}, // 👈 use this instead of "tailwindcss"
//     autoprefixer: {},
//   },
// };