/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#2563eb',
        accentSoft: '#dbeafe',
        accentDark: '#1d4ed8',
        surface: '#ffffff',
        surfaceMuted: '#f1f5f9',
      },
      fontFamily: {
        inter: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 20px 45px -25px rgba(37, 99, 235, 0.35)',
      },
    },
  },
  plugins: [],
};
