/** Static Tailwind build config (replaces the cdn.tailwindcss.com runtime).
 *  Rebuild after changing classes in HTML/JS:
 *  npx -y tailwindcss@3.4.17 -c tailwind.config.js -i css/tailwind.src.css -o css/tailwind.css --minify
 */
module.exports = {
  content: ["./*.html", "./js/*.js"],
  theme: {
    extend: {},
  },
  plugins: [],
};
