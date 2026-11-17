const fs = require("fs");
const path = require("path");
const {
  allowGuestbookWrite,
  withinStoreSize,
  MAX_GUESTBOOK_ENTRIES,
} = require("./persist-limits");

const DATA_FILE = path.join(__dirname, "..", "data", "guestbook.json");
const MAX_LEN = 120;

function readGuestbook() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.entries) ? parsed.entries : [];
  } catch {
    return [];
  }
}

/**
 * @param {{ at: string; message: string }[]} entries
 */
function writeGuestbook(entries) {
  const trimmed = entries.slice(-MAX_GUESTBOOK_ENTRIES);
  const dir = path.dirname(DATA_FILE);
  const json = JSON.stringify({ entries: trimmed }, null, 2);
  if (!withinStoreSize(json)) {
    return { ok: false, reason: "store_too_large" };
  }
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, json);
  return { ok: true };
}

/**
 * @param {string} text
 */
function sanitizeMessage(text) {
  const clean = String(text || "")
    .replace(/[\r\n]+/g, " ")
    .replace(/[^\x20-\x7E]/g, "")
    .trim()
    .slice(0, MAX_LEN);
  if (!clean) {
    return null;
  }
  return { at: new Date().toISOString(), message: clean };
}

/**
 * @param {string} text
 * @param {string} [clientKey]
 */
function signGuestbook(text, clientKey) {
  if (!allowGuestbookWrite(clientKey || "local")) {
    return { ok: false, reason: "rate_limited" };
  }
  const entry = sanitizeMessage(text);
  if (!entry) {
    return { ok: false, reason: "empty" };
  }
  const entries = readGuestbook();
  entries.push(entry);
  const wrote = writeGuestbook(entries);
  if (!wrote.ok) {
    return { ok: false, reason: wrote.reason || "write_failed" };
  }
  return { ok: true, entry };
}

module.exports = { readGuestbook, signGuestbook, MAX_LEN };