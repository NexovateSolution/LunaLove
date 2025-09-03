/** @type {import('tailwindcss').Config} */

module.exports = {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',


    
    theme: {
      extend: {
        fontFamily: {
          sans: ['Poppins', 'Inter', 'sans-serif'],
        },
        colors: {
          primary: {
            DEFAULT: '#F72585', // Figma's main fuchsia
            dark: '#B5179E',
            light: '#FDE8F4',
          },
          accent: '#7209B7',
          background: '#FFF0F6',
          // Add more from Figma if needed
        },
        borderRadius: {
          xl: '1.5rem',
          '2xl': '2rem',
        },
      },
    },
    plugins: [],
  }