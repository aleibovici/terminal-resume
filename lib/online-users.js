const { paint } = require("./ansi");
const { readStore } = require("./lastcall");

const WHIMSICAL = [
  { handle: "CAPSLOCK_GOBLIN", doing: "rolling for initiative in door 5/D" },
  { handle: "RAID_PRIEST", doing: "blessing a striped LUN" },
  { handle: "MODEM_GHOST", doing: "whispering at 2400 baud" },
];

function viewUsers() {
  const store = readStore();
  const total = store.uniqueCallers || 0;
  const logins = store.totalLogins || 0;

  const lines = [
    "",
    paint("── USERS ────────────────────────────────────────────────────────", "blue"),
    "",
    paint("Whimsical online:", "brightWhite"),
  ];

  for (const w of WHIMSICAL) {
    lines.push(
      `  ${paint(w.handle, "brightYellow")}  ${paint(w.doing, "brightBlack")}`
    );
  }

  lines.push("");
  lines.push(paint("Node stats (anonymous counters only):", "brightWhite"));
  lines.push(
    `  ${paint(String(total), "brightCyan")} unique callers · ${paint(
      String(logins),
      "brightCyan"
    )} total logins`
  );
  if (store.lastGlobal?.at) {
    lines.push(`  Last activity: ${store.lastGlobal.at}`);
  }

  lines.push("");
  lines.push(paint("(Live chat room not implemented — personas are fiction.)", "brightBlack"));
  return lines.join("\r\n");
}

module.exports = { viewUsers };