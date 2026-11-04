// Entrance effects for the pixel field wordmark, after terminal text effects.
// An effect gets the bitmap size and returns { duration, at(cell, ms) }.
// `at` returns null (not drawn yet) or { dx, dy, tone }: an offset in cells and a palette
// tone ("crest", "hover", "lit", "mid"), or tone null for the row's settled band colour.

const SETTLED = { dx: 0, dy: 0, tone: null };
const TONES = ["lit", "hover", "crest"];
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const hash = (n) => {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

/** Reveal behind a moving edge; `distance(cell)` is how far the cell is from the start, in cells. */
function edge(distance, span, travel) {
  const speed = span / travel;
  return {
    duration: travel + 10 / speed,
    at(c, ms) {
      const behind = ms * speed - distance(c);
      if (behind < 0) return null;
      if (behind < 2) return { dx: 0, dy: 0, tone: "crest" };
      if (behind < 5) return { dx: 0, dy: 0, tone: "hover" };
      if (behind < 9) return { dx: 0, dy: 0, tone: "lit" };
      return SETTLED;
    },
  };
}

export const EFFECTS = {
  /** Cells fall into place, the bottom rows first. */
  rain({ height }) {
    const fall = 520;
    const delay = (c) => (height - 1 - c.row) * 38 + c.r1 * 420;
    return {
      duration: (height - 1) * 38 + 420 + fall + 160,
      at(c, ms) {
        const t = (ms - delay(c)) / fall;
        if (t < 0) return null;
        if (t < 1) return { dx: 0, dy: -Math.round((1 - t * t) * (c.row + 4 + c.r2 * 6)), tone: "crest" };
        return ms - delay(c) - fall < 160 ? { dx: 0, dy: 0, tone: "hover" } : SETTLED;
      },
    };
  },

  /** Random flicker that resolves from left to right. */
  decrypt({ width }) {
    const settle = (c) => 250 + (c.col / width) * 900 + c.r1 * 300;
    return {
      duration: 1500,
      at(c, ms) {
        if (ms >= settle(c)) return SETTLED;
        const n = hash(c.col * 31 + c.row * 17 + Math.floor(ms / 60) * 7);
        return n < 0.45 ? null : { dx: 0, dy: 0, tone: TONES[Math.floor(n * 10) % 3] };
      },
    };
  },

  /** Cells fly in from scattered spots. */
  scatter({ width, height }) {
    const move = 700;
    return {
      duration: 400 + move + 50,
      at(c, ms) {
        const t = clamp01((ms - c.r1 * 400) / move);
        if (t >= 1) return SETTLED;
        const rest = (1 - t) ** 3;
        return {
          dx: Math.round((c.r2 - 0.5) * width * 0.9 * rest),
          dy: Math.round((hash(c.r1 * 99) - 0.5) * height * 4 * rest),
          tone: t < 0.7 ? "lit" : "crest",
        };
      },
    };
  },

  /** A bright edge sweeps from left to right. */
  sweep({ width }) {
    return edge((c) => c.col, width, 900);
  },

  /** The wordmark opens from the middle column out. */
  middleout({ width }) {
    const mid = (width - 1) / 2;
    return edge((c) => Math.abs(c.col - mid), width / 2, 650);
  },

  /** Cells jitter around their place and calm down. */
  unstable() {
    const duration = 1100;
    return {
      duration,
      at(c, ms) {
        const t = ms / duration;
        if (t >= 1) return SETTLED;
        const amount = (1 - t) ** 2 * 3;
        const tick = Math.floor(ms / 50);
        return {
          dx: Math.round((hash(c.col * 7 + c.row * 13 + tick) - 0.5) * 2 * amount),
          dy: Math.round((hash(c.col * 11 + c.row * 5 + tick * 3) - 0.5) * 2 * amount),
          tone: t < 0.6 ? "hover" : "lit",
        };
      },
    };
  },

  /** Rows catch fire from the bottom and cool to their colour. */
  burn({ height }) {
    const start = (c) => (height - 1 - c.row) * 60 + c.r1 * 200;
    return {
      duration: (height - 1) * 60 + 200 + 280,
      at(c, ms) {
        const t = ms - start(c);
        if (t < 0) return null;
        if (t < 80) return { dx: 0, dy: 0, tone: "crest" };
        if (t < 160) return { dx: 0, dy: 0, tone: "hover" };
        if (t < 260) return { dx: 0, dy: 0, tone: "lit" };
        return SETTLED;
      },
    };
  },
};

export const EFFECT_NAMES = Object.keys(EFFECTS);
