const { paint } = require("./ansi");

const TRACERT_HOPS = [
  { hop: 1, host: "auckland-gw.asi-solutions.local", ms: 12, carrier: "Spark NZ" },
  { hop: 2, host: "syd-edge.anzix.net", ms: 38, carrier: "Southern Cross" },
  { hop: 3, host: "vmware-view-lab.vmc", ms: 187, carrier: "vExpert uplink" },
  { hop: 4, host: "hci-storage.hcibox", ms: 204, carrier: "Nutanix peer (historic)" },
  { hop: 5, host: "k8s-gpu.runai-gw", ms: 241, carrier: "GPU fabric" },
  { hop: 6, host: "gov-ai.council-edge.nz", ms: 268, carrier: "high-stakes inference" },
  { hop: 7, host: "node.andre.leibovici", ms: 272, carrier: "terminal-resume" },
];

const NODES = [
  { id: "AKL", name: "Auckland home ASI", role: "Present · public sector AI contexts" },
  { id: "VDI", name: "VMware View/Horizon arc", role: "Packt co-author · vExpert" },
  { id: "HCI", name: "Hyperconverged era", role: "Storage & VDI at scale" },
  { id: "K8S", name: "Kubernetes + GPU", role: "ML infra · KRM quotas · blog since 2009" },
  { id: "BLOG", name: "myvirtualcloud.net", role: "Long-form field notes" },
];

function viewTracert() {
  const lines = [
    "",
    paint("── TRACERT career path ───────────────────────────────────────────", "blue"),
    "",
    paint("Tracing route to andre.leibovici [max 7 hops]", "brightBlack"),
    "",
  ];
  for (const row of TRACERT_HOPS) {
    lines.push(
      `  ${paint(String(row.hop), "yellow")}  ` +
        `${row.host.padEnd(28)} ` +
        `${paint(row.ms + " ms", "brightCyan")}  ` +
        paint(row.carrier, "brightBlack")
    );
  }
  lines.push("");
  lines.push(paint("Narrative: VDI roots → cloud/HCI → K8s/GPU → gov-grade AI.", "brightGreen"));
  return lines.join("\r\n");
}

function viewNodes() {
  const lines = [
    "",
    paint("── NODES (dial-out map) ─────────────────────────────────────────", "blue"),
    "",
  ];
  for (const n of NODES) {
    lines.push(
      `  ${paint(n.id, "brightYellow")}  ${paint(n.name, "brightWhite")}  ${paint(n.role, "brightBlack")}`
    );
  }
  lines.push("");
  lines.push(paint("Type TRACERT for hop-by-hop latency fiction.", "brightBlack"));
  return lines.join("\r\n");
}

module.exports = { viewTracert, viewNodes };