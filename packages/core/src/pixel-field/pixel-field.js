// Pixel field: an animated, dithered pixel background around a pixel wordmark.
// Port of the omarchy.org hero (https://omarchy.org/), rewritten as a framework-free canvas.
// - The background is drifting value noise, cut by an ordered (Bayer) dither and stronger
//   toward the edges, so the middle stays calm for content.
// - The pointer and a wandering "ghost" light up the cells near them (hover).
// - Press and hold on the background, then release: a ripple stamp grows from that spot.
//   The ghost stamps on its own now and then.
// - Click the wordmark: it plays an entrance effect again (a random one).

import { EFFECTS, EFFECT_NAMES } from "./effects.js";
import { parseBitmap, textToBitmap } from "./font.js";

const NOISE = 128;
const FRAME_MS = 25;
const REACH_CELLS = 12;
const QUIET_REACH = 96;
const HOLD_S = 1.1;
const BANDS = ["crest", "crest", "crest", "crest", "crest", "hover", "hover", "lit", "lit", "lit", "lit", "mid", "mid", "mid", "dim", "dim", "dim", "dim", "dim"];
const INTERACTIVE = 'a, button, input, select, textarea, label, [role="button"], [data-pf-no-stamp]';

/** Concentric squares: the ripple drawn by a stamp. */
export const RIPPLE = [
  "111111111111111",
  "100000000000001",
  "101111111111101",
  "101000000000101",
  "101011111110101",
  "101010000010101",
  "101010111010101",
  "101010101010101",
  "101010111010101",
  "101010000010101",
  "101011111110101",
  "101000000000101",
  "101111111111101",
  "100000000000001",
  "111111111111111",
];

const BAYER = (() => {
  let m = [[0]];
  for (let k = 0; k < 3; k++) {
    const s = m.length;
    const next = Array.from({ length: s * 2 }, () => new Array(s * 2));
    for (let y = 0; y < s; y++)
      for (let x = 0; x < s; x++) {
        const v = m[y][x] * 4;
        next[y][x] = v;
        next[y][x + s] = v + 2;
        next[y + s][x] = v + 3;
        next[y + s][x + s] = v + 1;
      }
    m = next;
  }
  return m.flat();
})();

function lcg(seed) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0), s / 4294967296);
}

/** Tileable smooth noise: random values blurred twice, normalised to 0..1. */
function smoothNoise(seed) {
  const random = lcg(seed);
  let grid = Float32Array.from({ length: NOISE * NOISE }, random);
  for (let pass = 0; pass < 2; pass++) {
    const next = new Float32Array(NOISE * NOISE);
    for (let y = 0; y < NOISE; y++)
      for (let x = 0; x < NOISE; x++) {
        let sum = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) sum += grid[((y + dy + NOISE) % NOISE) * NOISE + ((x + dx + NOISE) % NOISE)];
        next[y * NOISE + x] = sum / 9;
      }
    grid = next;
  }
  let min = Infinity;
  let max = -Infinity;
  for (const v of grid) (min = Math.min(min, v)), (max = Math.max(max, v));
  return grid.map((v) => (v - min) / (max - min || 1));
}

function sampleNoise(grid, x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const ix = ((x0 % NOISE) + NOISE) % NOISE;
  const iy = ((y0 % NOISE) + NOISE) % NOISE;
  const ix1 = (ix + 1) % NOISE;
  const iy1 = (iy + 1) % NOISE;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const top = grid[iy * NOISE + ix] * (1 - sx) + grid[iy * NOISE + ix1] * sx;
  const bottom = grid[iy1 * NOISE + ix] * (1 - sx) + grid[iy1 * NOISE + ix1] * sx;
  return top * (1 - sy) + bottom * sy;
}

const between = ([a, b]) => a + Math.random() * (b - a);

