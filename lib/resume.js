/**
 * ═══════════════════════════════════════════════════════════════════
 *  EDIT HERE — Andre Leibovici résumé content for the terminal site
 * ═══════════════════════════════════════════════════════════════════
 *
 * Plain strings and arrays only. Formatting / ANSI is applied in terminal.js.
 * Facts sourced from public profiles (see docs/andre-public-presence.md).
 */

const RESUME = {
  owner: {
    name: "Andre Leibovici",
    handle: "aleibovici",
    title: "VDI · Cloud · Kubernetes · GPU infrastructure",
    location: "Auckland, New Zealand · ASI Solutions NZ",
    tagline:
      "Virtualization, cloud, Kubernetes, GPUs & end-user computing —",
  },

  resumeLines: [
    "═══════════════════════════════════════════════════════════════",
    " PROFILE",
    "═══════════════════════════════════════════════════════════════",
    "",
    " Andre Leibovici — Auckland, New Zealand.",
    " ASI Solutions NZ (current employer, public LinkedIn).",
    "",
    " Author, myvirtualcloud.net — technical blog since 2009.",
    " https://myvirtualcloud.net",
    "",
    " Writing: VDI/EUC, storage & HCI, Kubernetes, GPU/ML infra.",
    "",
    "═══════════════════════════════════════════════════════════════",
    " PUBLICATIONS (PACKT)",
    "═══════════════════════════════════════════════════════════════",
    "",
    " • VMware View 5 Desktop Virtualization Solutions (co-author)",
    " • VMware Horizon 6 Desktop Virtualization Solutions (co-author)",
    "",
    "═══════════════════════════════════════════════════════════════",
    " HONORS & RECOGNITION",
    "═══════════════════════════════════════════════════════════════",
    "",
    " • VMware vExpert (multiple years)",
    " • VMware Virtual Desktop Ingenuity Award (2009)",
    "",
    "═══════════════════════════════════════════════════════════════",
    " SELECT PROJECTS (PUBLIC)",
    "═══════════════════════════════════════════════════════════════",
    "",
    " • VDI Calculator — open-source VDI sizing tool (vdicalc).",
    " • Ollama GPU Calculator — local LLM VRAM/arch compatibility.",
    " • PlayerPing — tennis interclub availability (SMS/WhatsApp).",
    " • SignalScope — AI market signals (Next.js/Postgres/Docker).",
    " • KRM Quota Planner — GPU quota planning for KAI RM.",
    "",
  ],

  aboutLines: [
    "Infrastructure practitioner and technical author.",
    "",
    "Since 2009, myvirtualcloud.net has documented real-world",
    "deployments — from VMware View/Horizon and VDI through",
    "hyperconverged storage to Kubernetes and GPU platforms.",
    "",
    "Career hubs: São Paulo, Sydney, Silicon Valley, Auckland",
    "(startups, acquisitions, enterprise). Based in Auckland;",
    "ASI Solutions NZ on public LinkedIn.",
    "",
    "Open-source tools on GitHub (Go, TypeScript, Node).",
    "Full timeline: linkedin.com/in/aleibovici",
  ],

  skills: [
    {
      group: "Infrastructure",
      items: [
        "VDI / EUC",
        "Kubernetes",
        "GPU & ML infrastructure",
        "VMware ecosystem",
      ],
    },
    {
      group: "Development",
      items: ["Go", "TypeScript", "Node.js"],
    },
    {
      group: "Other",
      items: ["Technical writing", "MLOps themes", "Open source"],
    },
  ],

  contact: {
    intro: "Public channels (no private email published).",
    rows: [
      { label: "Blog", value: "https://myvirtualcloud.net", note: "since 2009" },
      { label: "LinkedIn", value: "https://linkedin.com/in/aleibovici", note: "" },
      { label: "GitHub", value: "https://github.com/aleibovici", note: "" },
      { label: "X", value: "https://x.com/andreleibovici", note: "" },
    ],
  },

  archiveEasterEgg:
    "The multi-user BBS doors were decommissioned in favor of this résumé node.",
};

module.exports = { RESUME };