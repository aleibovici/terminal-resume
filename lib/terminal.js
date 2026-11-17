const { CLEAR, paint } = require("./ansi");
const { RESUME } = require("./resume");
const {
  readStore,
  recordLogin,
  formatLastCaller,
  formatVisitTime,
  viewLastCalls,
} = require("./lastcall");
const { sanitizeUsername } = require("./persist-limits");
const { badgeEvent, formatScoreScreen } = require("./badges");
const { viewTracert, viewNodes } = require("./tracert");
const { startDoor, handleDoorInput } = require("./door-adventure");
const { signGuestbook } = require("./guestbook");
const { formatPlan } = require("./plan");
const { formatChatAnswer } = require("./chat");
const { viewUsers } = require("./online-users");

/** Display-only BBS easter egg — not authentication (any login otherwise works). */
const SYSOP_EASTER_EGG = "SYMMETRIC";

const RIP_COMMANDS = new Set(["RIP", "G", "GRAPHICS"]);

/**
 * @typedef {{ visitor: string; displayName: string; sysop?: boolean }} SessionInfo
 * @typedef {"login_username" | "login_password" | "menu" | "sysop_password" | "door_adventure"} Phase
 */

/**
 * @param {SessionInfo | null} session
 */
function banner(session) {
  const { owner } = RESUME;
  const lines = [
    paint("╔══════════════════════════════════════════════════════════════╗", "cyan"),
    paint("║", "cyan") +
      paint("   T E R M I N A L   R É S U M É   —   ", "brightCyan", { bold: true }) +
      paint(owner.name.toUpperCase(), "brightWhite", { bold: true }) +
      paint("   ║", "cyan"),
    paint("║", "cyan") +
      paint("     remote access aesthetic · 2400 baud feel · ANSI on     ", "brightBlack") +
      paint("║", "cyan"),
    paint("╚══════════════════════════════════════════════════════════════╝", "cyan"),
    "",
    paint(owner.tagline, "brightYellow"),
    "",
  ];

  if (session) {
    lines.push(
      paint(`Session: ${session.displayName}`, "green") +
        paint(` (@${session.visitor})`, "brightBlack")
    );
  } else {
    lines.push(paint("Awaiting remote login (any credentials accepted).", "yellow"));
  }
  lines.push("");
  return lines.join("\r\n");
}

/**
 * @param {SessionInfo} session
 */
function mainMenu(session) {
  const lines = [
    CLEAR,
    banner(session),
    paint("── Main Menu ──────────────────────────────────────────────────", "blue"),
    "",
    menuRow("1", "V", "View Resume", paint("experience & education", "brightBlack")),
    menuRow("2", "A", "About", paint("short bio", "brightBlack")),
    menuRow("3", "S", "Skills", paint("grouped list", "brightBlack")),
    menuRow("4", "C", "Contact", paint("email & links", "brightBlack")),
    menuRow("5", "D", "Door Game", paint("stub adventure", "brightBlack")),
    "",
    paint("  9", "brightBlack") +
      "  " +
      paint("Archive", "brightBlack") +
      "  " +
      paint("(BBS lore easter egg)", "brightBlack"),
    "",
    paint("  !", "brightMagenta") +
      "  " +
      paint("SysOp gate", "brightBlack") +
      "  " +
      paint("(password required)", "brightBlack"),
    "",
    paint("[?] Help", "green") +
      "  " +
      paint("[L] Logout", "red") +
      "  " +
      paint("[M] Menu", "cyan", { bold: true }),
    "",
    paint("Select 1–5, 9, !, or letters; ? help:", "white"),
  ];
  return lines.join("\r\n");
}

/**
 * @param {string} num
 * @param {string} letter
 * @param {string} label
 * @param {string} hint
 */
function menuRow(num, letter, label, hint) {
  return (
    `  ${paint(num, "yellow")} / ${paint(letter, "cyan")}  ` +
    paint(label, "brightWhite", { bold: true }) +
    "  " +
    hint
  );
}

