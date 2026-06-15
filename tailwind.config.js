/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './data/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
    './arsenal/**/*.{ts,tsx}',
    './tools/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Cormorant Garamond"', '"Noto Serif SC"', 'Georgia', 'serif'],
        serif: ['"Cormorant Garamond"', '"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Warm editorial palette — ink on cream paper (huashu-inspired).
        paper: '#f6f3ec',
        ink: '#1c1a17',
        surface: '#ece6da',
        accent: '#1c1a17',
        accent2: '#8a8175',
        ember: '#8a8175',
        gold: '#8a682c',
      },
    },
  },
  plugins: [],
};
