/**
 * Approximate 8N1 modem character delivery: ~baud/10 characters per second.
 */
(function (global) {
  const DEFAULT_BAUD = 2400;

  /**
   * @param {(chunk: string) => void} writeFn
   * @param {number} [baud]
   */
  function createBaudThrottle(writeFn, baud = DEFAULT_BAUD) {
    let enabled = false;
    let queue = "";
    let timer = null;
    let msPerChar = 10000 / Math.max(baud, 300);

    function pump() {
      if (!queue.length) {
        timer = null;
        return;
      }
      const ch = queue.charAt(0);
      queue = queue.slice(1);
      writeFn(ch);
      timer = setTimeout(pump, msPerChar);
    }

    return {
      /**
       * @param {number} nextBaud
       */
      setBaud(nextBaud) {
        msPerChar = 10000 / Math.max(nextBaud, 300);
      },
      setEnabled(on) {
        enabled = Boolean(on);
        if (!enabled) {
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
          if (queue.length) {
            writeFn(queue);
            queue = "";
          }
        }
      },
      /**
       * @param {string} text
       */
      write(text) {
        if (!enabled || !text) {
          writeFn(text);
          return;
        }
        queue += text;
        if (!timer) {
          pump();
        }
      },
    };
  }

  const ALLOWED = [300, 2400, 14400, 57600];

  /**
   * @param {number} baud
   */
  function applyBaudEra(baud) {
    const pick = ALLOWED.includes(baud) ? baud : DEFAULT_BAUD;
    document.documentElement.dataset.baud = String(pick);
    return pick;
  }

  global.createBaudThrottle = createBaudThrottle;
  global.DEFAULT_TERMINAL_BAUD = DEFAULT_BAUD;
  global.applyBaudEra = applyBaudEra;
})(typeof window !== "undefined" ? window : globalThis);