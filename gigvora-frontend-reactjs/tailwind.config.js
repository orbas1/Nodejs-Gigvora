/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0b0b0b',
        accent: '#00f5c9',
        secondary: '#1f2933',
      },
      fontFamily: {
        inter: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