function loginScreen() {
  const store = readStore();
  return [
    CLEAR,
    banner(null),
    paint("── Remote Access Login ─────────────────────────────────────────", "blue"),
    "",
    paint("This is a stylized login — ", "brightBlack") +
      paint("any username and password work", "brightYellow") +
      paint(".", "brightBlack"),
    "",
    paint("Last activity on node: ", "brightBlack") +
      paint(formatLastCaller(store.lastGlobal), "brightYellow"),
    paint(" (WHOIS · LAST before login)", "brightBlack"),
    "",
    paint("Username: ", "green"),
  ].join("\r\n");
}

function loginPromptPassword() {
  return paint("Password: ", "green");
}

/**
 * @param {string} username
 */
function buildSession(username, sysop) {
  const visitor = normalizeVisitor(username);
  return {
    visitor,
    displayName: visitor === "andre" ? RESUME.owner.name : titleCase(visitor),
    sysop: Boolean(sysop),
  };
}

/**
 * @param {SessionInfo} session
 */
function sysopBanner(session) {
  return [
    "",
    paint("╔══════════════════ SYSOP OVERRIDE ══════════════════╗", "brightMagenta", {
      bold: true,
    }),
    paint("║", "brightMagenta") +
      paint("  PRIVILEGED MODE — NODE " + RESUME.owner.handle.toUpperCase(), "brightWhite", {
        bold: true,
      }) +
      paint("     ║", "brightMagenta"),
    paint("║", "brightMagenta") +
      paint("  Carrier bonded · matrix unlocked · have fun.", "brightCyan") +
      paint(" ║", "brightMagenta"),
    paint("╚══════════════════════════════════════════════════╝", "brightMagenta"),
    "",
    paint(`Operator: ${session.displayName}`, "brightGreen"),
    "",
  ].join("\r\n");
}

/**
 * @param {string} username
 * @param {boolean} [sysop]
 * @param {{
 *   ok?: boolean;
 *   previousGlobalAt: string | null;
 *   previousVisitorAt: string | null;
 *   firstVisit: boolean;
 * }} [lastSnap]
 */
function loginSuccess(username, sysop, lastSnap) {
  const session = buildSession(username, sysop);
  const prelude = sysop
    ? [
        sysopBanner(session),
        paint("SysOp handshake accepted at login.", "brightMagenta"),
      ]
    : [
        "",
        paint("Carrier online. Access granted.", "brightGreen"),
        paint("(No accounts or database — demo login only.)", "brightBlack"),
      ];

  const lastLines = lastSnap
    ? [
        "",
        paint("Prior node activity: ", "brightBlack") +
          paint(
            lastSnap.previousGlobalAt
              ? `another caller @ ${formatVisitTime({ at: lastSnap.previousGlobalAt })}`
              : "no prior callers",
            "brightYellow"
          ),
        paint("Your last visit: ", "brightBlack") +
          paint(
            lastSnap.previousVisitorAt
              ? formatVisitTime({ at: lastSnap.previousVisitorAt })
              : "first connection",
            "brightYellow"
          ),
      ]
    : [];

  const events = ["login_ok", badgeEvent("modem")];
  if (sysop) {
    events.push(badgeEvent("sysop"));
  }
  return {
    output: [...prelude, ...lastLines, "", mainMenu(session)].join("\r\n"),
    session,
    phase: /** @type {const} */ ("menu"),
    events,
  };
}

function helpText() {
  return [
    "",
    paint("── Help ───────────────────────────────────────────────────────", "blue"),
    "",
    "Commands are case-insensitive.",
    "  1 or V  — View Resume",
    "  2 or A  — About",
    "  3 or S  — Skills",
    "  4 or C  — Contact",
    "  5 or D  — Door game (stub)",
    "  9       — Archive easter egg",
    "  !       — SysOp gate (password prompt)",
    "  WHOIS or FINGER — Node operator mini-profile",
    "  LAST    — Anonymous activity log (times only)",
    "  THEME or T — Toggle green / amber CRT",
    "  GREEN / AMBER — Set phosphor theme",
    "  RIP / G / GRAPHICS — RIP-style vector screen (mouse)",
    "  RIPT / TIMELINE — RIP career timeline (clickable)",
    "  TEXT    — Exit graphics pane",
    "  TRACERT / NODES — Career dial-out map",
    "  DL / DOWNLOAD — File area downloads",
    "  SIGN <msg> — Guestbook one-liner",
    "  PLAN    — Sysop .plan (blog RSS)",
    "  CHAT / ASK <q> — SysOp Q&A (public facts)",
    "  USERS / SCORE / BADGES — Online fiction + collector",
    "  SOUND / SFX on|off — Keyboard blips",
    "  ?       — This help",
    "  M       — Main menu",
    "  L       — Log out",
    paint("  Scrollback: mouse wheel or Shift+PgUp/PgDn", "brightBlack"),
    "",
    paint("Edit content in lib/resume.js", "brightYellow"),
    "",
  ].join("\r\n");
}

