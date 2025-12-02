/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        onat: {
          red: '#C41E3A',
          dark: '#8B0000',
          light: '#FFE4E6',
          accent: '#DC143C'
        },
        fiscal: {
          green: '#059669',
          yellow: '#D97706',
          blue: '#0284C7'
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Source Sans 3', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    },
  },
  plugins: [],
}

