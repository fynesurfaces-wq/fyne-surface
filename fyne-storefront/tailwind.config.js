/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', sm: '1.5rem', lg: '2.5rem' },
      screens: { '2xl': '1360px' },
    },
    extend: {
      colors: {
        // FYNE SURFACES brand
        primary: {
          DEFAULT: '#2E7D32',
          50: '#F1F8F1',
          100: '#DCEFDD',
          200: '#B6DDB9',
          300: '#86C38B',
          400: '#55A35C',
          500: '#2E7D32',
          600: '#26692A',
          700: '#1F5522',
          800: '#17401A',
          900: '#0F2B11',
          950: '#081A0A',
        },
        accent: {
          DEFAULT: '#F57C00',
          50: '#FFF6EB',
          100: '#FFE7C7',
          200: '#FFCB8A',
          300: '#FFAA4D',
          400: '#FB9020',
          500: '#F57C00',
          600: '#D46A00',
          700: '#A85400',
        },
        canvas: '#F9FAFB', // soft gray sections
        ink: {
          DEFAULT: '#0F1A12', // near-black with a green undertone
          soft: '#3B4540',
          muted: '#6B746F',
          faint: '#9AA29D',
        },
        line: '#E7EAE8',
        sand: '#F4F1EA', // warm neutral for premium image backdrops
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Fluid display scale for editorial headings
        'display-xl': ['clamp(2.75rem, 6vw + 1rem, 5.75rem)', { lineHeight: '0.98', letterSpacing: '-0.035em', fontWeight: '600' }],
        'display-lg': ['clamp(2.25rem, 3.5vw + 1rem, 4rem)', { lineHeight: '1.04', letterSpacing: '-0.03em', fontWeight: '600' }],
        'display-md': ['clamp(1.75rem, 2vw + 1rem, 2.75rem)', { lineHeight: '1.1', letterSpacing: '-0.025em', fontWeight: '600' }],
        eyebrow: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.18em', fontWeight: '600' }],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 26, 18, 0.04), 0 8px 24px -12px rgba(15, 26, 18, 0.12)',
        lift: '0 24px 48px -20px rgba(15, 26, 18, 0.28)',
        drawer: '-24px 0 64px -24px rgba(15, 26, 18, 0.25)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
