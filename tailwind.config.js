/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#4f46e5',
        secondary: '#818cf8',
        danger: '#dc2626',
        success: '#10b981',
        dark: '#09090b',
        card: '#18181b',
        border: '#27272a',
        muted: '#52525b',
      },
    },
  },
  plugins: [],
};
