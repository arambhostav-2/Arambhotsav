/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        maroon: '#5c0a0a',
        deepred: '#8b0000',
        gold: '#f5c451',
        goldlight: '#ffe9a8',
        orange: '#ff7a1a',
        purple: '#5b21b6',
        night: '#160409',
      },
      fontFamily: {
        display: ['"Yatra One"', '"Rajdhani"', 'system-ui', 'sans-serif'],
        body: ['"Mukta"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'ken-burns': 'kenburns 24s ease-in-out infinite alternate',
        'float-slow': 'floaty 7s ease-in-out infinite',
        'spin-slow': 'spin 14s linear infinite',
        'pulse-glow': 'pulseGlow 2.4s ease-in-out infinite',
      },
      keyframes: {
        kenburns: {
          '0%': { transform: 'scale(1) translateY(0)' },
          '100%': { transform: 'scale(1.15) translateY(-1.5%)' },
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        pulseGlow: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(245,196,81,.55), 0 8px 30px rgba(255,122,26,.35)' },
          '50%': { boxShadow: '0 0 0 12px rgba(245,196,81,0), 0 8px 44px rgba(255,122,26,.55)' },
        },
      },
    },
  },
  plugins: [],
};
