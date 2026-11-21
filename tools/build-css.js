// Builds one small CSS file per page from that page's own Tailwind settings, so visitors'
// browsers no longer download and run Tailwind (cdn.tailwindcss.com) on every visit.
//   npm install && npm run css      (run again after changing classes in a page)
const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const tailwind = require('tailwindcss');

const ROOT = path.join(__dirname, '..');
const PAGES = {
  'index.html': 'css/home.css',
  'redworm/index.html': 'css/redworm-home.css',
  'redworm/cover-picker.html': 'css/cover-picker.css',
  'redworm/index-maker.html': 'css/index-maker.css',
  'redworm/proofread.html': 'css/proofread.css',
};
// Classes also come from scripts (book cards, showroom panels), so those are scanned too.
const SCRIPTS = ['showroom.js', 'showroom-data.js', 'redworm/*.js', 'redworm/books/**/*.js'];

(async () => {
  for (const [page, out] of Object.entries(PAGES)) {
    const name = path.basename(out, '.css');
    const config = {
      ...require(path.join(__dirname, 'tailwind', `${name}.config.js`)),
      content: [page, ...SCRIPTS].map((p) => path.join(ROOT, p)),
    };
    const res = await postcss([tailwind(config)]).process(
      '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n',
      { from: undefined }
    );
    const css = new (require('clean-css'))({ level: 1 }).minify(res.css).styles;
    fs.mkdirSync(path.dirname(path.join(ROOT, out)), { recursive: true });
    fs.writeFileSync(path.join(ROOT, out), `/* Built by tools/build-css.js from ${page}. Do not edit. */\n${css}\n`);
    console.log(out, (css.length / 1024).toFixed(1) + ' KB');
  }
})();
