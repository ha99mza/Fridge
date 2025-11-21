/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fridgeDark: "#0f172a", // bleu nuit
        fridgeCard: "#020617",
        },
    },
  },
  plugins: [],
}

