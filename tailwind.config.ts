import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#25c2a0',
          50: '#edfcf7',
          100: '#d3f8ec',
          200: '#abf0dc',
          300: '#74e3c6',
          400: '#3bcfab',
          500: '#25c2a0',
          600: '#1ea88a',
          700: '#178a72',
          800: '#166c5b',
          900: '#14594c',
        },
        // Workspace nav bar (leftmost)
        nav: {
          light: '#e5e7eb',
          dark: '#1e1f22',
        },
        // Sidebar
        sidebar: {
          light: '#f3f4f6',
          dark: '#2b2d31',
          bg: '#2b2d31',
          hover: 'rgba(79,84,92,0.3)',
          active: 'rgba(79,84,92,0.6)',
          text: '#f2f3f5',
          muted: '#949ba4',
        },
        // Main chat area
        chat: {
          bg: '#313338',
          surface: '#313338',
          hover: '#2e3035',
          border: '#3f4147',
          text: '#dbdee1',
          muted: '#949ba4',
          // Light mode overrides via CSS variables
        },
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 1.5s infinite',
        'pulse-dot': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
