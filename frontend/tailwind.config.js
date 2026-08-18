/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eefbf3",
          100: "#d6f5e1",
          200: "#b0eac9",
          300: "#7bd9ab",
          400: "#43c088",
          500: "#20a570",
          600: "#14855b",
          700: "#116a4b",
          800: "#11543d",
          900: "#0f4534",
        },
        accent: {
          50: "#eef4ff",
          100: "#e0eaff",
          200: "#c7d8ff",
          300: "#a3bcff",
          400: "#7a97ff",
          500: "#5b6df8",
          600: "#4448ec",
          700: "#3936d0",
          800: "#302fa8",
          900: "#2c2d85",
        },
        coral: {
          400: "#ff8b7a",
          500: "#ff6b5b",
          600: "#f34a3a",
        },
      },
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 40px -10px rgba(20, 133, 91, 0.25)",
        card: "0 4px 24px rgba(0,0,0,0.06)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        slideUp: { "0%": { opacity: 0, transform: "translateY(10px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};
