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
        // Monochrome palette — pure black & white with neutral grays.
        ink: '#0a0a0a',
        surface: '#161616',
        accent: '#ffffff',
        accent2: '#a3a3a3',
        ember: '#d4d4d4',
      },
    },
  },
  plugins: [],
};
