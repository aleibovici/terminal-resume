const fs = require("fs");
const path = require("path");
const {
  allowLastcallWrite,
  withinStoreSize,
  MAX_LASTCALL_VISITS,
} = require("./persist-limits");

const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "last-calls.json");

/**
 * @typedef {{ at: string }} VisitStamp
 * @typedef {{
 *   lastGlobal: VisitStamp | null;
 *   totalLogins: number;
 *   uniqueCallers: number;
 *   recentVisits: VisitStamp[];
 * }} CallStore
 */

function defaultStore() {
  return {
    lastGlobal: null,
    totalLogins: 0,
    uniqueCallers: 0,
    recentVisits: [],
  };
}

/**
 * @param {unknown} parsed
 * @returns {CallStore}
 */
function normalizeLegacy(parsed) {
  const store = defaultStore();
  if (!parsed || typeof parsed !== "object") {
    return store;
  }
  const p = /** @type {Record<string, unknown>} */ (parsed);
  if (p.lastGlobal && typeof p.lastGlobal === "object") {
    const lg = /** @type {{ at?: string }} */ (p.lastGlobal);
    if (lg.at) {
      store.lastGlobal = { at: String(lg.at) };
    }
  }
  store.totalLogins = Number(p.totalLogins) || 0;
  store.uniqueCallers = Number(p.uniqueCallers) || 0;
  if (Array.isArray(p.recentVisits)) {
    store.recentVisits = p.recentVisits
      .filter((v) => v && typeof v === "object" && "at" in v)
      .map((v) => ({ at: String(/** @type {{ at: string }} */ (v).at) }))
      .slice(0, MAX_LASTCALL_VISITS);
  } else if (p.visitors && typeof p.visitors === "object") {
    const legacy = Object.values(
      /** @type {Record<string, { at?: string }>} */ (p.visitors)
    )
      .filter((row) => row && row.at)
      .sort((a, b) => String(b.at).localeCompare(String(a.at)))
      .slice(0, MAX_LASTCALL_VISITS);
    store.recentVisits = legacy.map((row) => ({ at: String(row.at) }));
    store.uniqueCallers = Math.max(store.uniqueCallers, legacy.length);
  }
  if (!store.totalLogins && store.recentVisits.length) {
    store.totalLogins = store.recentVisits.length;
  }
  return store;
}

/**
 * @returns {CallStore}
 */
function readStore() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return normalizeLegacy(parsed);
  } catch {
    return defaultStore();
  }
}

/**
 * @param {CallStore} store
 * @returns {{ ok: boolean; reason?: string }}
 */
function writeStore(store) {
  const trimmed = {
    lastGlobal: store.lastGlobal,
    totalLogins: store.totalLogins || 0,
    uniqueCallers: store.uniqueCallers || 0,
    recentVisits: (store.recentVisits || []).slice(0, MAX_LASTCALL_VISITS),
  };
  const json = JSON.stringify(trimmed, null, 2);
  if (!withinStoreSize(json)) {
    return { ok: false, reason: "store_too_large" };
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, json);
  return { ok: true };
}

/**
 * @param {VisitStamp | null} stamp
 */
function formatVisitTime(stamp) {
  if (!stamp || !stamp.at) {
    return "never";
  }
  const when = new Date(stamp.at);
  const stampText = Number.isNaN(when.getTime())
    ? stamp.at
    : when.toUTCString().replace(" GMT", " UTC");
  return stampText;
}

/**
 * @param {VisitStamp | null} stamp
 */
function formatLastCaller(stamp) {
  if (!stamp) {
    return "no prior callers";
  }
  return `another caller @ ${formatVisitTime(stamp)}`;
}

/**
 * @param {string} clientKey
 * @param {boolean} [countAsNewCaller]
 * @returns {{
 *   ok: boolean;
 *   previousGlobalAt: string | null;
 *   at: string;
 * }}
 */
function recordLogin(clientKey, countAsNewCaller) {
  if (!allowLastcallWrite(clientKey || "local")) {
    return { ok: false, previousGlobalAt: null, at: new Date().toISOString() };
  }

  const store = readStore();
  const previousGlobalAt = store.lastGlobal?.at || null;
  const at = new Date().toISOString();

  store.lastGlobal = { at };
  store.totalLogins = (store.totalLogins || 0) + 1;
  if (countAsNewCaller) {
    store.uniqueCallers = (store.uniqueCallers || 0) + 1;
  }
  store.recentVisits = [{ at }, ...(store.recentVisits || [])].slice(
    0,
    MAX_LASTCALL_VISITS
  );

  const wrote = writeStore(store);
  if (!wrote.ok) {
    return { ok: false, previousGlobalAt, at };
  }

  return { ok: true, previousGlobalAt, at };
}

/**
 * @param {CallStore} [store]
 */
function viewLastCalls(store = readStore()) {
  const lines = [
    "",
    "── LAST / CALLER LOG ───────────────────────────────────────────",
    "",
    " Node last activity: " + formatLastCaller(store.lastGlobal),
    "",
    ` Aggregate: ${store.totalLogins || 0} logins · ${
      store.uniqueCallers || 0
    } distinct connections (counter only)`,
    "",
    " Recent visit times (aggregate log; no names on disk):",
  ];

  const entries = (store.recentVisits || []).slice(0, 12);
  if (!entries.length) {
    lines.push("  (none yet)");
  } else {
    for (const row of entries) {
      lines.push("  • " + formatVisitTime(row));
    }
    if ((store.recentVisits || []).length > entries.length) {
      lines.push(
        `  … ${store.recentVisits.length - entries.length} more timestamps in store`
      );
    }
  }

  return lines.join("\r\n");
}

module.exports = {
  readStore,
  recordLogin,
  formatLastCaller,
  formatVisitTime,
  viewLastCalls,
};