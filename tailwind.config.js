/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#fd267a',
        secondary: '#ff6036',
        danger: '#ff4d4d',
        success: '#34c271',
        dark: '#0d0d10',
        card: '#1c1c22',
        border: '#27272a',
        muted: '#52525b',
      },
    },
  },
  plugins: [],
};
