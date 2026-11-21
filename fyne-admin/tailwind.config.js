/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // FYNE SURFACES brand
        primary: {
          DEFAULT: '#2E7D32', // green — buttons, active states, links
          50: '#EDF7EE',
          100: '#D4EDD6',
          200: '#A9DBAD',
          300: '#76C27C',
          400: '#4CA453',
          500: '#2E7D32',
          600: '#27692A',
          700: '#1F5522',
          800: '#18421A',
          900: '#0F2E12',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#F57C00', // light orange — highlights, alerts, charts
          50: '#FFF4E6',
          100: '#FFE3C2',
          200: '#FFC985',
          300: '#FFAD47',
          400: '#FB9220',
          500: '#F57C00',
          600: '#D96C00',
          700: '#B35900',
          foreground: '#FFFFFF',
        },
        background: '#F9FAFB', // dashboard canvas
        surface: '#FFFFFF', // cards & sidebar
        border: '#E5E7EB',
        muted: { DEFAULT: '#F3F4F6', foreground: '#6B7280' },
        ink: { DEFAULT: '#111827', soft: '#374151' },
        danger: { DEFAULT: '#DC2626', 50: '#FEF2F2', 100: '#FEE2E2' },
        info: { DEFAULT: '#2563EB', 50: '#EFF6FF' },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)',
        pop: '0 12px 32px -8px rgba(16, 24, 40, 0.18), 0 4px 8px -4px rgba(16, 24, 40, 0.08)',
        ring: '0 0 0 4px rgba(46, 125, 50, 0.15)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'scale-in': { from: { opacity: 0, transform: 'scale(0.97) translateY(4px)' }, to: { opacity: 1, transform: 'scale(1) translateY(0)' } },
        'slide-in-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'slide-in-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'scale-in': 'scale-in 180ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slide-in-right 240ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-left': 'slide-in-left 240ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
