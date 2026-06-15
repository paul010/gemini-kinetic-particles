/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './data/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Light monochrome palette — black ink on white paper.
        paper: '#ffffff',
        ink: '#0a0a0a',
        surface: '#f4f4f5',
        accent: '#0a0a0a',
        accent2: '#71717a',
        ember: '#71717a',
      },
    },
  },
  plugins: [],
};
