/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/popup.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        e_black: "rgb(9, 9, 11)",
        e_ash: "rgb(39, 39, 42)",
      },
    },
  },
  plugins: [],
};
