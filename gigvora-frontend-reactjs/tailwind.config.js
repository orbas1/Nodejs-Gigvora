const withOpacityVariable = (variable) => ({ opacityValue }) => {
  if (opacityValue === undefined) {
    return `rgb(var(${variable}))`;
  }
  return `rgb(var(${variable}) / ${opacityValue})`;
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: withOpacityVariable('--gv-color-accent-rgb'),
        accentStrong: 'var(--gv-color-accent-strong)',
        accentSoft: 'var(--gv-color-accent-soft)',
        accentDark: 'var(--gv-color-accent-strong)',
        primary: withOpacityVariable('--gv-color-primary-rgb'),
        text: withOpacityVariable('--gv-color-text-rgb'),
        surface: 'var(--gv-color-surface)',
        surfaceMuted: 'var(--gv-color-surface-muted)',
        surfaceElevated: 'var(--gv-color-surface-elevated)',
        border: 'var(--gv-color-border)',
      },
      fontFamily: {
        inter: ['var(--gv-font-sans)', 'sans-serif'],
      },
      boxShadow: {
        soft: 'var(--gv-shadow-soft)',
        subtle: 'var(--gv-shadow-subtle)',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 28s linear infinite',
      },
    },
  },
  plugins: [],
};
