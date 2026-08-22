import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', './app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#050505',
          deep: '#0B0B0B',
          yellow: '#FFD400',
          bright: '#FFEA00',
          surface: '#151515',
          border: '#27272A',
          gray: '#A1A1AA'
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        glow: '0 20px 60px rgb(var(--theme-primary-rgb) / 0.22)'
      }
    }
  },
  plugins: []
};

export default config;
