const { paint } = require("./ansi");
const { RESUME } = require("./resume");
const { badgeEvent } = require("./badges");

/**
 * @typedef {{ step: string; startMs: number }} DoorState
 */

const LOOT_SKILL =
  RESUME.skills[0]?.items?.[0] || "VDI / EUC";
const LOOT_BLOG =
  RESUME.contact.rows.find((r) => r.label === "Blog")?.value ||
  "https://myvirtualcloud.net";

function doorHeader() {
  return [
    "",
    paint("── Door: Fibre Channel Catacombs ────────────────────────────────", "magenta"),
    "",
    paint("Telnet door · ~2 min · choices 1-3 · M aborts to menu", "brightBlack"),
    "",
  ].join("\r\n");
}

/**
 * @param {DoorState | null} state
 */
function startDoor(state) {
  const now = Date.now();
  return {
    output:
      doorHeader() +
      [
        paint("You boot a 5.25\" door disk. Fans spin up.", "white"),
        paint("A corridor of blinking ST-506 drives blocks the path.", "brightBlack"),
        "",
        paint("[1] Follow the ECC beeps", "yellow"),
        paint("[2] Pry open a stale RAID drawer", "yellow"),
        paint("[3] Ping the sysop pager", "yellow"),
        "",
        paint("Choice:", "green"),
      ].join("\r\n"),
    phase: "door_adventure",
    doorState: { step: "entry", startMs: now },
    events: [],
  };
}

/**
 * @param {DoorState} state
 * @param {string} input
 */
function handleDoorInput(state, input) {
  const cmd = String(input || "").trim().toUpperCase();
  const elapsed = Date.now() - state.startMs;

  if (cmd === "M") {
    return {
      output: paint("You ESC to the BBS menu.", "brightBlack"),
      phase: "menu",
      doorState: null,
      events: [],
    };
  }

  if (state.step === "entry") {
    if (cmd === "1" || cmd === "2" || cmd === "3") {
      return {
        output: [
          "",
          paint("Static clears. A VT220 prompt whispers:", "cyan"),
          paint('login as: "caps-lock-goblin"', "brightRed"),
          "",
          paint("The goblin demands a sacrifice:", "white"),
          paint("[1] Offer a trashed MFM cable", "yellow"),
          paint("[2] Quote Packt View 5 chapter titles", "yellow"),
          paint("[3] Sing dial-tone at 2100 Hz", "yellow"),
          "",
          paint("Choice:", "green"),
        ].join("\r\n"),
        phase: "door_adventure",
        doorState: { step: "goblin", startMs: state.startMs },
        events: [],
      };
    }
    return invalidChoice(state);
  }

  if (state.step === "goblin") {
    if (cmd === "1" || cmd === "2" || cmd === "3") {
      return {
        output: [
          "",
          paint("The goblin melts into a pool of thermal paste.", "brightGreen"),
          paint("Beyond: a datacenter chapel humming at 50 Hz.", "white"),
          "",
          paint("[1] Read the stained-glass block diagram", "yellow"),
          paint("[2] Pull a hot-swappable skill module", "yellow"),
          paint("[3] JACK OUT", "yellow"),
          "",
          paint("Choice:", "green"),
        ].join("\r\n"),
        phase: "door_adventure",
        doorState: { step: "chapel", startMs: state.startMs },
        events: [],
      };
    }
    return invalidChoice(state);
  }

  if (state.step === "chapel") {
    if (cmd === "1") {
      return {
        output: [
          "",
          paint("Diagram: Auckland → VMware → Kubernetes → GPU councils.", "brightCyan"),
          paint("(Career as infrastructure — see TRACERT.)", "brightBlack"),
          "",
          paint("[1] Pull skill module", "yellow"),
          paint("[2] JACK OUT", "yellow"),
          "",
          paint("Choice:", "green"),
        ].join("\r\n"),
        phase: "door_adventure",
        doorState: { step: "chapel2", startMs: state.startMs },
        events: [],
      };
    }
    if (cmd === "2" || cmd === "3") {
      return finishDoor(elapsed, cmd === "3");
    }
    return invalidChoice(state);
  }

  if (state.step === "chapel2") {
    if (cmd === "1" || cmd === "2") {
      return finishDoor(elapsed, cmd === "2");
    }
    return invalidChoice(state);
  }

  return finishDoor(elapsed, true);
}

/**
 * @param {number} elapsed
 * @param {boolean} early
 */
function finishDoor(elapsed, early) {
  const secs = Math.round(elapsed / 1000);
  const lootLine = paint(`Loot: ${LOOT_SKILL}`, "brightYellow");
  const blogLine = paint(`Field manual: ${LOOT_BLOG}`, "brightCyan");
  return {
    output: [
      "",
      paint(early ? "You rip the cord and tumble into daylight." : "Quest complete.", "white"),
      paint(`Time on door: ~${secs}s`, "brightBlack"),
      "",
      paint("── REAL LOOT (from résumé) ─────────────────────────────────────", "green"),
      lootLine,
      blogLine,
      "",
      paint("Badge: Door Runner unlocked.", "brightMagenta"),
      "",
      paint("M = main menu", "brightBlack"),
    ].join("\r\n"),
    phase: "menu",
    doorState: null,
    events: [badgeEvent("door")],
  };
}

/**
 * @param {DoorState} state
 */
function invalidChoice(state) {
  return {
    output: paint("Pick 1, 2, or 3 (M = menu).", "red") + "\r\n" + paint("Choice:", "green"),
    phase: "door_adventure",
    doorState: state,
    events: [],
  };
}

module.exports = { startDoor, handleDoorInput };