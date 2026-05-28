import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"SF Mono"', '"Fira Code"', 'monospace'],
      },
      colors: {
        // macOS-like system colors
        glass:  'rgba(30, 30, 40, 0.72)',
        'glass-light': 'rgba(255,255,255,0.08)',
        'glass-border': 'rgba(255,255,255,0.12)',
        menubar: 'rgba(22, 22, 30, 0.82)',
        dock:    'rgba(40, 40, 55, 0.62)',
        claude: {
          50:  '#f0f0ff',
          100: '#e0e0fe',
          200: '#c5c5fd',
          300: '#a09ffa',
          400: '#8179f7',
          500: '#6c5ef2',
          600: '#5a47e6',
          700: '#4b39cd',
          800: '#3e30a5',
          900: '#342c82',
        },
        surface: {
          0:   '#0d0d14',
          1:   '#13131e',
          2:   '#1a1a28',
          3:   '#222234',
          4:   '#2a2a40',
        }
      },
      backdropBlur: {
        xs: '4px',
        '2xl': '40px',
        '3xl': '60px',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '22px',
      },
      boxShadow: {
        window:   '0 32px 80px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(255,255,255,0.1)',
        dock:     '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
        menubar:  '0 1px 0 rgba(255,255,255,0.06)',
        'inner-light': 'inset 0 1px 0 rgba(255,255,255,0.12)',
      },
      animation: {
        'bounce-in': 'bounceIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'fade-up':   'fadeUp 0.3s ease-out',
        'spotlight': 'spotlightIn 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      keyframes: {
        bounceIn: {
          '0%':   { transform: 'scale(0.3)', opacity: '0' },
          '60%':  { transform: 'scale(1.05)' },
          '80%':  { transform: 'scale(0.97)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeUp: {
          '0%':   { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',   opacity: '1' },
        },
        spotlightIn: {
          '0%':   { transform: 'translateY(-12px) scale(0.97)', opacity: '0' },
          '100%': { transform: 'translateY(0)     scale(1)',    opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