export class PixelField {
  /**
   * @param {HTMLElement} host The section; its content goes on top of the canvas.
   * @param {{ text?: string, bitmap?: string[], scale?: number, gap?: number, intro?: string | false,
   *   ghost?: boolean, stamp?: string[], onPress?: () => void }} [options]
   */
  constructor(host, options = {}) {
    this.host = host;
    this.options = { text: "PIXELS", bitmap: null, scale: 2, gap: 1, intro: "rain", ghost: true, stamp: RIPPLE, onPress: null, ...options };
    const o = this.options;
    this.glyph = o.bitmap ? parseBitmap(o.bitmap) : textToBitmap(o.text, { scale: o.scale, gap: o.gap });
    this.stamp = parseBitmap(o.stamp);
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    this.noise = smoothNoise(10407530);
    const white = lcg(663316);
    this.white = Float32Array.from({ length: 4096 }, white);
    this.cells = [];
    this.glyph.rows.forEach((line, row) => {
      for (let col = 0; col < line.length; col++) if (line[col] === "1") this.cells.push({ col, row, r1: 0, r2: 0 });
    });

    this.pointer = { x: -1e4, y: -1e4, hover: 0, target: 0 };
    this.ghost = { x: -1e4, y: -1e4, strength: 0, target: 0, charge: null, next: Infinity };
    this.charge = null;
    this.pressOnWordmark = false;
    this.stamps = [];
    this.etch = null;
    this.raf = 0;
    this.lastDraw = 0;
    this.visible = true;

    host.classList.add("uifx-pixel-field");
    this.canvas = document.createElement("canvas");
    this.canvas.className = "uifx-pixel-field-canvas";
    this.canvas.setAttribute("aria-hidden", "true");
    host.prepend(this.canvas);
    this.ctx = this.canvas.getContext("2d", { alpha: false });
    this.wordmark = host.querySelector("[data-pf-wordmark]");
    if (this.wordmark) {
      this.wordmark.classList.add("uifx-pixel-field-wordmark");
      this.wordmark.style.aspectRatio = `${this.glyph.width} / ${this.glyph.height}`;
      this.wordmark.setAttribute("role", "img");
      if (!this.wordmark.hasAttribute("aria-label") && !o.bitmap) this.wordmark.setAttribute("aria-label", o.text);
    }

    this.readColors();
    this.layout();

    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.loop = this.loop.bind(this);
    if (this.fine) window.addEventListener("pointermove", this.onPointerMove, { passive: true });
    host.addEventListener("pointerdown", this.onPointerDown, { passive: true });
    window.addEventListener("pointerup", this.onPointerUp, { passive: true });
    window.addEventListener("pointercancel", this.onCancel, { passive: true });
    window.addEventListener("contextmenu", this.onCancel, { passive: true });

    this.resizer = new ResizeObserver(() => this.layout());
    this.resizer.observe(host);
    if (this.wordmark) this.resizer.observe(this.wordmark);
    this.watcher = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.visible ? this.start() : this.stop();
    }, { rootMargin: "64px" });
    this.watcher.observe(host);
    this.themeWatcher = new MutationObserver(() => this.readColors());
    this.themeWatcher.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "style"] });
    this.scheme = matchMedia("(prefers-color-scheme: dark)");
    this.onScheme = () => this.readColors();
    this.scheme.addEventListener("change", this.onScheme);

    if (o.intro && !this.reduced) this.play(o.intro);
    this.start();
  }

  destroy() {
    this.stop();
    window.removeEventListener("pointermove", this.onPointerMove);
    this.host.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onCancel);
    window.removeEventListener("contextmenu", this.onCancel);
    this.resizer.disconnect();
    this.watcher.disconnect();
    this.themeWatcher.disconnect();
    this.scheme.removeEventListener("change", this.onScheme);
    this.canvas.remove();
    this.host.classList.remove("uifx-pixel-field");
    this.host.style.cursor = "";
  }

  /** Plays an entrance effect on the wordmark: a name from EFFECT_NAMES, or "random". */
  play(name = "random") {
    if (this.reduced) return;
    if (name === "random") {
      const pool = EFFECT_NAMES.filter((n) => n !== this.lastEffect);
      name = pool[Math.floor(Math.random() * pool.length)];
    }
    if (!EFFECTS[name]) return;
    this.lastEffect = name;
    for (const c of this.cells) (c.r1 = Math.random()), (c.r2 = Math.random());
    this.etch = { start: performance.now(), ...EFFECTS[name](this.glyph) };
  }

  readColors() {
    const style = getComputedStyle(this.host);
    const get = (name, fallback) => style.getPropertyValue(`--uifx-pf-${name}`).trim() || fallback;
    this.colors = {
      bg: get("bg", "#0e1016"),
      dim: get("dim", "#26304d"),
      mid: get("mid", "#3f5590"),
      lit: get("lit", "#6d8ff0"),
      hover: get("hover", "#9ab0f5"),
      crest: get("crest", "#d0dbfb"),
    };
    this.bands = Array.from({ length: this.glyph.height }, (_, row) => this.colors[BANDS[Math.floor((row / this.glyph.height) * BANDS.length)]]);
    if (this.reduced || !this.raf) this.draw(performance.now());
  }

  layout() {
    const box = this.host.getBoundingClientRect();
    if (box.width < 1 || box.height < 1) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.round(box.width * dpr);
    const H = Math.round(box.height * dpr);
    if (W !== this.canvas.width || H !== this.canvas.height) {
      this.canvas.width = W;
      this.canvas.height = H;
    }
    const g = this.glyph;
    const mark = this.wordmark?.getBoundingClientRect();
    const markWidth = (mark?.width || Math.min(0.88 * (box.width - 48), 896)) * dpr;
    const L = markWidth / g.width;
    const R = mark?.height ? (mark.height * dpr) / g.height : L;
    const F = mark?.width ? (mark.left - box.left) * dpr : (W - markWidth) / 2;
    const I = mark?.height ? (mark.top - box.top) * dpr : H * 0.42 - (R * g.height) / 2;
    const x0 = -Math.ceil(F / L) - 1;
    const y0 = -Math.ceil(I / R) - 1;
    const cols = Math.ceil((W - F) / L) - x0 + 1;
    const rows = Math.ceil((H - I) / R) - y0 + 1;
    const mask = new Float32Array(cols * rows);
    for (let r = 0; r < rows; r++) {
      const cy = I + (y0 + r + 0.5) * R;
      const ny = (cy / H) * 2 - 1;
      const top = Math.min(1, Math.max(0.16, (cy / dpr - 24) / 130));
      for (let c = 0; c < cols; c++) {
        const nx = ((F + (x0 + c + 0.5) * L) / W) * 2 - 1;
        const edge = Math.min(1, Math.max(0, (Math.sqrt(nx * nx + ny * ny * 0.82) - 0.42) / 0.85));
        mask[r * cols + c] = edge * edge * top;
      }
    }
    Object.assign(this, { dpr, W, H, L, R, F, I, x0, y0, cols, rows, mask });
    this.quiet = [...this.host.querySelectorAll("[data-pf-quiet]")];
    if (this.reduced || !this.raf) this.draw(performance.now());
  }

  start() {
    if (this.reduced || this.raf || !this.visible) return;
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  loop(now) {
    this.raf = requestAnimationFrame(this.loop);
    if (now - this.lastDraw < FRAME_MS) return;
    this.lastDraw = now;
    this.draw(now);
  }

  // Pointer.

  local(event) {
    const box = this.host.getBoundingClientRect();
    return {
      inside: event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom,
      x: (event.clientX - box.left) * this.dpr,
      y: (event.clientY - box.top) * this.dpr,
    };
  }

  /** 1 far from content marked [data-pf-quiet], down to 0 on top of it. */
  calm(clientX, clientY) {
    let nearest = Infinity;
    for (const node of this.quiet) {
      for (const child of node.children.length ? node.children : [node]) {
        const r = child.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) continue;
        const dx = Math.max(r.left - clientX, 0, clientX - r.right);
        const dy = Math.max(r.top - clientY, 0, clientY - r.bottom);
        nearest = Math.min(nearest, Math.hypot(dx, dy));
      }
    }
    return nearest >= QUIET_REACH ? 1 : (nearest / QUIET_REACH) ** 3;
  }

  onWordmark(x, y) {
    return x >= this.F && y >= this.I && x < this.F + this.glyph.width * this.L && y < this.I + this.glyph.height * this.R;
  }

  onPointerMove(event) {
    const p = this.local(event);
    if (!this.charge) this.pointer.target = p.inside ? this.calm(event.clientX, event.clientY) : 0;
    if (p.inside) Object.assign(this.pointer, { x: p.x, y: p.y });
    const clickable = !this.reduced && p.inside && this.onWordmark(p.x, p.y);
    this.host.style.cursor = clickable ? "pointer" : "";
    if (this.reduced) this.draw(0);
  }

  onPointerDown(event) {
    if (event.target instanceof Element && event.target.closest(INTERACTIVE)) return;
    const p = this.local(event);
    Object.assign(this.pointer, { x: p.x, y: p.y });
    this.pressOnWordmark = this.onWordmark(p.x, p.y);
    if (this.pressOnWordmark || this.reduced) return;
    this.pointer.target = 0;
    this.charge = { x: p.x, y: p.y, start: performance.now() };
  }

  onPointerUp(event) {
    if (this.pressOnWordmark) {
      this.pressOnWordmark = false;
      const p = this.local(event);
      if (p.inside && this.onWordmark(p.x, p.y)) this.options.onPress ? this.options.onPress() : this.play("random");
      return;
    }
    if (!this.charge) return;
    const now = performance.now();
    this.addStamp(this.charge.x, this.charge.y, this.chargeOf(now, this.charge.start), now);
    this.charge = null;
    if (this.fine) {
      const p = this.local(event);
      this.pointer.target = p.inside ? this.calm(event.clientX, event.clientY) : 0;
    }
  }

  onCancel() {
    this.charge = null;
    this.pressOnWordmark = false;
  }

  chargeOf(now, start) {
    return Math.min((now - start) / 1000 / HOLD_S, 1);
  }

  addStamp(x, y, charge, now) {
    const from = 0.45 + 1.6 * charge;
    const jitter = () => 0.92 + Math.random() * 0.16;
    this.stamps = [...this.stamps.slice(-3), { x, y, born: now, from, to: (from + 1 + 3.2 * charge) * jitter(), life: (0.65 + 0.55 * charge) * jitter() }];
  }

  moveGhost(now) {
    const g = this.ghost;
    const t = now / 1000;
    const ax = 0.44 * (1 + 0.1 * Math.sin(t * 0.11));
    const ay = 0.38 * (1 + 0.1 * Math.sin(t * 0.09 + 2));
    g.x = this.W * (0.5 + ax * Math.sin(t * 0.65));
    g.y = this.H * (0.48 + ay * Math.sin(t * 0.39 + 1.1));
    const box = this.host.getBoundingClientRect();
    let target = this.calm(box.left + g.x / this.dpr, box.top + g.y / this.dpr) * 0.7;
    if (this.etch) {
      g.charge = null;
      g.next = Infinity;
    } else if (g.next === Infinity) g.next = now + between([1000, 2000]);
    if (!this.etch && !g.charge && now >= g.next) g.charge = { start: now, charge: between([0, 0.2]) };
    if (g.charge) {
      target *= 0.4;
      if (this.chargeOf(now, g.charge.start) >= g.charge.charge) {
        this.addStamp(g.x, g.y, g.charge.charge, now);
        g.charge = null;
        g.next = now + between([2000, 3000]);
      }
    }
    g.target = target;
  }

  // Drawing.

  draw(now) {
    if (!this.mask) return;
    const { ctx, colors, W, H, L, R, F, I, x0, y0, cols, rows, mask, noise, white } = this;
    const t = this.reduced ? 0 : now / 1000;
    if (this.options.ghost && !this.reduced) this.moveGhost(now);
    const g = this.ghost;
    const p = this.pointer;
    g.strength += (g.target - g.strength) * 0.08;
    p.hover += (p.target - p.hover) * 0.3;

    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, W, H);

    const reach = (s) => REACH_CELLS * L * (0.45 + 0.55 * s);
    const lights = [];
    if (p.hover > 0.01) lights.push({ x: p.x, y: p.y, strength: p.hover, reach: reach(p.hover) });
    if (g.strength > 0.01) lights.push({ x: g.x, y: g.y, strength: g.strength, reach: reach(g.strength) });

    this.stamps = this.stamps.filter((s) => (now - s.born) / 1000 < s.life);
    const ripples = this.stamps.map((s) => {
      const n = (now - s.born) / 1000 / s.life;
      return { x: s.x, y: s.y, size: L * (s.from + (s.to - s.from) * (1 - (1 - n) ** 3)), amp: (1 - n) ** 1.7 };
    });
    for (const c of [this.charge, g.charge]) if (c) ripples.push({ x: c.x ?? g.x, y: c.y ?? g.y, size: L * (0.45 + 1.6 * this.chargeOf(now, c.start)), amp: 0.9 });

    const pattern = this.stamp;
    const half = pattern.width / 2;
    const rippleAt = (x, y) => {
      let best = 0;
      for (const r of ripples) {
        const i = Math.floor((x - r.x) / r.size + half);
        const j = Math.floor((y - r.y) / r.size + half);
        if (i >= 0 && j >= 0 && i < pattern.width && j < pattern.height && pattern.rows[j][i] === "1" && r.amp > best) best = r.amp;
      }
      return best;
    };
    const lightAt = (x, y, list) => {
      let best = 0;
      for (const l of list) {
        const d = Math.hypot(x - l.x, y - l.y);
        if (d < l.reach) best = Math.max(best, (1 - d / l.reach) ** 2 * l.strength);
      }
      return best;
    };

    const glyph = this.glyph;
    const isInk = (col, row) => row >= 0 && row < glyph.height && col >= 0 && col < glyph.width && glyph.rows[row][col] === "1";
    const rect = (col, row, color) => {
      const x = F + col * L;
      const y = I + row * R;
      const left = Math.round(x);
      const top = Math.round(y);
      ctx.fillStyle = color;
      ctx.fillRect(left, top, Math.round(x + L) - left, Math.round(y + R) - top);
    };

    for (let r = 0; r < rows; r++) {
      const row = y0 + r;
      const cy = I + row * R + R / 2;
      for (let c = 0; c < cols; c++) {
        const col = x0 + c;
        if (isInk(col, row)) continue;
        const m = mask[r * cols + c];
        let h = 0;
        if (m > 0.002) {
          const nx = col / 9;
          const ny = row / 9;
          const n = 0.6 * sampleNoise(noise, nx + t * 0.14, ny - t * 0.055) + 0.4 * sampleNoise(noise, nx * 0.55 - t * 0.08, ny * 0.55 + t * 0.06);
          const twinkle = 0.5 + 0.5 * Math.sin(t * 1.1 + white[(row * 37 + col * 11) & 4095] * 6.283);
          h = m * (0.3 + 0.52 * n * n + 0.18 * twinkle) * 0.62;
        }
        const cx = F + col * L + L / 2;
        const lit = lights.length ? lightAt(cx, cy, lights) : 0;
        const ripple = ripples.length ? rippleAt(cx, cy) : 0;
        h += lit * 0.6 + ripple * 1.15;
        const threshold = 0.78 * ((BAYER[(row & 7) * 8 + (col & 7)] + 0.5) / 64) + 0.22 * white[(row & 63) * 64 + (col & 63)];
        if (h <= threshold) continue;
        const k = Math.max(lit, ripple);
        rect(col, row, k > 0.34 ? colors.lit : k > 0.1 ? colors.mid : colors.dim);
      }
    }

    const near = lights.filter((l) => l.x > F - l.reach && l.x < F + glyph.width * L + l.reach && l.y > I - l.reach && l.y < I + glyph.height * R + l.reach);
    const inkColor = (col, row) => {
      if (!near.length && !ripples.length) return this.bands[row];
      const x = F + col * L + L / 2;
      const y = I + row * R + R / 2;
      const k = Math.max(rippleAt(x, y), lightAt(x, y, near));
      return k > 0.45 ? colors.crest : k > 0.12 ? colors.hover : this.bands[row];
    };

    if (this.etch && now - this.etch.start > this.etch.duration) this.etch = null;
    if (this.etch) {
      const ms = now - this.etch.start;
      for (const cell of this.cells) {
        const s = this.etch.at(cell, ms);
        if (!s) continue;
        const col = cell.col + s.dx;
        const row = cell.row + s.dy;
        rect(col, row, s.tone ? colors[s.tone] : inkColor(cell.col, cell.row));
      }
    } else {
      for (const cell of this.cells) rect(cell.col, cell.row, inkColor(cell.col, cell.row));
    }
  }
}
