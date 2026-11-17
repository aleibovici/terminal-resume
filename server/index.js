const path = require("path");
const http = require("http");
const express = require("express");
const { WebSocketServer } = require("ws");
const { loginScreen, handleInput } = require("../lib/terminal");
const {
  generateAnsResume,
  generateSessionTranscript,
  generateVcf,
} = require("../lib/downloads");
const { refreshPlanCache } = require("../lib/plan");
const { newConnectionId } = require("../lib/persist-limits");

const PORT = Number(process.env.PORT) || 3847;
const HOST =
  process.env.HOST ||
  (process.env.PORT || process.env.CURSOR_APP || process.env.NODE_ENV === "production"
    ? "0.0.0.0"
    : "127.0.0.1");

const app = express();

app.use((_req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "connect-src 'self'",
      "img-src 'self'",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'self'",
    ].join("; ")
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, name: "terminal-resume", version: "0.3.0" });
});

app.get("/download/resume.ans", (_req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="andre-resume.ans"');
  res.send(generateAnsResume());
});

app.get("/download/session.txt", (_req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="modem-session.txt"');
  res.send(generateSessionTranscript());
});

app.get("/download/contact.vcf", (_req, res) => {
  res.setHeader("Content-Type", "text/vcard; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="andre-leibovici.vcf"');
  res.send(generateVcf());
});

const server = http.createServer(app);

/**
 * @param {import("http").IncomingMessage} req
 */
function clientKeyFromSocket(req) {
  const addr = req.socket.remoteAddress;
  return addr || "local";
}

/**
 * @param {string | undefined} origin
 * @param {import("http").IncomingMessage} req
 */
function isAllowedWsOrigin(origin, req) {
  if (!origin) {
    return true;
  }
  try {
    const o = new URL(origin);
    const hostHeader = (req.headers.host || "").toLowerCase();
    const originHost = o.hostname.toLowerCase();
    const reqHost = hostHeader.split(":")[0];
    if (hostHeader && (o.host.toLowerCase() === hostHeader || originHost === reqHost)) {
      return true;
    }
    const devHosts = new Set(["127.0.0.1", "localhost", "[::1]"]);
    return devHosts.has(originHost) && devHosts.has(reqHost);
  } catch {
    return false;
  }
}

/** @type {Map<string, string | null>} */
const connectionLastVisit = new Map();

/** @type {Set<string>} */
const connectionsSeenLogin = new Set();

/** @type {Map<WebSocket, {
 *   phase: string;
 *   session: object | null;
 *   pendingUsername?: string;
 *   terminalTheme?: string;
 *   doorState?: object;
 *   badges: string[];
 *   clientKey: string;
 *   connectionId: string;
 * }>} */
const wsState = new Map();

const wss = new WebSocketServer({
  server,
  path: "/ws",
  verifyClient: (info, cb) => {
    if (!isAllowedWsOrigin(info.origin, info.req)) {
      cb(false, 403, "Forbidden origin");
      return;
    }
    cb(true);
  },
});

/**
 * @param {unknown} raw
 * @returns {{ input: string } | null}
 */
function parseTerminalPayload(raw) {
  let parsed;
  try {
    parsed = JSON.parse(String(raw));
  } catch {
    return null;
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }
  const input = /** @type {{ input?: unknown }} */ (parsed).input;
  if (input === undefined || input === null) {
    return { input: "" };
  }
  if (typeof input !== "string") {
    return null;
  }
  if (input.length > 4096) {
    return { input: input.slice(0, 4096) };
  }
  return { input };
}

function sendInvalid(ws) {
  ws.send("\r\n" + "\x1b[91mInvalid message.\x1b[0m\r\n");
}

wss.on("connection", (ws, req) => {
  const clientKey = clientKeyFromSocket(req);
  const connectionId = newConnectionId();
  wsState.set(ws, {
    phase: "login_username",
    session: null,
    terminalTheme: "green",
    badges: [],
    clientKey,
    connectionId,
  });
  ws.send(loginScreen());

  ws.on("message", (raw) => {
    try {
      const payload = parseTerminalPayload(raw);
      if (!payload) {
        sendInvalid(ws);
        return;
      }

      const state = wsState.get(ws);
      if (!state) {
        return;
      }

      const priorConnectionVisit = connectionLastVisit.get(state.connectionId) ?? null;
      const firstLoginOnConnection = !connectionsSeenLogin.has(state.connectionId);

      const result = handleInput({
        phase: state.phase,
        session: state.session,
        pendingUsername: state.pendingUsername,
        terminalTheme: state.terminalTheme,
        doorState: state.doorState,
        badges: state.badges,
        clientKey: state.clientKey,
        connectionLastAt: priorConnectionVisit,
        firstLoginOnConnection,
        input: payload.input,
      });

      if (state.phase === "login_password" && result.phase === "menu") {
        connectionsSeenLogin.add(state.connectionId);
        const loginAt = result.connectionLoginAt;
        if (loginAt) {
          connectionLastVisit.set(state.connectionId, loginAt);
        }
      }

      const nextBadges = [...(state.badges || [])];
      if (result.events) {
        for (const event of result.events) {
          if (event && event.event === "badge_unlock" && event.badge) {
            if (!nextBadges.includes(event.badge)) {
              nextBadges.push(event.badge);
            }
          }
        }
      }

      wsState.set(ws, {
        phase: result.phase,
        session: result.session,
        pendingUsername: result.pendingUsername,
        terminalTheme: result.terminalTheme ?? state.terminalTheme ?? "green",
        doorState: result.doorState ?? null,
        badges: nextBadges,
        clientKey: state.clientKey,
        connectionId: state.connectionId,
      });

      if (result.events) {
        for (const event of result.events) {
          if (typeof event === "string") {
            ws.send(JSON.stringify({ control: true, event }));
          } else {
            ws.send(JSON.stringify({ control: true, ...event }));
          }
        }
      }

      if (result.output) {
        ws.send(result.output);
      }
    } catch (err) {
      console.error("ws message error", err);
      sendInvalid(ws);
    }
  });

  ws.on("close", () => {
    const state = wsState.get(ws);
    if (state) {
      connectionLastVisit.delete(state.connectionId);
      connectionsSeenLogin.delete(state.connectionId);
    }
    wsState.delete(ws);
  });
});

process.on("uncaughtException", (err) => {
  console.error("uncaughtException", err);
});

process.on("unhandledRejection", (err) => {
  console.error("unhandledRejection", err);
});

refreshPlanCache().catch(() => {});

function startServer() {
  server.listen(PORT, HOST, () => {
    console.log(`Terminal résumé listening at http://${HOST}:${PORT}`);
  });
  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = { app, server, wss, startServer };