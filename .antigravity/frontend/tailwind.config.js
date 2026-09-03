/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        polar: {
          950: '#030712',
          900: '#0b1329',
          850: '#0f172a',
          800: '#111e38',
          700: '#1e293b',
          600: '#334155',
          accent: '#06b6d4',
          cyan: '#22d3ee',
          green: '#10b981',
          danger: '#ef4444',
          warning: '#f59e0b',
          ice: '#e0f2fe'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace', 'Consolas'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'neon-green': '0 0 15px rgba(16, 185, 129, 0.45)',
        'neon-cyan': '0 0 15px rgba(34, 211, 238, 0.45)',
        'neon-red': '0 0 15px rgba(239, 68, 68, 0.45)'
      }
    },
  },
  plugins: [],
}
