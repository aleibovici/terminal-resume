const { RESUME } = require("./resume");

function stripAnsi(text) {
  return String(text).replace(/\x1b\[[0-9;]*m/g, "");
}

function generateAnsResume() {
  const lines = [
    "╔══════════════════════════════════════════════════════════════╗",
    `║  ${RESUME.owner.name.toUpperCase().padEnd(60)}║`,
    "╚══════════════════════════════════════════════════════════════╝",
    "",
    RESUME.owner.title,
    RESUME.owner.location,
    "",
    ...RESUME.resumeLines,
    "",
    "Contact:",
  ];
  for (const row of RESUME.contact.rows) {
    lines.push(`  ${row.label}: ${row.value}`);
  }
  return lines.join("\r\n");
}

function generateSessionTranscript() {
  const blog = RESUME.contact.rows.find((r) => r.label === "Blog")?.value || "";
  return [
    "MODEM SESSION TRANSCRIPT — TERMINAL RÉSUMÉ NODE",
    "==============================================",
    "",
    `[CARRIER] Connected 2400 baud (emulated)`,
    `[LOGIN] User: visitor — access granted (demo)`,
    `[MENU] Résumé sections 1-4 · WHOIS · LAST · RIP · door 5/D`,
    "",
    `Operator: ${RESUME.owner.name}`,
    `Blog: ${blog}`,
    "",
    "End of captured session.",
    "",
  ].join("\r\n");
}

function generateVcf() {
  const blog = RESUME.contact.rows.find((r) => r.label === "Blog")?.value || "";
  const linkedin = RESUME.contact.rows.find((r) => r.label === "LinkedIn")?.value || "";
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${RESUME.owner.name}`,
    `TITLE:${RESUME.owner.title}`,
    `ADR:;;${RESUME.owner.location};;;;`,
    `URL:${blog}`,
    `X-SOCIALPROFILE;type=linkedin:${linkedin}`,
    "NOTE:Terminal résumé node — public URLs only",
    "END:VCARD",
    "",
  ].join("\r\n");
}

module.exports = {
  generateAnsResume,
  generateSessionTranscript,
  generateVcf,
  stripAnsi,
};