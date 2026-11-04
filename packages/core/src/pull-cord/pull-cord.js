// A ceiling pull-cord: a Verlet rope that hangs under gravity, swings when you
// grab it, settles, and fires onPull (by default: toggle the theme with the wave).
// Port of mortspace/pullcord (MIT, https://github.com/mortspace/pullcord) without React or motion.

import { toggleTheme } from "../theme-transition/theme-transition.js";

const W = 64;
const ANCHOR_X = W / 2;
const REST_Y = 176;
const SVG_H = 340;
const SEGMENTS = 16;
const REST_SEG = REST_Y / SEGMENTS;
const KNOB_R = 6.5;
const HIT = 46;
const PAN_START = 3;

/** Physics knobs. Read every frame, so setConfig() applies at once. */
export const CORD_CONFIG = {
  gravity: 1250, // hang tension and fall speed
  damping: 0.94, // fraction of speed kept per 60fps frame
  iterations: 20, // constraint passes per frame: rope stiffness
  stretchMax: 26, // how far past rest the knob can be pulled
  stretchToggle: 20, // pull depth that fires onPull, kept below stretchMax
  maxVelocity: 22, // release speed cap
  sleepVelocity: 0.15, // the loop stops below this speed
};

let uid = 0;

const makeNodes = () =>
  Array.from({ length: SEGMENTS + 1 }, (_, i) => ({ x: ANCHOR_X, y: REST_SEG * i, ox: ANCHOR_X, oy: REST_SEG * i, fixed: i === 0 }));

function ropePath(p) {
  const f = (n) => n.toFixed(1);
  let d = `M ${f(p[0].x)} ${f(p[0].y)}`;
  for (let i = 1; i < p.length - 1; i++) d += ` Q ${f(p[i].x)} ${f(p[i].y)} ${f((p[i].x + p[i + 1].x) / 2)} ${f((p[i].y + p[i + 1].y) / 2)}`;
  const last = p[p.length - 1];
  return `${d} L ${f(last.x)} ${f(last.y)}`;
}

export class PullCord {
  /**
   * @param {HTMLElement} host becomes the fixed cord wrapper (position it with --uifx-cord-top / --uifx-cord-right)
   * @param {{onPull?: () => void, label?: string, pressed?: boolean|null, entrance?: boolean, hint?: string, config?: object}} options
   */
  constructor(host, options = {}) {
    this.host = host;
    this.options = { onPull: () => toggleTheme(), label: "Toggle theme", pressed: null, entrance: true, hint: "", ...options };
    this.config = { ...CORD_CONFIG, ...options.config };
    this.reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.nodes = makeNodes();
    this.target = { x: ANCHOR_X, y: REST_Y };
    this.dragging = false;
    this.didDrag = false;
    this.clicked = false;
    this.press = null;
    this.running = false;
    this.raf = 0;
    this.build();
    this.render();
    if (this.options.entrance && !this.reduce) {
      this.inner.classList.add("is-dropping");
      this.fallback = setTimeout(() => this.endDrop(), 1700);
    }
  }

  build() {
    const id = `uifx-cord-${++uid}`;
    this.host.classList.add("uifx-pull-cord");
    this.inner = document.createElement("div");
    this.inner.className = "uifx-pull-cord-inner";
    this.inner.innerHTML = `<svg viewBox="0 0 ${W} ${SVG_H}" width="${W}" height="${SVG_H}" aria-hidden="true">
  <defs>
    <linearGradient id="${id}-knob" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#e7e7ec"/></linearGradient>
    <filter id="${id}-shadow" x="-70%" y="-70%" width="240%" height="240%"><feDropShadow dx="0" dy="1.4" stdDeviation="1.5" flood-color="rgba(0,0,0,0.32)"/></filter>
  </defs>
  <path class="uifx-pull-cord-rope" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  <g><circle cx="${ANCHOR_X}" cy="${REST_Y}" r="${KNOB_R}" fill="url(#${id}-knob)" stroke="rgba(0,0,0,0.1)" stroke-width="0.5" filter="url(#${id}-shadow)"/></g>
</svg>`;
    this.rope = this.inner.querySelector("path");
    this.weight = this.inner.querySelector("g");
    this.knob = document.createElement("button");
    this.knob.type = "button";
    this.knob.className = "uifx-pull-cord-knob";
    this.knob.style.cssText = `left:${ANCHOR_X - HIT / 2}px;top:${REST_Y - HIT / 2}px;width:${HIT}px;height:${HIT}px`;
    this.setLabel(this.options.label);
    this.setPressed(this.options.pressed);
    this.inner.append(this.knob);
    if (this.options.hint) {
      const hint = document.createElement("span");
      hint.className = "uifx-pull-cord-hint";
      hint.setAttribute("aria-hidden", "true");
      hint.textContent = this.options.hint;
      this.inner.append(hint);
    }
    this.host.append(this.inner);

    this.onDown = this.onDown.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onUp = this.onUp.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onKey = this.onKey.bind(this);
    this.onDropEnd = (event) => event.animationName === "uifx-cord-drop" && this.endDrop();
    this.step = this.step.bind(this);
    this.knob.addEventListener("pointerdown", this.onDown);
    this.knob.addEventListener("pointermove", this.onMove);
    this.knob.addEventListener("pointerup", this.onUp);
    this.knob.addEventListener("pointercancel", this.onUp);
    this.knob.addEventListener("click", this.onClick);
    this.knob.addEventListener("keydown", this.onKey);
    this.inner.addEventListener("animationend", this.onDropEnd);
  }

