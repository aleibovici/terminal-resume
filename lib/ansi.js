/** @typedef {Record<string, string>} AnsiCodes */

/** @type {AnsiCodes} */
const FG = {
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  brightBlack: "\x1b[90m",
  brightRed: "\x1b[91m",
  brightGreen: "\x1b[92m",
  brightYellow: "\x1b[93m",
  brightBlue: "\x1b[94m",
  brightMagenta: "\x1b[95m",
  brightCyan: "\x1b[96m",
  brightWhite: "\x1b[97m",
};

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const CLEAR = "\x1b[2J\x1b[H";

/**
 * @param {string} text
 * @param {string} [color]
 * @param {{ bold?: boolean }} [opts]
 */
function paint(text, color, opts = {}) {
  const fg = color && FG[color] ? FG[color] : "";
  const bold = opts.bold ? BOLD : "";
  return `${bold}${fg}${text}${RESET}`;
}

module.exports = {
  FG,
  RESET,
  BOLD,
  CLEAR,
  paint,
};