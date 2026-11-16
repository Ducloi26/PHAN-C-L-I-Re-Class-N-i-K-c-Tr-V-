/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        memory: {
          cream: '#FFFDF9',
          warm: '#F7F2EA',
          gold: '#D4AF37',
          amber: '#F59E0B',
          wood: '#8B5A2B',
          burgundy: '#800020',
          darkgreen: '#1B4332',
          chalkboard: '#1E3A2F',
        }
      },
      fontFamily: {
        serif: ['Merriweather', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

