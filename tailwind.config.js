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
    './bench/**/*.{ts,tsx}',
    './fugu/**/*.{ts,tsx}',
    './copilot/**/*.{ts,tsx}',
    './copilotcamp/**/*.{ts,tsx}',
    './agents/**/*.{ts,tsx}',
    './skills/**/*.{ts,tsx}',
    './town/**/*.{ts,tsx}',
    './patterns/**/*.{ts,tsx}',
    './prompts/**/*.{ts,tsx}',
    './cici/**/*.{ts,tsx}',
    './designskill/**/*.{ts,tsx}',
    './videogen/**/*.{ts,tsx}',
    './dino/**/*.{ts,tsx}',
    './chengdu/**/*.{ts,tsx}',
    './lab3d/**/*.{ts,tsx}',
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
        // Values live as RGB-triplet CSS variables in index.css so that
        // [data-theme="dark"] flips every page while opacity modifiers
        // (e.g. ink/10, paper/85) keep working.
        paper: 'rgb(var(--rgb-paper) / <alpha-value>)',
        ink: 'rgb(var(--rgb-ink) / <alpha-value>)',
        surface: 'rgb(var(--rgb-surface) / <alpha-value>)',
        accent: 'rgb(var(--rgb-ink) / <alpha-value>)',
        accent2: 'rgb(var(--rgb-accent2) / <alpha-value>)',
        ember: 'rgb(var(--rgb-accent2) / <alpha-value>)',
        gold: 'rgb(var(--rgb-gold) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};
