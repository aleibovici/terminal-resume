const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

const required = [
  "public/index.html",
  "public/vendor/xterm/xterm.min.js",
  "public/vendor/addon-fit/addon-fit.min.js",
  "server/index.js",
  "index.js",
];

for (const rel of required) {
  fs.accessSync(path.join(root, rel));
}

const aliases = [
  ["public/vendor/xterm/xterm.min.js", "public/vendor/xterm/xterm.js"],
  ["public/vendor/addon-fit/addon-fit.min.js", "public/vendor/addon-fit/addon-fit.js"],
];

for (const [src, dest] of aliases) {
  fs.copyFileSync(path.join(root, src), path.join(root, dest));
}

console.log("verify-build ok");