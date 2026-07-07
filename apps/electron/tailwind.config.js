/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        spider: {
          bg: {
            DEFAULT: '#080810',
            sidebar: '#0a0a18',
            panel: '#0d0d1e',
            hover: 'rgba(255, 255, 255, 0.05)',
          },
          border: '#1e1e3a',
          text: {
            DEFAULT: '#e2e8f0',
            dim: '#94a3b8',
            muted: '#64748b',
          },
          red: {
            DEFAULT: '#cc1a1a',
            bright: '#ff2d2d',
          },
          green: {
            DEFAULT: '#1adb6e',
          },
          purple: {
            DEFAULT: '#8b5cf6',
          }
        }
      },
      fontFamily: {
        display: ['Bangers', 'Outfit', 'sans-serif'],
        sans: ['"Comic Neue"', 'Inter', 'sans-serif'],
        mono: ['"Fira Code"', 'Courier New', 'monospace'],
        digital: ['Orbitron', 'monospace'],
        comic: ['Bangers', 'Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
