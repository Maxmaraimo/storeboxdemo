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
          DEFAULT: "#c8ff6a",
          dark: "#a3e635",
          light: "#d9ff85",
          glow: "rgba(200, 255, 106, 0.4)",
          soft: "rgba(200, 255, 106, 0.15)",
        }
      },
      fontFamily: {
        sans: ["Inter", '"Segoe UI"', "Arial", "sans-serif"],
        mono: ["Inter", '"Segoe UI"', "Arial", "sans-serif"],
      },
      boxShadow: {
        "2xs": "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        "xs": "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
      }
    },
  },
  plugins: [],
}
