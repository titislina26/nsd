/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        surface: '#ffffff',
        'surface-elevated': '#ffffff',
        border: '#e2e8f0',
        'border-subtle': '#f1f5f9',
        primary: {
          DEFAULT: '#15803d',
          hover: '#166534',
          muted: 'rgba(22, 163, 74, 0.08)',
          foreground: '#ffffff',
        },
        success: {
          DEFAULT: '#16a34a',
          hover: '#15803d',
          muted: 'rgba(22, 163, 74, 0.08)',
          foreground: '#ffffff',
        },
        warning: {
          DEFAULT: '#d97706',
          hover: '#b45309',
          muted: 'rgba(217, 119, 6, 0.08)',
          foreground: '#ffffff',
        },
        danger: {
          DEFAULT: '#dc2626',
          hover: '#b91c1c',
          muted: 'rgba(220, 38, 38, 0.06)',
          foreground: '#ffffff',
        },
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
