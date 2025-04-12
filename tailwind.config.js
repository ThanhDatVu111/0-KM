/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#F5CDDE",
        accent: "#F5829B",
      },
      fontFamily: {
        'poppins': ['Poppins-Regular'],
        'poppins-bold': ['Poppins-Bold'],
        'poppins-medium': ['Poppins-Medium'],
        'poppins-light': ['Poppins-Light'],
      }
    },
  },
  plugins: [],
};