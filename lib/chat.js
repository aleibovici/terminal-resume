const { paint } = require("./ansi");
const { RESUME } = require("./resume");

const BLOG =
  RESUME.contact.rows.find((r) => r.label === "Blog")?.value || "https://myvirtualcloud.net";

/**
 * @param {string} question
 */
function answerAsk(question) {
  const q = String(question || "").toLowerCase();
  if (!q.trim()) {
    return paint("Ask something about Andre's public résumé facts.", "yellow");
  }

  if (/job|employer|salary|hire|date|20\d{2}\s*[-–]/.test(q) && !/2009|since 2009|blog/.test(q)) {
    return paint(
      "SysOp: No invented jobs or dates here — see résumé V or LinkedIn URL in C.",
      "brightRed"
    );
  }

  if (q.includes("who") || q.includes("andre") || q.includes("name")) {
    return `${RESUME.owner.name} — ${RESUME.owner.location}. ${RESUME.owner.title}`;
  }
  if (q.includes("blog") || q.includes("write") || q.includes("myvirtualcloud")) {
    return `Blog since 2009: ${BLOG}`;
  }
  if (q.includes("vdi") || q.includes("euc") || q.includes("horizon") || q.includes("view")) {
    return "Public focus: VDI/EUC, VMware View & Horizon (Packt co-author). Menu V for profile.";
  }
  if (q.includes("kubernetes") || q.includes("k8s") || q.includes("gpu") || q.includes("ml")) {
    return "Skills: Kubernetes, GPU/ML infrastructure — menu S. Blog covers field deployments.";
  }
  if (q.includes("contact") || q.includes("linkedin") || q.includes("github") || q.includes("email")) {
    return `Public channels only — menu C. Blog: ${BLOG}`;
  }
  if (q.includes("packt") || q.includes("book")) {
    return "Packt co-author: VMware View 5 and VMware Horizon 6 (listed in résumé V).";
  }
  if (q.includes("auckland") || q.includes("asi")) {
    return "Based Auckland; ASI Solutions NZ on public LinkedIn (no role dates in this node).";
  }

  return (
    paint("SysOp shrugs. ", "brightBlack") +
    paint("Try: VDI, Kubernetes, blog, contact, Packt. Or ? for help.", "yellow")
  );
}

function formatChatAnswer(question) {
  const { CLEAR } = require("./ansi");
  return [
    "",
    paint("── SysOp CHAT ───────────────────────────────────────────────────", "magenta"),
    "",
    paint("Q: ", "green") + question,
    paint("A: ", "cyan") + answerAsk(question),
  ].join("\r\n");
}

module.exports = { answerAsk, formatChatAnswer };