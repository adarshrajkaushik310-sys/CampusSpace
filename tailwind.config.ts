import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        campus: {
          black: "#000000",
          white: "#FFFFFF",
          red: {
            DEFAULT: "#DC2626",
            hover: "#B91C1C",
            subtle: "#FEF2F2",
            border: "#FCA5A5",
          },
          purple: {
            DEFAULT: "#7C3AED",
            hover: "#6D28D9",
            subtle: "#F5F3FF",
            border: "#DDD6FE",
          },
          blue: {
            DEFAULT: "#2563EB",
            hover: "#1D4ED8",
            subtle: "#EFF6FF",
            border: "#BFDBFE",
          },
          neutral: {
            50: "#F9FAFB",
            100: "#F3F4F6",
            200: "#E5E7EB",
            300: "#D1D5DB",
            400: "#9CA3AF",
            500: "#6B7280",
            600: "#4B5563",
            700: "#374151",
            800: "#1F2937",
            900: "#111827",
            950: "#0A0A0A",
          },
        },
      },
      boxShadow: {
        bubble: "0 2px 6px 0 rgba(37, 99, 235, 0.20)",
        "bubble-hover": "0 4px 10px 0 rgba(37, 99, 235, 0.30)",
        "bubble-purple": "0 2px 6px 0 rgba(124, 58, 237, 0.20)",
        "bubble-danger": "0 2px 6px 0 rgba(220, 38, 38, 0.20)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        panel: "0 4px 12px -2px rgba(0, 0, 0, 0.06)",
      },
      borderRadius: {
        pill: "9999px",
      },
    },
  },
  plugins: [],
};
export default config;
