import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef8ff",
          100: "#d9efff",
          500: "#1570ef",
          600: "#175cd3",
          700: "#1849a9"
        },
        success: {
          50: "#ecfdf3",
          700: "#027a48"
        },
        warning: {
          50: "#fffaeb",
          700: "#b54708"
        },
        danger: {
          50: "#fef3f2",
          700: "#b42318"
        }
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.1)"
      }
    },
  },
  plugins: [],
} satisfies Config;
