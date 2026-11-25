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
          DEFAULT: '#3F863F',
          50: '#F2F8F1',
          100: '#DFEDDE',
          200: '#BDDBBA',
          300: '#93C58F',
          400: '#69A965',
          500: '#3F863F',
          600: '#347235',
          700: '#2A5D2C',
          800: '#214923',
          900: '#173719',
          950: '#0D2610',
        },
        accent: {
          DEFAULT: '#FDBB59',
          50: '#FFF8EA',
          100: '#FDEBCB',
          200: '#FAD99C',
          300: '#F7C46D',
          400: '#FDBB59',
          500: '#EAA642',
          600: '#C78624',
          700: '#8F5C12',
        },
        canvas: '#F7F8F4', // soft botanical neutral sections
        ink: {
          DEFAULT: '#0F1A12', // near-black with a green undertone
          soft: '#3B4540',
          muted: '#6B746F',
          faint: '#9AA29D',
        },
        line: '#E4E8E1',
        sand: '#F3F0E8', // warm neutral for premium image backdrops
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Lora Variable"', 'Lora', 'Georgia', 'serif'],
      },
      fontSize: {
        // Fluid display scale for editorial headings
        'display-xl': ['clamp(2.75rem, 6vw + 1rem, 5.75rem)', { lineHeight: '0.98', letterSpacing: '-0.035em', fontWeight: '600' }],
        'display-lg': ['clamp(2.25rem, 3.5vw + 1rem, 4rem)', { lineHeight: '1.04', letterSpacing: '-0.03em', fontWeight: '600' }],
        'display-md': ['clamp(1.75rem, 2vw + 1rem, 2.75rem)', { lineHeight: '1.1', letterSpacing: '-0.025em', fontWeight: '600' }],
        eyebrow: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.18em', fontWeight: '600' }],
      },
      boxShadow: {
        soft: '0 2px 8px rgba(15, 26, 18, 0.04), 0 14px 36px -18px rgba(15, 26, 18, 0.18)',
        lift: '0 30px 64px -24px rgba(15, 26, 18, 0.3)',
        image: '0 18px 44px -24px rgba(8, 26, 10, 0.38)',
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
