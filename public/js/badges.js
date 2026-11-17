(function (global) {
  const STORAGE_KEY = "terminal-resume-badges-v1";

  /** @type {{ id: string; label: string }[]} */
  const DEFS = [
    { id: "modem", label: "Carrier Detected" },
    { id: "rip", label: "RIP Artist" },
    { id: "door", label: "Door Runner" },
    { id: "archive", label: "Archive Diver" },
    { id: "sysop", label: "SYMMETRIC" },
  ];

  /**
   * @returns {string[]}
   */
  function loadUnlocked() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  /**
   * @param {string[]} list
   */
  function saveUnlocked(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  /**
   * @param {string} id
   * @param {(msg: string) => void} [notify]
   */
  function unlock(id, notify) {
    const list = loadUnlocked();
    if (list.includes(id)) {
      return false;
    }
    list.push(id);
    saveUnlocked(list);
    const def = DEFS.find((d) => d.id === id);
  const label = def ? def.label : id;
    if (notify) {
      notify(`\r\n\x1b[95m★ BADGE UNLOCKED: ${label}\x1b[0m\r\n`);
    }
    return true;
  }

  function listForServerEcho() {
    return loadUnlocked();
  }

  global.BadgeCollector = {
    loadUnlocked,
    unlock,
    listForServerEcho,
    DEFS,
  };
})(typeof window !== "undefined" ? window : globalThis);