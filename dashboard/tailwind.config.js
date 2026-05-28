/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        os: {
          bg: '#080a0f',
          surface: '#0f1117',
          panel: '#13161e',
          border: '#1c2030',
          hover: '#1e2438',
          active: '#252a3d',
          accent: '#7c3aed',
          'accent-glow': '#9f5cf7',
          'accent-dim': '#4c1d95',
          muted: '#3d4562',
          text: '#e2e8f0',
          'text-dim': '#94a3b8',
          'text-faint': '#4a5568',
          green: '#10b981',
          blue: '#3b82f6',
          yellow: '#f59e0b',
          orange: '#f97316',
          red: '#ef4444',
          pink: '#ec4899',
          cyan: '#06b6d4',
          teal: '#14b8a6',
          purple: '#a855f7',
          indigo: '#6366f1',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'blink': 'blink 1.2s step-end infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(124, 58, 237, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.6)' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      boxShadow: {
        'panel': '0 0 0 1px rgba(28, 32, 48, 0.8), 0 4px 24px rgba(0, 0, 0, 0.4)',
        'accent': '0 0 20px rgba(124, 58, 237, 0.3)',
        'glow': '0 0 30px rgba(124, 58, 237, 0.5)',
      },
    },
  },
  plugins: [],
};
