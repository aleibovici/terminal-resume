(function () {
  const statusEl = document.getElementById("status-text");
  const ledEl = document.querySelector(".led");
  const hostEl = document.getElementById("terminal");

  function failStatus(message) {
    if (statusEl) {
      statusEl.textContent = message;
    }
    if (hostEl) {
      hostEl.textContent = message;
    }
  }

  if (typeof Terminal === "undefined") {
    failStatus("LOAD ERROR — xterm missing");
    return;
  }

  const FitCtor =
    (typeof FitAddon !== "undefined" &&
      (FitAddon.FitAddon || FitAddon)) ||
    null;
  if (!FitCtor) {
    failStatus("LOAD ERROR — fit addon missing");
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const rawBaud = Number(params.get("baud")) || window.DEFAULT_TERMINAL_BAUD || 2400;
  const baudSetting =
    typeof applyBaudEra === "function" ? applyBaudEra(rawBaud) : rawBaud;
  const SCROLLBACK_LINES = 8000;

  const term = new Terminal({
    cols: 80,
    rows: 24,
    scrollback: SCROLLBACK_LINES,
    convertEol: true,
    cursorBlink: true,
    fontFamily: '"IBM Plex Mono", Consolas, "Courier New", monospace',
    fontSize: 15,
    lineHeight: 1.15,
    theme: { ...TERMINAL_THEMES.green.xterm },
  });

  const fitAddon = new FitCtor();
  term.loadAddon(fitAddon);
  term.open(document.getElementById("terminal"));
  fitAddon.fit();
  applyTerminalTheme(term, "green");

  window.addEventListener("resize", () => fitAddon.fit());

  const throttle = createBaudThrottle((chunk) => term.write(chunk), baudSetting);

  let buffer = "";
  let ws;
  let currentTheme = "green";
  let loggedIn = false;

  function notifyBadge(msg) {
    throttle.write(msg);
  }

  function setStatus(text, online) {
    statusEl.textContent = text;
    ledEl.classList.toggle("online", Boolean(online));
  }

  function sendHostLine(host) {
    if ((host === "V" || host === "1") && !loggedIn) {
      throttle.write(
        "\r\n\x1b[93m[graphics]\x1b[0m Log in first (username + password), then View Résumé.\r\n"
      );
      return;
    }
    sendLine(host);
  }

  /**
   * @param {{ rip: object; theme?: string }} msg
   */
  function enterRip(msg) {
    if (!window.RipScreen) {
      return;
    }
    RipScreen.show({
      rip: msg.rip,
      theme: msg.theme || currentTheme,
      sendHost: sendHostLine,
      onExit: () => setStatus("CARRIER DETECTED — ONLINE", true),
    });
    setStatus("RIP GRAPHICS — 640×350", true);
  }

  /**
   * @param {{ rip: object; timeline: object[]; theme?: string }} msg
   */
  function enterRipTimeline(msg) {
    if (!window.RipScreen) {
      return;
    }
    RipScreen.showTimeline({
      rip: msg.rip,
      timeline: msg.timeline,
      theme: msg.theme || currentTheme,
      sendHost: sendHostLine,
    });
    setStatus("RIP TIMELINE — RIPT", true);
  }

  /**
   * @param {string} data
   */
  function handleServerPayload(data) {
    if (data.startsWith("{")) {
      try {
        const msg = JSON.parse(data);
        if (msg && msg.control === true) {
          if (msg.event === "login_ok" && typeof playModemHandshake === "function") {
            playModemHandshake();
          }
          if (msg.event === "login_ok") {
            throttle.setEnabled(true);
            loggedIn = true;
          }
          if (msg.event === "logout") {
            throttle.setEnabled(false);
            loggedIn = false;
            if (window.RipScreen) {
              RipScreen.hide();
            }
          }
          if (msg.event === "theme_set" && msg.theme) {
            currentTheme = msg.theme;
            applyTerminalTheme(term, msg.theme);
            if (window.RipScreen) {
              RipScreen.setTheme(msg.theme);
            }
          }
          if (msg.event === "rip_enter" && msg.rip) {
            enterRip(msg);
          }
          if (msg.event === "rip_timeline" && msg.rip) {
            enterRipTimeline(msg);
          }
          if (msg.event === "rip_exit" && window.RipScreen) {
            RipScreen.hide();
            setStatus("CARRIER DETECTED — ONLINE", true);
          }
          if (msg.event === "badge_unlock" && msg.badge && window.BadgeCollector) {
            BadgeCollector.unlock(msg.badge, notifyBadge);
          }
          if (msg.event === "sfx_set" && window.TerminalSfx) {
            TerminalSfx.setEnabled(Boolean(msg.on));
          }
          if (msg.event === "sfx_toggle" && window.TerminalSfx) {
            TerminalSfx.setEnabled(!TerminalSfx.isEnabled());
          }
          return;
        }
      } catch {
        /* fall through — treat as terminal text */
      }
    }
    throttle.write(data);
  }

  function connect() {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    ws = new WebSocket(`${proto}//${window.location.host}/ws`);

    ws.addEventListener("open", () => {
      setStatus("DIALING…", false);
    });

    ws.addEventListener("message", (ev) => {
      handleServerPayload(String(ev.data));
      if (statusEl.textContent === "DIALING…") {
        setStatus("CARRIER DETECTED — ONLINE", true);
      }
    });

    ws.addEventListener("close", () => {
      throttle.setEnabled(false);
      loggedIn = false;
      if (window.RipScreen) {
        RipScreen.hide();
      }
      setStatus("NO CARRIER — RECONNECTING…", false);
      setTimeout(connect, 2000);
    });

    ws.addEventListener("error", () => {
      setStatus("LINE ERROR", false);
    });
  }

  function sendLine(line) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ input: line }));
    }
  }

  term.onData((data) => {
    for (const ch of data) {
      if (ch === "\r") {
        term.write("\r\n");
        if (window.TerminalSfx) {
          TerminalSfx.lineFeed();
        }
        sendLine(buffer);
        buffer = "";
      } else if (ch === "\u007F" || ch === "\b") {
        if (buffer.length > 0) {
          buffer = buffer.slice(0, -1);
          term.write("\b \b");
        }
      } else if (ch >= " " && ch <= "~") {
        buffer += ch;
        term.write(ch);
        if (window.TerminalSfx) {
          TerminalSfx.keyTick();
        }
      }
    }
  });

  connect();
})();