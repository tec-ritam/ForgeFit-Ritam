/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#070A12', 900: '#0B0F1A', 800: '#111726', 700: '#1A2236',
          600: '#242D44', 500: '#33405C', 400: '#4A5A7A',
        },
        brand: {
          50: '#E8FFF6', 100: '#C2FCE6', 200: '#83F8CC', 300: '#3DF0B0',
          400: '#06E095', 500: '#00C27C', 600: '#009A63', 700: '#007A51',
          800: '#055840', 900: '#064536',
        },
        accent: {
          400: '#22D3EE', 500: '#06B6D4', 600: '#0891B2',
        },
        gold: { 400: '#FBBF24', 500: '#F59E0B' },
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(6,224,149,0.45)',
        card: '0 10px 40px -12px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'grid-dark': "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
      },
      keyframes: {
        floaty: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        shimmer: { '0%': { backgroundPosition: '-1000px 0' }, '100%': { backgroundPosition: '1000px 0' } },
        pulseGlow: { '0%,100%': { opacity: '0.6' }, '50%': { opacity: '1' } },
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        pulseGlow: 'pulseGlow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
