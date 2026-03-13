/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1B3A5C',
          dark: '#0F2439',
          deep: '#0A1929',
          light: '#2a4a6b',
        },
        amazon: '#FF9900',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      keyframes: {
        'bounce-dot': {
          '0%, 80%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '40%': { transform: 'translateY(-6px)', opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'bubble-in': {
          from: { opacity: '0', transform: 'scale(0.8) translateY(8px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
      animation: {
        'bounce-dot': 'bounce-dot 1.4s ease-in-out infinite',
        'slide-up': 'slide-up 0.25s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'bubble-in': 'bubble-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
