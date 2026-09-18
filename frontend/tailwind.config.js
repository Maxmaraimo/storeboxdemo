/** @type {import("tailwindcss").Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#211B2E",
          dark: "#14101C",
          surface: "#2C243D",
          light: "#3A314E",
          50: "#F7F6F9",
          100: "#EFEBF5",
          200: "#DDD4EA",
          500: "#3A314E",
          600: "#2C243D",
          700: "#211B2E",
          800: "#171321",
          900: "#100D17",
        },
        charcoal: {
          DEFAULT: "#211B2E",
          dark: "#14101C",
          surface: "#2C243D",
          deep: "#171321",
        },
        lime: {
          DEFAULT: "#00D668",
          dark: "#059669",
          glow: "rgba(0, 214, 104, 0.4)",
          soft: "rgba(0, 214, 104, 0.12)",
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        "2xs": "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        "xs": "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
      }
    },
  },
  plugins: [],
}
