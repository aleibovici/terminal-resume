const fs = require("fs");
const path = require("path");

const CACHE_FILE = path.join(__dirname, "..", "data", "plan-cache.json");
const FEED_URL = "https://myvirtualcloud.net/feed/";
const ROTATE_SEC = 45;

const FALLBACK_QUOTES = [
  "VDI roots, Kubernetes present — myvirtualcloud.net since 2009.",
  "GPU quotas, council AI, and other things that break if you guess.",
  "Field notes beat hype — open the blog for primary source.",
];

/**
 * @returns {{ quotes: { title: string; link: string }[]; fetchedAt: string | null }}
 */
function readPlanCache() {
  try {
    const raw = fs.readFileSync(CACHE_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return { quotes: [], fetchedAt: null };
  }
}

function writePlanCache(data) {
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
}

async function refreshPlanCache() {
  try {
    const res = await fetch(FEED_URL, { headers: { "User-Agent": "terminal-resume/0.2" } });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const xml = await res.text();
    const quotes = parseRssTitles(xml).slice(0, 12);
    const payload = {
      quotes: quotes.length ? quotes : fallbackQuoteObjects(),
      fetchedAt: new Date().toISOString(),
    };
    writePlanCache(payload);
    return payload;
  } catch {
    const payload = {
      quotes: fallbackQuoteObjects(),
      fetchedAt: null,
    };
    writePlanCache(payload);
    return payload;
  }
}

function fallbackQuoteObjects() {
  return FALLBACK_QUOTES.map((title) => ({
    title,
    link: "https://myvirtualcloud.net",
  }));
}

/**
 * @param {string} xml
 */
function parseRssTitles(xml) {
  const quotes = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/gi;
  let itemMatch;
  while ((itemMatch = itemRe.exec(xml)) && quotes.length < 15) {
    const block = itemMatch[1];
    const title = extractTag(block, "title");
    const link = extractTag(block, "link") || "https://myvirtualcloud.net";
    if (title) {
      quotes.push({ title: decodeEntities(title).trim(), link: link.trim() });
    }
  }
  return quotes;
}

/**
 * @param {string} block
 * @param {string} tag
 */
function extractTag(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*))</${tag}>`, "i");
  const m = re.exec(block);
  if (!m) {
    return "";
  }
  return (m[1] || m[2] || "").trim();
}

/**
 * @param {string} text
 */
function decodeEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function pickPlanLine() {
  const cache = readPlanCache();
  const list = cache.quotes?.length ? cache.quotes : fallbackQuoteObjects();
  const idx = Math.floor(Date.now() / (ROTATE_SEC * 1000)) % list.length;
  return list[idx];
}

function formatPlan() {
  const { paint } = require("./ansi");
  const pick = pickPlanLine();
  const cache = readPlanCache();
  return [
    "",
    paint("── PLAN (sysop .plan) ───────────────────────────────────────────", "blue"),
    "",
    paint(pick.title, "brightYellow"),
    paint(pick.link, "brightCyan"),
    "",
    cache.fetchedAt
      ? paint(`RSS cache: ${cache.fetchedAt}`, "brightBlack")
      : paint("RSS cache: fallback quotes (fetch failed)", "brightBlack"),
  ].join("\r\n");
}

module.exports = { refreshPlanCache, formatPlan, readPlanCache };