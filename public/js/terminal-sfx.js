(function (global) {
  const STORAGE_KEY = "terminal-resume-sfx";
  const AudioCtx = global.AudioContext || global.webkitAudioContext;

  function isEnabled() {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v !== "off";
    } catch {
      return true;
    }
  }

  /**
   * @param {boolean} on
   */
  function setEnabled(on) {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  }

  /**
   * @param {number} freq
   * @param {number} duration
   * @param {number} gain
   */
  function blip(freq, duration, gain) {
    if (!isEnabled() || !AudioCtx) {
      return;
    }
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    setTimeout(() => ctx.close().catch(() => {}), (duration + 0.05) * 1000);
  }

  function keyTick() {
    blip(880, 0.012, 0.02);
  }

  function lineFeed() {
    blip(440, 0.02, 0.025);
  }

  global.TerminalSfx = {
    isEnabled,
    setEnabled,
    keyTick,
    lineFeed,
  };
})(typeof window !== "undefined" ? window : globalThis);