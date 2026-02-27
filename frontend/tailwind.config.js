/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sky: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          700: '#0369a1',
        },
      },
    },
  },
  plugins: [],
};
