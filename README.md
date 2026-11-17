# Terminal Résumé — Andre Leibovici

A **remote-access / BBS-style** résumé site in the browser: fake dial-up login, ANSI-colored output, and an 80×24 **xterm.js** terminal. No database, no real accounts — any login succeeds.

**Blog / main site:** The Hugo/Astro blog lives in a separate repo — [github.com/aleibovici/myvirtualcloud-net](https://github.com/aleibovici/myvirtualcloud-net). This repository is only the terminal résumé app.

**Cursor Apps:** Published as **bbs** (`https://bbs.apps.grok.bot`). Republish from a **repo-linked Cloud Agent on this repository** (`publish-app`), not from the blog monorepo.

**Origin:** GitHub is the source of truth here. An Origin mirror (e.g. `andre1/terminal-resume`) is not set up yet — create it in the Origin UI if you want a copy there.

Built for local dev and **Cursor Apps** publish (`npm run build && npm start` — Express serves `public/` plus WebSocket `/ws`).

**Privacy:** Login names are not written to disk. `LAST` / `USERS` store only aggregate timestamps and counters. “Your last visit” is per browser tab (server memory). The `SYMMETRIC` phrase is a BBS easter egg (cosmetic SysOp banner + badge), not authentication.

## Requirements

- Node.js **18+**

## Run locally

```bash
git clone https://github.com/aleibovici/terminal-resume.git
cd terminal-resume
npm install
npm run build
npm start
```

Open [http://127.0.0.1:3847](http://127.0.0.1:3847).

Development (auto-restart when server/lib files change):

```bash
npm run dev
```

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3847` | HTTP listen port |
| `HOST` | `127.0.0.1` | Bind address (`0.0.0.0` when hosting) |

**Baud eras:** `?baud=300` · `2400` (default) · `14400` · `57600` — throttle + CRT scanline intensity.

## Edit résumé content

**Single source of truth:** [`lib/resume.js`](lib/resume.js)

## Command table (login or menu unless noted)

| Command | Effect |
|---------|--------|
| **1–4 / V A S C** | Résumé sections |
| **5 / D** | ANSI door adventure (multi-step, real loot from resume.js) |
| **9** | Archive easter egg |
| **!** + `SYMMETRIC` | SysOp easter egg (display-only, not a secret) |
| **WHOIS / FINGER** | Mini profile |
| **LAST** | Anonymous visit times + aggregate counts (no handles stored) |
| **THEME / T**, **GREEN / AMBER** | CRT phosphor |
| **RIP / G / GRAPHICS** | RIP vector splash + mouse buttons |
| **RIPT / TIMELINE** | RIP career timeline (click → section jump) |
| **TEXT** | Exit graphics |
| **TRACERT / NODES** | Career dial-out map |
| **DL / DOWNLOAD** | Lists HTTP download paths |
| **SIGN** *message* | Guestbook (`data/guestbook.json`) |
| **PLAN** | Rotating blog quote (RSS cache on boot) |
| **CHAT** *q* / **ASK** *q* | SysOp Q&A (public facts only) |
| **USERS** | Whimsical online + anonymous caller counts |
| **SCORE / BADGES** | Badge collector (localStorage + session echo) |
| **SOUND**, **SFX ON/OFF** | Keyboard/line blips (modem login unchanged) |
| **M / L / ?** | Menu, logout, help |

## Downloads (HTTP)

| URL | File |
|-----|------|
| `/download/resume.ans` | ANSI résumé from `resume.js` |
| `/download/session.txt` | Modem session transcript |
| `/download/contact.vcf` | Contact card (public URLs) |

## Badges (first visit unlock)

| Badge | Unlock |
|-------|--------|
| Carrier Detected | Login (`login_ok`) |
| RIP Artist | Open RIP/TIMELINE |
| Door Runner | Finish door adventure |
| Archive Diver | Command **9** |
| SYMMETRIC | SysOp easter egg at login or `!` gate |

## File structure

```
terminal-resume/
├── index.js              # Cursor Apps entry
├── server/index.js
├── lib/                  # terminal logic + resume.js content
├── public/               # static + vendored xterm
├── scripts/verify-build.js
└── cursor-app.json
```

## Stack

express · ws · vendored xterm.js · fetch (Node 18, PLAN RSS on boot)

## Health

```bash
curl -s http://127.0.0.1:3847/api/health
```