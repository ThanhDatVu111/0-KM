/** @type {import('tailwindcss').Config} */

const plugin = require('tailwindcss/plugin');

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],

  theme: {
    extend: {
      colors: {
        primary: '#F5CDDE',
        accent: '#F5829B',
        custom: '#F7BAD4',
      },
      fontFamily: {
        poppins: ['Poppins-Regular'],
        'poppins-bold': ['Poppins-Bold'],
        'poppins-medium': ['Poppins-Medium'],
        'poppins-light': ['Poppins-Light'],
      },
    },
  },
  plugins: [
    plugin(({ addComponents }) => {
      addComponents({
        // define a new “tab-screen” class
        '.tab-screen': {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
        },
      });
    }),
  ],
};