function viewResume() {
  const lines = [
    "",
    paint(`── Résumé: ${RESUME.owner.name} ─────────────────────────────────`, "blue"),
    paint(`    ${RESUME.owner.title}`, "cyan"),
    paint(`    ${RESUME.owner.location}`, "brightBlack"),
    "",
  ];
  for (const row of RESUME.resumeLines) {
    lines.push(row.startsWith("═") ? paint(row, "brightBlue") : row);
  }
  return sectionFooter(lines.join("\r\n"));
}

function viewAbout() {
  const lines = [
    "",
    paint("── About ──────────────────────────────────────────────────────", "blue"),
    "",
    ...RESUME.aboutLines,
  ];
  return sectionFooter(lines.join("\r\n"));
}

function viewSkills() {
  const lines = [
    "",
    paint("── Skills ─────────────────────────────────────────────────────", "blue"),
    "",
  ];
  for (const group of RESUME.skills) {
    lines.push(paint(`${group.group}:`, "yellow", { bold: true }));
    lines.push(
      "  " + group.items.map((s) => paint(s, "brightCyan")).join(paint(" · ", "brightBlack"))
    );
    lines.push("");
  }
  return sectionFooter(lines.join("\r\n"));
}

function viewContact() {
  const lines = [
    "",
    paint("── Contact ────────────────────────────────────────────────────", "blue"),
    "",
    RESUME.contact.intro,
    "",
  ];
  for (const row of RESUME.contact.rows) {
    const note = row.note ? paint(` (${row.note})`, "brightBlack") : "";
    lines.push(
      `  ${paint(row.label.padEnd(10), "green")} ${paint(row.value, "brightWhite")}${note}`
    );
  }
  lines.push("");
  lines.push(paint("(Stub URLs/emails — replace in lib/resume.js.)", "brightBlack"));
  return sectionFooter(lines.join("\r\n"));
}

function viewArchiveEgg() {
  return sectionFooter(
    [
      "",
      paint("── Archive ────────────────────────────────────────────────────", "brightBlack"),
      "",
      paint(RESUME.archiveEasterEgg, "brightBlack"),
      "",
      paint("Play the door stub on menu 5/D.", "magenta"),
    ].join("\r\n")
  );
}

function viewDoorGame() {
  const score = 420 + Math.floor(Math.random() * 80);
  const yourScore = Math.floor(Math.random() * 120) + 12;
  return sectionFooter(
    [
      "",
      paint("── Door: Ruins of ANSI (stub) ─────────────────────────────────", "magenta"),
      "",
      paint("Dialing external door ROM... OK", "brightBlack"),
      paint("You stand before a blinking CAPS LOCK goblin.", "white"),
      paint("You roll 1d20... " + (4 + (yourScore % 6)) + ".", "yellow"),
      paint("You toss a floppy disk and escape with " + yourScore + " gold.", "green"),
      "",
      paint("FAKE HIGH SCORE BOARD", "brightCyan", { bold: true }),
      paint("  #1  SYSOP .......... " + String(score).padStart(6, "0"), "brightYellow"),
      paint("  #2  GUEST .......... 0000880", "brightBlack"),
      paint("  #3  YOU ............ " + String(yourScore).padStart(6, "0"), "brightWhite"),
      "",
      paint("(Full LORD/WWIV not implemented — M for menu.)", "brightBlack"),
    ].join("\r\n")
  );
}

