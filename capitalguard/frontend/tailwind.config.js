/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'background-lime': '#ccff00',
        primary: '#abd600',
        'primary-container': '#0b1000',
        'on-primary-container': '#698500',
        
        'surface-obsidian': '#000000',
        'surface': '#131313',
        'background': '#131313',
        'core-dark': '#110e08',
        
        'surface-container-low': '#0e0e0e',
        'surface-container': '#1a1a1a',
        'surface-container-high': '#252525',
        'surface-container-highest': '#353535',
        'surface-bright': '#393939',
        
        danger: '#FF3B30',
        warning: '#FF9500',
        error: '#ffb4ab',
        'error-container': '#93000a',
        
        'on-surface': '#e2e2e2',
        'on-surface-variant': '#cdc5bc',
        
        outline: '#969087',
        'outline-variant': '#4b463f',
      },
      fontFamily: {
        display: ['Newsreader', 'serif'],
        sans: ['"Hanken Grotesk"', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '1rem',
        lg: '2rem',
        xl: '3rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
}
