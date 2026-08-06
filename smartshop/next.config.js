/** @type {import('next').NextConfig} */
const path = require("path");

// Only require next-pwa in production to avoid dev issues.
const isProd = process.env.NODE_ENV === "production";

// Fallback: if next-pwa isn't installed or fails, just return base config.
let withPWA = (config) => config;
if (isProd) {
  try {
    withPWA = require("next-pwa")({
      dest: "public",
      disable: false, // PWA on in prod
      register: true,
      skipWaiting: true,
    });
  } catch (e) {
    console.warn("next-pwa not available, continuing without PWA", e?.message);
  }
}

const baseConfig = {
  reactStrictMode: true,
  images: { unoptimized: true }, // safe while using <img />
  // Pin root so parent/home package-lock.json files don't confuse module resolution
  outputFileTracingRoot: path.join(__dirname),
};

module.exports = withPWA(baseConfig);