function sysopPasswordPrompt() {
  return paint("SysOp password: ", "brightMagenta");
}

function getRipScreenPayload() {
  const { owner, contact } = RESUME;
  const blogRow = contact.rows.find((r) => r.label === "Blog");
  return {
    name: owner.name,
    title: owner.title,
    location: owner.location,
    blog: blogRow ? blogRow.value : "https://myvirtualcloud.net",
  };
}

/**
 * @param {boolean} loggedIn
 * @param {string} terminalTheme
 */
function ripEnterResult(loggedIn, terminalTheme) {
  return {
    output: [
      "",
      paint("── RIP Graphics ─────────────────────────────────────────────────", "blue"),
      "",
      paint("!|RIPscrip 1.54 emulation", "brightCyan", { bold: true }),
      paint(" — vector page via host; mouse U-buttons active.", "white"),
      "",
      paint("Dual screen: graphics pane + text terminal below.", "brightBlack"),
      paint("Click buttons or type TEXT to leave graphics.", "brightBlack"),
      "",
      paint("M = menu · ? = help · TEXT = exit graphics", "brightBlack"),
    ].join("\r\n"),
    events: [
      badgeEvent("rip"),
      {
        event: "rip_enter",
        rip: getRipScreenPayload(),
        theme: terminalTheme,
        loggedIn,
      },
    ],
  };
}

const TIMELINE_ZONES = [
  { year: "2009", label: "Blog launch", cmd: "A", x: 48, y: 108, w: 130, h: 44 },
  { year: "VDI", label: "View/Horizon", cmd: "V", x: 200, y: 108, w: 130, h: 44 },
  { year: "K8s", label: "Kubernetes", cmd: "S", x: 352, y: 108, w: 120, h: 44 },
  { year: "GPU", label: "ML infra", cmd: "S", x: 488, y: 108, w: 110, h: 44 },
  { year: "NOW", label: "Contact", cmd: "C", x: 268, y: 168, w: 120, h: 40 },
];

/**
 * @param {boolean} loggedIn
 * @param {string} terminalTheme
 */
function ripTimelineResult(loggedIn, terminalTheme) {
  return {
    output: [
      "",
      paint("── RIP Timeline (RIPT) ───────────────────────────────────────────", "blue"),
      "",
      paint("Click a year region — sends résumé section jump via host !|U.", "brightBlack"),
      "",
      paint("M = menu · TEXT = exit graphics", "brightBlack"),
    ].join("\r\n"),
    events: [
      badgeEvent("rip"),
      {
        event: "rip_timeline",
        rip: getRipScreenPayload(),
        timeline: TIMELINE_ZONES,
        theme: terminalTheme,
        loggedIn,
      },
    ],
  };
}

function viewDownloads() {
  return sectionFooter(
    [
      "",
      paint("── Downloads / file area ─────────────────────────────────────────", "blue"),
      "",
      paint("GET /download/resume.ans", "brightCyan") + paint("   — ANSI résumé", "brightBlack"),
      paint("GET /download/session.txt", "brightCyan") + paint(" — modem transcript", "brightBlack"),
      paint("GET /download/contact.vcf", "brightCyan") + paint("  — contact card", "brightBlack"),
      "",
      paint("Open URLs in browser or curl -O http://127.0.0.1:3847/download/...", "brightYellow"),
    ].join("\r\n")
  );
}

/**
 * @param {string[]} badges
 */
function viewScore(badges) {
  return sectionFooter(
    formatScoreScreen(badges) +
      "\r\n" +
      paint("Browser BADGES also tracks localStorage collector.", "brightBlack")
  );
}

/**
 * @param {string} cmd
 */
function isRipEnterCommand(cmd) {
  return RIP_COMMANDS.has(cmd);
}

