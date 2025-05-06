/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    borderRadius: {
      'none': '0',
      'sm': '0.125rem',
      DEFAULT: '4px',
      'md': '0.375rem',
      'lg': '0.5rem',
      'full': '9999px',
      'large': '2rem'
    },
    extend: {
      colors: {
        primary: "#e50056",
        darkPrimary: "#CF004E",
      },
      keyframes: {
        highlight: {
          '0%': { backgroundColor: '#e50056', borderColor: '#e50056' },
          '100%': { backgroundColor: 'transparent', borderColor: 'transparent' },
        },
      },
      animation: {
        highlight: 'highlight 1.5s ease-out',
      },
    },
  },
  plugins: [],
}