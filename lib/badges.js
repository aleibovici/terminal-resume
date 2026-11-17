/** Badge ids echoed to client for localStorage collector. */
const BADGE_DEFS = [
  { id: "modem", label: "Carrier Detected", hint: "Heard modem handshake on login" },
  { id: "rip", label: "RIP Artist", hint: "Opened RIP graphics" },
  { id: "door", label: "Door Runner", hint: "Finished the ANSI door adventure" },
  { id: "archive", label: "Archive Diver", hint: "Visited menu item 9" },
  { id: "sysop", label: "SYMMETRIC", hint: "SysOp easter egg code (display only)" },
];

/**
 * @param {string} id
 */
function badgeEvent(id) {
  return { event: "badge_unlock", badge: id };
}

/**
 * @param {string[]} unlocked
 */
function formatScoreScreen(unlocked) {
  const { paint } = require("./ansi");
  const lines = [
    "",
    paint("── SCORE / BADGES ────────────────────────────────────────────────", "blue"),
    "",
    paint("Collector progress (browser + node echo):", "brightWhite"),
    "",
  ];
  for (const def of BADGE_DEFS) {
    const got = unlocked.includes(def.id);
    lines.push(
      `  ${paint(got ? "[*]" : "[ ]", got ? "brightGreen" : "brightBlack")} ` +
        paint(def.label, got ? "brightYellow" : "white") +
        paint(` — ${def.hint}`, "brightBlack")
    );
  }
  lines.push("");
  lines.push(
    paint(`${unlocked.length}/${BADGE_DEFS.length}`, "cyan") +
      paint(" unlocked — share your SCORE at the pub.", "brightBlack")
  );
  return lines.join("\r\n");
}

module.exports = { BADGE_DEFS, badgeEvent, formatScoreScreen };