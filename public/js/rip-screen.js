/**
 * RIPscrip-inspired vector graphics pane (640×350 EGA feel) — not a full RIP parser.
 */
(function (global) {
  const VIEW_W = 640;
  const VIEW_H = 350;

  /** @type {HTMLCanvasElement | null} */
  let canvas = null;
  /** @type {CanvasRenderingContext2D | null} */
  let ctx = null;
  /** @type {HTMLElement | null} */
  let pane = null;
  /** @type {HTMLElement | null} */
  let split = null;

  /** @typedef {{ id: string; label: string; host: string; x: number; y: number; w: number; h: number }} RipButton */

  /** @type {RipButton[]} */
  let buttons = [];
  /** @type {(host: string) => void} */
  let onHost = () => {};
  /** @type {() => void} */
  let onExit = () => {};

  let theme = "green";
  let animProgress = 1;
  let animStart = 0;
  /** @type {{ name: string; title: string; location: string; blog: string } | null} */
  let payload = null;
  /** @type {{ year: string; label: string; cmd: string; x: number; y: number; w: number; h: number }[]} */
  let timeline = [];
  let mode = "splash";

  /**
   * @param {string} phosphor
   */
  function palette(phosphor) {
    if (phosphor === "amber") {
      return {
        bg: "#0a0804",
        fg: "#ffc966",
        dim: "#a88444",
        accent: "#ffe08a",
        line: "#d4a030",
        button: "#2a2010",
        buttonHi: "#4a3820",
      };
    }
    return {
      bg: "#050608",
      fg: "#b8f0c8",
      dim: "#6a9a7a",
      accent: "#7cfc98",
      line: "#4ac878",
      button: "#0f1a14",
      buttonHi: "#2a4034",
    };
  }

  function ensureDom() {
    if (canvas) {
      return;
    }
    pane = document.getElementById("rip-pane");
    split = document.getElementById("terminal-split");
    canvas = document.getElementById("rip-canvas");
    if (!pane || !split || !canvas) {
      return;
    }
    ctx = canvas.getContext("2d");
    canvas.addEventListener("click", onCanvasClick);
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
  }

  function resizeCanvas() {
    if (!canvas || !pane) {
      return;
    }
    const scale = Math.min(pane.clientWidth / VIEW_W, 220 / VIEW_H);
    canvas.style.width = `${VIEW_W * scale}px`;
    canvas.style.height = `${VIEW_H * scale}px`;
  }

  /**
   * @param {MouseEvent} ev
   */
  function onCanvasClick(ev) {
    if (!canvas || animProgress < 1) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const sx = VIEW_W / rect.width;
    const sy = VIEW_H / rect.height;
    const x = (ev.clientX - rect.left) * sx;
    const y = (ev.clientY - rect.top) * sy;

    if (mode === "timeline") {
      for (const zone of timeline) {
        if (x >= zone.x && x <= zone.x + zone.w && y >= zone.y && y <= zone.y + zone.h) {
          hide();
          onHost(zone.cmd);
          return;
        }
      }
      return;
    }

    for (const btn of buttons) {
      if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        if (btn.id === "exit") {
          hide();
          onExit();
          if (btn.host) {
            onHost(btn.host);
          }
        } else {
          hide();
          onHost(btn.host);
        }
        return;
      }
    }
  }

  function buildButtons() {
    buttons = [
      { id: "resume", label: "View Résumé", host: "V", x: 48, y: 268, w: 168, h: 36 },
      { id: "whois", label: "WHOIS", host: "WHOIS", x: 236, y: 268, w: 168, h: 36 },
      { id: "exit", label: "Exit graphics", host: "TEXT", x: 424, y: 268, w: 168, h: 36 },
    ];
  }

  /**
   * @param {number} p 0..1
   */
  function drawTimelineFrame() {
    if (!ctx || !payload) {
      return;
    }
    const pal = palette(theme);
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.strokeStyle = pal.line;
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, VIEW_W - 24, VIEW_H - 24);
    ctx.fillStyle = pal.accent;
    ctx.font = 'bold 18px "IBM Plex Mono", Consolas, monospace';
    ctx.fillText("CAREER TIMELINE — RIPT", 28, 40);
    ctx.fillStyle = pal.dim;
    ctx.font = '12px "IBM Plex Mono", Consolas, monospace';
    ctx.fillText("Click a year to jump (host !|U)", 28, 58);

    for (const zone of timeline) {
      ctx.fillStyle = pal.buttonHi;
      ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
      ctx.strokeStyle = pal.line;
      ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
      ctx.fillStyle = pal.fg;
      ctx.font = 'bold 14px "IBM Plex Mono", Consolas, monospace';
      ctx.fillText(zone.year, zone.x + 8, zone.y + 20);
      ctx.fillStyle = pal.dim;
      ctx.font = '11px "IBM Plex Mono", Consolas, monospace';
      ctx.fillText(zone.label, zone.x + 8, zone.y + 36);
    }
    ctx.fillStyle = pal.dim;
    ctx.font = '11px "IBM Plex Mono", Consolas, monospace';
    ctx.fillText("!|U jump · TEXT exits", 28, VIEW_H - 18);
  }

  function drawFrame(p) {
    if (!ctx || !payload) {
      return;
    }
    if (mode === "timeline") {
      drawTimelineFrame();
      return;
    }
    const pal = palette(theme);
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    ctx.strokeStyle = pal.line;
    ctx.lineWidth = 2;
    if (p > 0.05) {
      strokeRectAnim(12, 12, VIEW_W - 24, VIEW_H - 24, p, 0.05, 0.35);
    }
    if (p > 0.15) {
      strokeRectAnim(28, 40, VIEW_W - 56, 200, p, 0.15, 0.45);
    }
    if (p > 0.4) {
      ctx.beginPath();
      ctx.moveTo(48, 100);
      ctx.lineTo(48 + 544 * Math.min(1, (p - 0.4) / 0.25), 100);
      ctx.stroke();
    }

    if (p > 0.55) {
      ctx.fillStyle = pal.accent;
      ctx.font = 'bold 22px "IBM Plex Mono", Consolas, monospace';
      ctx.fillText("ANDRE LEIBOVICI", 52, 78);
    }

    if (p > 0.65) {
      ctx.fillStyle = pal.fg;
      ctx.font = '14px "IBM Plex Mono", Consolas, monospace';
      ctx.fillText("Role:", 52, 128);
      ctx.fillStyle = pal.dim;
      wrapLine(payload.title, 110, 128, 500, pal.dim);
    }
    if (p > 0.72) {
      ctx.fillStyle = pal.fg;
      ctx.fillText("Location:", 52, 152);
      ctx.fillStyle = pal.dim;
      wrapLine(payload.location, 110, 152, 500, pal.dim);
    }
    if (p > 0.78) {
      ctx.fillStyle = pal.fg;
      ctx.fillText("Blog:", 52, 176);
      ctx.fillStyle = pal.accent;
      wrapLine(payload.blog, 110, 176, 500, pal.accent);
    }

    if (p > 0.85) {
      for (const btn of buttons) {
        const palBtn = palette(theme);
        ctx.fillStyle = palBtn.buttonHi;
        ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
        ctx.strokeStyle = palBtn.line;
        ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
        ctx.fillStyle = palBtn.fg;
        ctx.font = '13px "IBM Plex Mono", Consolas, monospace';
        const tw = ctx.measureText(btn.label).width;
        ctx.fillText(btn.label, btn.x + (btn.w - tw) / 2, btn.y + 23);
        ctx.fillStyle = palBtn.dim;
        ctx.font = '10px "IBM Plex Mono", Consolas, monospace';
        ctx.fillText(`!|U${btn.host}`, btn.x + 6, btn.y + btn.h - 6);
      }
    }

    ctx.fillStyle = pal.dim;
    ctx.font = '11px "IBM Plex Mono", Consolas, monospace';
    ctx.fillText("RIPscrip 1.54 emulation — dual-screen graphics", 28, VIEW_H - 18);
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   * @param {number} p
   * @param {number} t0
   * @param {number} t1
   */
  function strokeRectAnim(x, y, w, h, p, t0, t1) {
    if (!ctx) {
      return;
    }
    const local = Math.min(1, Math.max(0, (p - t0) / (t1 - t0)));
    const partialW = w * local;
    const partialH = h * local;
    ctx.strokeRect(x, y, partialW, partialH);
    if (local > 0.5) {
      ctx.strokeRect(x + 6, y + 6, Math.max(0, partialW - 12), Math.max(0, partialH - 12));
    }
  }

  /**
   * @param {string} text
   * @param {number} x
   * @param {number} y
   * @param {number} maxW
   * @param {string} color
   */
  function wrapLine(text, x, y, maxW, color) {
    if (!ctx) {
      return;
    }
    ctx.fillStyle = color;
    const clipped = text.length > 62 ? `${text.slice(0, 59)}...` : text;
    ctx.fillText(clipped, x, y);
  }

  function tickAnim(ts) {
    if (!animStart) {
      animStart = ts;
    }
    animProgress = Math.min(1, (ts - animStart) / 1000);
    drawFrame(animProgress);
    if (animProgress < 1) {
      requestAnimationFrame(tickAnim);
    }
  }

  /**
   * @param {{
   *   rip: { name: string; title: string; location: string; blog: string };
   *   theme?: string;
   *   sendHost: (cmd: string) => void;
   *   onExit?: () => void;
   * }} opts
   */
  function show(opts) {
    ensureDom();
    if (!canvas || !pane || !split) {
      return;
    }
    payload = opts.rip;
    theme = opts.theme || "green";
    onHost = opts.sendHost;
    onExit = opts.onExit || (() => {});
    mode = "splash";
    timeline = [];
    buildButtons();
    split.classList.add("rip-active");
    pane.classList.remove("hidden");
    pane.setAttribute("aria-hidden", "false");
    animStart = 0;
    animProgress = 0;
    requestAnimationFrame(tickAnim);
  }

  function hide() {
    if (!pane || !split) {
      return;
    }
    split.classList.remove("rip-active");
    pane.classList.add("hidden");
    pane.setAttribute("aria-hidden", "true");
    animProgress = 1;
  }

  /**
   * @param {string} next
   */
  function setTheme(next) {
    theme = next;
    if (payload && split && split.classList.contains("rip-active")) {
      drawFrame(1);
    }
  }

  /**
   * @param {{
   *   rip: object;
   *   timeline: object[];
   *   theme?: string;
   *   sendHost: (cmd: string) => void;
   * }} opts
   */
  function showTimeline(opts) {
    ensureDom();
    if (!canvas || !pane || !split) {
      return;
    }
    payload = opts.rip;
    timeline = opts.timeline || [];
    theme = opts.theme || "green";
    onHost = opts.sendHost;
    mode = "timeline";
    buttons = [];
    split.classList.add("rip-active");
    pane.classList.remove("hidden");
    pane.setAttribute("aria-hidden", "false");
    animProgress = 1;
    drawTimelineFrame();
  }

  global.RipScreen = {
    show,
    showTimeline,
    hide,
    setTheme,
    isVisible() {
      return Boolean(split && split.classList.contains("rip-active"));
    },
  };
})(typeof window !== "undefined" ? window : globalThis);