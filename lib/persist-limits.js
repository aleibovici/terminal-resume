const crypto = require("crypto");

const MAX_USERNAME_LEN = 32;
const MAX_GUESTBOOK_ENTRIES = 200;
const MAX_LASTCALL_VISITS = 48;
const MAX_STORE_BYTES = 64 * 1024;
const RATE_WINDOW_MS = 60_000;
const MAX_LASTCALL_WRITES_PER_WINDOW = 30;
const MAX_GUESTBOOK_WRITES_PER_WINDOW = 8;
const MAX_RATE_BUCKETS = 4096;

/** @type {Map<string, { lastcall: number[]; guestbook: number[]; touched: number }>} */
const buckets = new Map();

/**
 * @param {string} raw
 */
function sanitizeUsername(raw) {
  const trimmed = String(raw || "")
    .replace(/[\r\n\x00-\x1f\x7f]/g, "")
    .trim();
  if (!trimmed) {
    return "visitor";
  }
  return trimmed.slice(0, MAX_USERNAME_LEN);
}

/**
 * @param {import("crypto").RandomUUIDOptions | undefined} [_]
 */
function newConnectionId() {
  return crypto.randomUUID();
}

function pruneRateBuckets() {
  if (buckets.size <= MAX_RATE_BUCKETS) {
    return;
  }
  const now = Date.now();
  for (const [key, row] of buckets) {
    const lastcall = row.lastcall.filter((t) => now - t < RATE_WINDOW_MS);
    const guestbook = row.guestbook.filter((t) => now - t < RATE_WINDOW_MS);
    if (!lastcall.length && !guestbook.length) {
      buckets.delete(key);
    } else {
      row.lastcall = lastcall;
      row.guestbook = guestbook;
      buckets.set(key, row);
    }
  }
  if (buckets.size <= MAX_RATE_BUCKETS) {
    return;
  }
  const sorted = [...buckets.entries()].sort((a, b) => a[1].touched - b[1].touched);
  const drop = sorted.length - MAX_RATE_BUCKETS;
  for (let i = 0; i < drop; i += 1) {
    buckets.delete(sorted[i][0]);
  }
}

/**
 * @param {string} key
 * @param {"lastcall" | "guestbook"} kind
 * @param {number} limit
 */
function allowRate(key, kind, limit) {
  const id = key || "local";
  let row = buckets.get(id);
  if (!row) {
    row = { lastcall: [], guestbook: [], touched: Date.now() };
    buckets.set(id, row);
  }
  row.touched = Date.now();
  const now = Date.now();
  const list = row[kind].filter((t) => now - t < RATE_WINDOW_MS);
  if (list.length >= limit) {
    pruneRateBuckets();
    return false;
  }
  list.push(now);
  row[kind] = list;
  buckets.set(id, row);
  pruneRateBuckets();
  return true;
}

/**
 * @param {string} clientKey
 */
function allowLastcallWrite(clientKey) {
  return allowRate(clientKey, "lastcall", MAX_LASTCALL_WRITES_PER_WINDOW);
}

/**
 * @param {string} clientKey
 */
function allowGuestbookWrite(clientKey) {
  return allowRate(clientKey, "guestbook", MAX_GUESTBOOK_WRITES_PER_WINDOW);
}

/**
 * @param {string} json
 */
function withinStoreSize(json) {
  return Buffer.byteLength(json, "utf8") <= MAX_STORE_BYTES;
}

module.exports = {
  MAX_USERNAME_LEN,
  MAX_GUESTBOOK_ENTRIES,
  MAX_LASTCALL_VISITS,
  sanitizeUsername,
  newConnectionId,
  allowLastcallWrite,
  allowGuestbookWrite,
  withinStoreSize,
};