/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./order.html", "./menu.html"],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['"Instrument Sans"', 'sans-serif'],
        'display': ['"Playfair Display"', 'serif'],
        'mono': ['"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
      }
    },
  },
  plugins: [],
}
