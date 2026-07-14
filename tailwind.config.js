/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // "Certified document" palette: deep trust-navy + a notarial
        // crimson seal accent, on an off-white paper background.
        notary: {
          950: "#0e1526",
          900: "#131c33",
          800: "#1c2745",
          700: "#283563",
          600: "#3a4a86",
          400: "#8590b8",
          200: "#dde1ef",
          50: "#faf9f6",
        },
        seal: {
          700: "#7a1a1f",
          600: "#9c1f26",
          500: "#b8272f",
          400: "#cf4b52",
        },
        parchment: "#f6f3ec",
      },
      fontFamily: {
        display: ["'Source Serif 4'", "Georgia", "serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
        signature: ["'Great Vibes'", "cursive"],
      },
      boxShadow: {
        paper: "0 1px 2px rgba(14,21,38,0.06), 0 8px 24px rgba(14,21,38,0.08)",
      },
    },
  },
  plugins: [],
};
