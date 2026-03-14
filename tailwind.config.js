/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef4ff',
          100: '#dfe8ff',
          200: '#c6d6ff',
          300: '#9db9ff',
          400: '#7091ff',
          500: '#4b68f0',
          600: '#394bd3',
          700: '#2f3cae',
          800: '#2b3589',
          900: '#27315f',
        },
        steel: {
          50: '#f7f9fb',
          100: '#eef2f7',
          200: '#dde5ee',
          300: '#c5d1df',
          400: '#9db0c6',
          500: '#7a90a8',
          600: '#5f7388',
          700: '#4d5c6f',
          800: '#414c5b',
          900: '#39424f',
        },
      },
      boxShadow: {
        card: '0 12px 32px -20px rgba(22, 37, 66, 0.35)',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
      },
      backgroundImage: {
        'grid-light':
          'radial-gradient(circle at 1px 1px, rgba(70, 100, 140, 0.15) 1px, transparent 0)',
      },
    },
  },
  plugins: [],
}
