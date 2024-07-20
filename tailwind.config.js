/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens:{
        "xs":"320px",
        "sm":"425px",
        "md":"768px",
      }
    },
  },
  plugins: [],
}