function viewWhois() {
  const { owner, contact } = RESUME;
  const blogRow = contact.rows.find((r) => r.label === "Blog");
  const blog = blogRow ? blogRow.value : "https://myvirtualcloud.net";

  return sectionFooter(
    [
      "",
      paint("── WHOIS / FINGER @node ─────────────────────────────────────────", "blue"),
      "",
      paint("Login-Name:", "green") + " " + paint(owner.handle, "brightWhite"),
      paint("Name:", "green") + " " + paint(owner.name, "brightWhite"),
      paint("Role:", "green") + " " + paint(owner.title, "cyan"),
      paint("Office:", "green") + " " + paint(owner.location, "brightWhite"),
      paint("URL:", "green") + " " + paint(blog, "brightCyan"),
      "",
      paint("Plan:", "yellow") + " " + owner.tagline,
      "",
      paint("Finger:", "brightBlack") +
        " " +
        paint("myvirtualcloud.net — technical writing since 2009.", "brightYellow"),
    ].join("\r\n")
  );
}

/**
 * @param {string} theme
 */
function themeAck(theme) {
  const label = theme === "amber" ? "amber monochrome" : "classic green phosphor";
  return sectionFooter(
    [
      "",
      paint("── CRT THEME ────────────────────────────────────────────────────", "blue"),
      "",
      paint("Phosphor set → ", "white") + paint(label, theme === "amber" ? "brightYellow" : "brightGreen"),
      paint("(Client display updated.)", "brightBlack"),
    ].join("\r\n")
  );
}

/**
 * @param {string} current
 * @param {string} [explicit]
 */
function resolveTheme(current, explicit) {
  if (explicit === "GREEN") {
    return "green";
  }
  if (explicit === "AMBER") {
    return "amber";
  }
  if (explicit === "THEME" || explicit === "T") {
    return current === "amber" ? "green" : "amber";
  }
  return current;
}

/**
 * @param {string} body
 */
function sectionFooter(body) {
  return body + "\r\n" + paint("M = main menu · ? = help:", "brightBlack") + "\r\n";
}

/**
 * @param {string} raw
 */
function normalizeVisitor(raw) {
  const v = sanitizeUsername(raw).toLowerCase();
  return v || "visitor";
}

/**
 * @param {string} raw
 */
