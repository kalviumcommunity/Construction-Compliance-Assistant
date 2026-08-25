/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        slate: {
          850: '#172033',
          900: '#0f172a',
          950: '#0a0f1d',
        },
        surface: {
          base: '#0c1222',
          card: '#131b2e',
          cardHover: '#18233c',
          cardBorder: '#1e2d4a',
          muted: '#1e293b',
          subtle: '#334155',
        },
        accent: {
          teal: '#0d9488',
          cyan: '#0284c7',
          sky: '#0284c7',
          amber: '#f59e0b',
        },
        status: {
          pass: {
            bg: '#064e3b',
            card: '#062c23',
            border: '#059669',
            text: '#34d399',
            light: '#d1fae5',
          },
          fail: {
            bg: '#7f1d1d',
            card: '#3b0d0d',
            border: '#dc2626',
            text: '#f87171',
            light: '#fee2e2',
          },
          warn: {
            bg: '#78350f',
            card: '#381604',
            border: '#d97706',
            text: '#fbbf24',
            light: '#fef3c7',
          }
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'warm-glow': '0 0 25px -5px rgba(249, 115, 22, 0.25)',
        'pass-glow': '0 0 25px -5px rgba(16, 185, 129, 0.3)',
        'fail-glow': '0 0 25px -5px rgba(239, 68, 68, 0.3)',
        'warn-glow': '0 0 25px -5px rgba(245, 158, 11, 0.3)',
        'elevation': '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
