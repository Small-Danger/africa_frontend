/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#0B5E3C',
          'green-dark': '#094A30',
          'green-light': '#E8F5EF',
          orange: '#F39200',
          'orange-dark': '#D97E00',
          'orange-light': '#FFF4E5',
          cream: '#FAFAF8',
        },
        primary: {
          50: '#E8F5EF',
          500: '#0B5E3C',
          600: '#094A30',
          700: '#073D27',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