function titleCase(raw) {
  return raw
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * @param {{
 *   phase: Phase;
 *   session: SessionInfo | null;
 *   pendingUsername?: string;
 *   terminalTheme?: string;
 *   doorState?: object | null;
 *   badges?: string[];
 *   clientKey?: string;
 *   connectionLastAt?: string | null;
 *   firstLoginOnConnection?: boolean;
 *   input: string;
 * }} ctx
 */
function handleInput(ctx) {
  const clientKey = ctx.clientKey || "local";
  const line = String(ctx.input || "").trim();
  let { phase, session, pendingUsername, doorState } = ctx;
  const terminalTheme = ctx.terminalTheme || "green";
  const badges = ctx.badges || [];

  if (phase === "login_username") {
    const loginCmd = line.toUpperCase();
    if (loginCmd === "WHOIS" || loginCmd === "FINGER") {
      return {
        output: viewWhois() + "\r\n" + paint("Username: ", "green"),
        phase: "login_username",
        session: null,
        terminalTheme,
      };
    }
    if (loginCmd === "LAST") {
      return {
        output: viewLastCalls() + "\r\n\r\n" + paint("Username: ", "green"),
        phase: "login_username",
        session: null,
        terminalTheme,
      };
    }
    if (isRipEnterCommand(loginCmd)) {
      const rip = ripEnterResult(false, terminalTheme);
      return {
        output: rip.output + "\r\n\r\n" + paint("Username: ", "green"),
        phase: "login_username",
        session: null,
        terminalTheme,
        events: rip.events,
      };
    }
    if (loginCmd === "TEXT") {
      return {
        output: paint("Graphics closed.", "brightBlack") + "\r\n" + paint("Username: ", "green"),
        phase: "login_username",
        session: null,
        terminalTheme,
        events: [{ event: "rip_exit" }],
      };
    }
    if (
      loginCmd === "THEME" ||
      loginCmd === "T" ||
      loginCmd === "GREEN" ||
      loginCmd === "AMBER"
    ) {
      const loginTheme = resolveTheme(terminalTheme, loginCmd);
      return {
        output: themeAck(loginTheme) + "\r\n" + paint("Username: ", "green"),
        phase: "login_username",
        session: null,
        terminalTheme: loginTheme,
        events: [{ event: "theme_set", theme: loginTheme }],
      };
    }

    pendingUsername = sanitizeUsername(line || "visitor");
    return {
      output: loginPromptPassword(),
      phase: "login_password",
      session: null,
      pendingUsername,
      terminalTheme,
    };
  }

  if (phase === "login_password") {
    const isSysop = line.toUpperCase() === SYSOP_EASTER_EGG;
    const visitor = sanitizeUsername(pendingUsername || "visitor");
    const recorded = recordLogin(clientKey, Boolean(ctx.firstLoginOnConnection));
    const lastSnap = {
      previousGlobalAt: recorded.previousGlobalAt,
      previousVisitorAt: ctx.connectionLastAt ?? null,
      firstVisit: !ctx.connectionLastAt,
    };
    const result = loginSuccess(visitor, isSysop, lastSnap);
    return {
      output: result.output,
      phase: result.phase,
      session: result.session,
      events: result.events,
      connectionLoginAt: recorded.ok ? recorded.at : null,
      terminalTheme,
    };
  }

  if (phase === "door_adventure" && doorState) {
    const doorResult = handleDoorInput(doorState, line);
    return {
      output: doorResult.output,
      phase: doorResult.phase,
      session,
      terminalTheme,
      doorState: doorResult.doorState,
      events: doorResult.events || [],
    };
  }

  if (phase === "sysop_password" && session) {
    if (line.toUpperCase() === SYSOP_EASTER_EGG) {
      const nextSession = { ...session, sysop: true };
      return {
        output:
          sysopBanner(nextSession) +
          "\r\n" +
          mainMenu(nextSession),
        phase: "menu",
        session: nextSession,
        events: [badgeEvent("sysop")],
      };
    }
    return {
      output:
        paint("Access denied.", "brightRed") +
        "\r\n\r\n" +
        mainMenu(session),
      phase: "menu",
      session,
    };
  }

  const cmd = line.toUpperCase();
  if (!cmd) {
    return { output: paint("Command: ", "green"), phase, session };
  }

  if (cmd === "L") {
    return {
      output: loginScreen(),
      phase: "login_username",
      session: null,
      events: ["logout"],
    };
  }

  if (cmd === "M" && session) {
    return { output: mainMenu(session), phase, session };
  }

  if (cmd === "?") {
    return {
      output: helpText() + "\r\n" + paint("Command: ", "green"),
      phase,
      session,
    };
  }

  if (cmd === "1" || cmd === "V") {
    return { output: viewResume(), phase, session };
  }
  if (cmd === "2" || cmd === "A") {
    return { output: viewAbout(), phase, session };
  }
  if (cmd === "3" || cmd === "S") {
    return { output: viewSkills(), phase, session };
  }
  if (cmd === "4" || cmd === "C") {
    return { output: viewContact(), phase, session };
  }
  if (cmd === "5" || cmd === "D") {
    const door = startDoor(doorState);
    return {
      output: door.output,
      phase: door.phase,
      session,
      terminalTheme,
      doorState: door.doorState,
      events: door.events,
    };
  }
  if (cmd === "9") {
    return {
      output: viewArchiveEgg(),
      phase,
      session,
      terminalTheme,
      events: [badgeEvent("archive")],
    };
  }
  if (cmd === "!") {
    return {
      output: "\r\n" + sysopPasswordPrompt(),
      phase: "sysop_password",
      session,
      terminalTheme,
    };
  }

  if (cmd === "WHOIS" || cmd === "FINGER") {
    return { output: viewWhois(), phase, session, terminalTheme };
  }
  if (cmd === "LAST") {
    return {
      output: sectionFooter(viewLastCalls()),
      phase,
      session,
      terminalTheme,
    };
  }

  if (cmd === "THEME" || cmd === "T" || cmd === "GREEN" || cmd === "AMBER") {
    const nextTheme = resolveTheme(terminalTheme, cmd);
    return {
      output: themeAck(nextTheme),
      phase,
      session,
      terminalTheme: nextTheme,
      events: [{ event: "theme_set", theme: nextTheme }],
    };
  }

  if (isRipEnterCommand(cmd)) {
    const rip = ripEnterResult(Boolean(session), terminalTheme);
    return {
      output: rip.output,
      phase,
      session,
      terminalTheme,
      events: rip.events,
    };
  }
  if (cmd === "TEXT") {
    return {
      output: sectionFooter(
        [
          "",
          paint("Leaving RIP graphics — text screen active.", "brightGreen"),
        ].join("\r\n")
      ),
      phase,
      session,
      terminalTheme,
      events: [{ event: "rip_exit" }],
    };
  }

  if (cmd === "RIPT" || cmd === "TIMELINE") {
    const tl = ripTimelineResult(Boolean(session), terminalTheme);
    return {
      output: sectionFooter(tl.output),
      phase,
      session,
      terminalTheme,
      events: tl.events,
    };
  }

  if (cmd === "TRACERT") {
    return { output: sectionFooter(viewTracert()), phase, session, terminalTheme };
  }
  if (cmd === "NODES") {
    return { output: sectionFooter(viewNodes()), phase, session, terminalTheme };
  }
  if (cmd === "DL" || cmd === "DOWNLOAD") {
    return { output: viewDownloads(), phase, session, terminalTheme };
  }
  if (cmd === "PLAN") {
    return { output: sectionFooter(formatPlan()), phase, session, terminalTheme };
  }
  if (cmd === "USERS") {
    return { output: sectionFooter(viewUsers()), phase, session, terminalTheme };
  }
  if (cmd === "SCORE" || cmd === "BADGES") {
    return { output: viewScore(badges), phase, session, terminalTheme };
  }
  if (cmd === "SOUND") {
    return {
      output: sectionFooter(
        paint("SFX toggled via client — use SFX ON or SFX OFF.", "brightYellow")
      ),
      phase,
      session,
      terminalTheme,
      events: [{ event: "sfx_toggle" }],
    };
  }
  if (cmd === "SFX ON") {
    return {
      output: sectionFooter(paint("Keyboard / line-feed SFX enabled.", "brightGreen")),
      phase,
      session,
      terminalTheme,
      events: [{ event: "sfx_set", on: true }],
    };
  }
  if (cmd === "SFX OFF") {
    return {
      output: sectionFooter(paint("SFX muted (modem on login unchanged).", "brightBlack")),
      phase,
      session,
      terminalTheme,
      events: [{ event: "sfx_set", on: false }],
    };
  }

  const signMatch = /^SIGN\s+(.+)/i.exec(line);
  if (signMatch && session) {
    const signed = signGuestbook(signMatch[1], clientKey);
    if (!signed.ok) {
      const reason =
        signed.reason === "rate_limited"
          ? "Guestbook: slow down — try again in a minute."
          : signed.reason === "store_too_large"
            ? "Guestbook: log full (SysOp purging later)."
            : "Guestbook: empty or invalid message.";
      return {
        output: sectionFooter(paint(reason, "red")),
        phase,
        session,
        terminalTheme,
      };
    }
    return {
      output: sectionFooter(
        paint("Signed guestbook.", "brightGreen") +
          paint(` "${signed.entry.message}"`, "white")
      ),
      phase,
      session,
      terminalTheme,
    };
  }

  const askMatch = /^ASK\s+(.+)/i.exec(line) || /^CHAT\s+(.+)/i.exec(line);
  if (askMatch) {
    return {
      output: sectionFooter(formatChatAnswer(askMatch[1].trim())),
      phase,
      session,
      terminalTheme,
    };
  }
  if (cmd === "CHAT") {
    return {
      output: paint("Ask the SysOp (public facts): use CHAT <question>", "yellow") + "\r\n",
      phase,
      session,
      terminalTheme,
    };
  }

  return {
    output:
      paint("Unknown command. Type ? for help or M for menu.", "red") +
      "\r\n" +
      paint("Command: ", "green"),
    phase,
    session,
    terminalTheme,
  };
}

module.exports = {
  loginScreen,
  mainMenu,
  handleInput,
};