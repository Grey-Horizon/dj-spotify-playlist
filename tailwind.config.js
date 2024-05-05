/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        spotify: "#1DB954",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
