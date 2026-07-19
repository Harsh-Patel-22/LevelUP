/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0f',
        surface: {
          DEFAULT: '#12121a',
          hover: '#1a1a26',
          border: '#232334',
        },
        solo: {
          blue: '#4f8ef7',
          violet: '#7c3aed',
          cyan: '#22d3ee',
          danger: '#ef4444',
          gold: '#f59e0b',
        },
        text: {
          primary: '#e2e8f0',
          muted: '#64748b',
          dim: '#475569',
        },
      },
      fontFamily: {
        orbitron: ['var(--font-orbitron)', 'sans-serif'],
        rajdhani: ['var(--font-rajdhani)', 'sans-serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      boxShadow: {
        'solo-blue': '0 0 15px rgba(79, 142, 247, 0.4)',
        'solo-violet': '0 0 15px rgba(124, 58, 237, 0.4)',
        'solo-cyan': '0 0 15px rgba(34, 211, 238, 0.4)',
        'solo-gold': '0 0 15px rgba(245, 158, 11, 0.4)',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '0.6', filter: 'drop-shadow(0 0 8px rgba(79, 142, 247, 0.6))' },
          '50%': { opacity: '1', filter: 'drop-shadow(0 0 18px rgba(79, 142, 247, 0.9))' },
        },
        'float-xp': {
          '0%': { opacity: '0', transform: 'translateY(0px) scale(0.8)' },
          '20%': { opacity: '1', transform: 'translateY(-10px) scale(1.1)' },
          '80%': { opacity: '1', transform: 'translateY(-35px) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-45px) scale(0.9)' },
        },
      },
      animation: {
        'glow-pulse': 'glow-pulse 2.5s infinite ease-in-out',
        'float-xp': 'float-xp 1.2s ease-out forwards',
      },
    },
  },
  plugins: [],
};