  setLabel(label) {
    this.knob.setAttribute("aria-label", label);
    this.knob.title = label;
  }

  /** Mirrors a state (for example "dark theme on") to aria-pressed. null removes it. */
  setPressed(pressed) {
    if (pressed == null) this.knob.removeAttribute("aria-pressed");
    else this.knob.setAttribute("aria-pressed", String(Boolean(pressed)));
  }

  setConfig(config) {
    Object.assign(this.config, config);
  }

  render() {
    const last = this.nodes[SEGMENTS];
    this.rope.setAttribute("d", ropePath(this.nodes));
    this.weight.setAttribute("transform", `translate(${(last.x - ANCHOR_X).toFixed(2)} ${(last.y - REST_Y).toFixed(2)})`);
  }

  wake() {
    if (this.running) return;
    this.running = true;
    this.prevT = 0;
    this.prevDt = 0;
    this.raf = requestAnimationFrame(this.step);
  }

  step(now) {
    const { gravity, damping, iterations, sleepVelocity } = this.config;
    const pts = this.nodes;
    const last = pts[SEGMENTS];
    const dt = this.prevT ? Math.min(0.04, Math.max(0.004, (now - this.prevT) / 1000)) : 1 / 60;
    this.prevT = now;
    // Time-corrected Verlet; damping is normalised to real time so the feel is the same at any refresh rate.
    const velCoef = (this.prevDt > 0 ? dt / this.prevDt : 1) * damping ** (dt * 60);
    const accel = gravity * dt * dt;

    last.fixed = this.dragging;
    for (const p of pts) {
      if (p.fixed) continue;
      const vx = p.x - p.ox;
      const vy = p.y - p.oy;
      p.ox = p.x;
      p.oy = p.y;
      p.x += vx * velCoef;
      p.y += vy * velCoef + accel;
    }
    if (this.dragging) {
      last.ox = last.x;
      last.oy = last.y;
      last.x = this.target.x;
      last.y = this.target.y;
    }
    for (let k = 0; k < iterations; k++) {
      for (let i = 0; i < SEGMENTS; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.0001;
        const diff = ((REST_SEG - dist) / dist) * 0.5;
        if (!a.fixed) {
          a.x -= dx * diff;
          a.y -= dy * diff;
        }
        if (!b.fixed) {
          b.x += dx * diff;
          b.y += dy * diff;
        }
      }
    }
    this.prevDt = dt;
    this.render();

    let speed = 0;
    for (let i = 1; i < pts.length; i++) speed += Math.abs(pts[i].x - pts[i].ox) + Math.abs(pts[i].y - pts[i].oy);
    if (!this.dragging && speed < sleepVelocity * dt * 60) {
      this.running = false;
      return;
    }
    this.raf = requestAnimationFrame(this.step);
  }

  pull() {
    this.options.onPull?.();
  }

  /** A click or key press acts like a short real pull: the switch clicks, the rope yanks and recoils. */
  yank() {
    this.pull();
    if (this.reduce) return;
    this.nodes[SEGMENTS].oy -= 22;
    this.wake();
  }

  onDown(event) {
    if (this.reduce || event.button !== 0) return;
    this.press = { x: event.clientX, y: event.clientY };
    this.knob.setPointerCapture(event.pointerId);
  }

  onMove(event) {
    if (!this.press) return;
    const ox = event.clientX - this.press.x;
    const oy = event.clientY - this.press.y;
    if (!this.dragging) {
      if (Math.hypot(ox, oy) < PAN_START) return;
      this.dragging = true;
      this.didDrag = true;
      this.clicked = false;
      this.wake();
    }
    const { stretchMax, stretchToggle } = this.config;
    const ry = REST_Y + oy;
    const dist = Math.hypot(ox, ry) || 0.0001;
    const k = Math.min(1, (REST_Y + stretchMax) / dist);
    this.target = { x: ANCHOR_X + ox * k, y: ry * k };
    // Like a real pull-chain, it clicks mid-pull, once, when the depth crosses the detent.
    if (!this.clicked && dist - REST_Y >= Math.min(stretchToggle, stretchMax - 1)) {
      this.clicked = true;
      this.pull();
    }
  }

  onUp() {
    if (!this.press) return;
    this.press = null;
    if (!this.dragging) return;
    this.dragging = false;
    const p = this.nodes[SEGMENTS];
    const vx = p.x - p.ox;
    const vy = p.y - p.oy;
    const v = Math.hypot(vx, vy);
    if (v > this.config.maxVelocity) {
      const k = this.config.maxVelocity / v;
      p.ox = p.x - vx * k;
      p.oy = p.y - vy * k;
    }
    this.wake();
    requestAnimationFrame(() => (this.didDrag = false));
  }

  onClick(event) {
    if (this.didDrag || event.detail === 0) return;
    this.yank();
  }

  onKey(event) {
    if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
      event.preventDefault();
      this.yank();
    }
  }

  /** The CSS drop ends fast at rest; its momentum goes into the rope as one overshoot and a small swing. */
  endDrop() {
    if (this.dropped) return;
    this.dropped = true;
    clearTimeout(this.fallback);
    this.inner.classList.remove("is-dropping");
    this.nodes[SEGMENTS].oy -= 13;
    this.nodes[SEGMENTS].ox -= 6;
    this.wake();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    clearTimeout(this.fallback);
    this.inner.remove();
    this.host.classList.remove("uifx-pull-cord");
  }
}
