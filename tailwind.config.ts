import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ios: {
          bg: '#000000',
          card: 'rgba(255, 255, 255, 0.08)',
          cardBorder: 'rgba(255, 255, 255, 0.15)',
          glass: 'rgba(22, 22, 28, 0.65)',
          accent: '#0A84FF',
          safe: '#30D158',
          warning: '#FFD60A',
          danger: '#FF453A',
          purple: '#BF5AF2',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Inter', 'sans-serif'],
        mono: ['SF Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
