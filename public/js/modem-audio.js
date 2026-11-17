/**
 * Synthesized dial-up / V.42 handshake via Web Audio API (no external assets).
 */
(function (global) {
  const AudioCtx = global.AudioContext || global.webkitAudioContext;

  /**
   * @param {number} t0
   * @param {AudioContext} ctx
   * @param {number} freq
   * @param {number} duration
   * @param {number} [gain]
   */
  function tone(t0, ctx, freq, duration, gain = 0.08) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  /**
   * @param {number} t0
   * @param {AudioContext} ctx
   */
  function noiseBurst(t0, ctx) {
    const bufferSize = ctx.sampleRate * 0.35;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filt = ctx.createBiquadFilter();
    filt.type = "bandpass";
    filt.frequency.value = 1800;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.12, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);
    src.connect(filt);
    filt.connect(g);
    g.connect(ctx.destination);
    src.start(t0);
    src.stop(t0 + 0.4);
  }

  function playModemHandshake() {
    if (!AudioCtx) {
      return;
    }
    const ctx = new AudioCtx();
    const t = ctx.currentTime + 0.05;

    tone(t, ctx, 350, 0.9, 0.06);
    tone(t + 0.15, ctx, 440, 0.12, 0.05);
    tone(t + 0.35, ctx, 480, 0.1, 0.05);

    tone(t + 0.55, ctx, 425, 2.2, 0.05);

    noiseBurst(t + 2.75, ctx);

    tone(t + 3.1, ctx, 2225, 0.45, 0.09);
    tone(t + 3.2, ctx, 2100, 1.8, 0.07);

    tone(t + 4.0, ctx, 1200, 0.08, 0.06);
    tone(t + 4.12, ctx, 2200, 0.08, 0.06);
    tone(t + 4.24, ctx, 1200, 0.08, 0.06);
    tone(t + 4.36, ctx, 2400, 0.2, 0.07);

    tone(t + 4.65, ctx, 1800, 0.35, 0.05);

    const closeAt = t + 5.3;
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, Math.max(0, (closeAt - ctx.currentTime) * 1000));
  }

  global.playModemHandshake = playModemHandshake;
})(typeof window !== "undefined" ? window : globalThis);