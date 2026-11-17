/**
 * CRT phosphor themes for xterm.js + page chrome.
 */
(function (global) {
  /** @type {Record<string, { xterm: Record<string, string>; label: string }>} */
  const TERMINAL_THEMES = {
    green: {
      label: "classic green phosphor",
      xterm: {
        background: "#050608",
        foreground: "#b8f0c8",
        cursor: "#7cfc98",
        black: "#1a1a1a",
        red: "#ff6b6b",
        green: "#7cfc98",
        yellow: "#ffd966",
        blue: "#6eb5ff",
        magenta: "#d896ff",
        cyan: "#5fe4ff",
        white: "#e8ffe8",
        brightBlack: "#4a5a50",
        brightRed: "#ff9999",
        brightGreen: "#b8ffc8",
        brightYellow: "#fff3a0",
        brightBlue: "#a8d4ff",
        brightMagenta: "#eeb8ff",
        brightCyan: "#a8f0ff",
        brightWhite: "#ffffff",
      },
    },
    amber: {
      label: "amber monochrome",
      xterm: {
        background: "#0a0804",
        foreground: "#ffc966",
        cursor: "#ffe08a",
        black: "#1a1408",
        red: "#ff8866",
        green: "#d4b85c",
        yellow: "#ffd966",
        blue: "#b8a060",
        magenta: "#d4a070",
        cyan: "#e8c878",
        white: "#fff0d0",
        brightBlack: "#6a5840",
        brightRed: "#ffaa88",
        brightGreen: "#ffe08a",
        brightYellow: "#fff3b0",
        brightBlue: "#d4c090",
        brightMagenta: "#e8c0a0",
        brightCyan: "#ffe8a8",
        brightWhite: "#fff8e8",
      },
    },
  };

  const ORDER = ["green", "amber"];

  /**
   * @param {import("@xterm/xterm").Terminal} term
   * @param {string} name
   */
  function applyTerminalTheme(term, name) {
    const theme = TERMINAL_THEMES[name] || TERMINAL_THEMES.green;
    document.documentElement.dataset.theme = name;
    term.options.theme = { ...theme.xterm };
  }

  /**
   * @param {string} current
   */
  function nextThemeName(current) {
    const idx = ORDER.indexOf(current);
    const base = idx >= 0 ? idx : 0;
    return ORDER[(base + 1) % ORDER.length];
  }

  global.TERMINAL_THEMES = TERMINAL_THEMES;
  global.applyTerminalTheme = applyTerminalTheme;
  global.nextThemeName = nextThemeName;
})(typeof window !== "undefined" ? window : globalThis);