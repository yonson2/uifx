// Reel title: an editable, slot-machine title with a glass cursor.
// Port of the "OpenCode Reloaded" title by Kit Langton
// (https://anoma.ly/notes/opencode-reloaded), rewritten without React or motion libraries.
// The intro starts from a version with typos; a glass lens visits each typo and fixes it:
// a reel rolls to the right letter, an extra letter shakes red and collapses, a swapped
// pair turns like a conveyor. Then the title is editable.

import { CHARSET, createModel, cycle, erase, makeTypos, modelText, move, rotate, select, selectedRange, typeText, wheel } from "./model.js";

const NS = "http://www.w3.org/2000/svg";
const CELL = 64;
const CELL_H = 90;
const TOP = 18;
const ROW_GAP = 108;
const PAD = 82;
const FACE = 96;
const INSET = 7;
const BASELINE = CELL_H / 2 + (78 * 0.7) / 2;
const MAGNIFY = 1.19;

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOutCubic = (t) => 1 - (1 - t) ** 3;
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const easeOutQuint = (t) => 1 - (1 - t) ** 5;
const easeOutBack = (t) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;
const noise = (x) => {
  const s = Math.sin(x * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

let instances = 0;

function svg(name, attrs = {}, parent) {
  const node = document.createElementNS(NS, name);
  for (const key in attrs) node.setAttribute(key, attrs[key]);
  parent?.appendChild(node);
  return node;
}

/** Sets an attribute only when its value changes. */
function set(node, name, value) {
  const v = typeof value === "number" ? String(Math.round(value * 1000) / 1000) : value;
  node.__attrs ??= {};
  if (node.__attrs[name] === v) return;
  node.__attrs[name] = v;
  node.setAttribute(name, v);
}

function glitchFilter(defs, id, region) {
  const filter = svg("filter", { id, "color-interpolation-filters": "sRGB", ...region }, defs);
  const turbulence = svg("feTurbulence", { type: "fractalNoise", baseFrequency: "0 .18", numOctaves: 1, seed: 7, result: "bands" }, filter);
  const transfer = svg("feComponentTransfer", { in: "bands", result: "horizontal" }, filter);
  svg("feFuncG", { type: "table", tableValues: ".5 .5" }, transfer);
  const displace = svg("feDisplacementMap", { in: "SourceGraphic", in2: "horizontal", scale: 0, xChannelSelector: "R", yChannelSelector: "G" }, filter);
  return { id, filter, turbulence, displace };
}

export class ReelTitle {
  /**
   * @param {HTMLElement} host
   * @param {{ rows?: string[], editable?: boolean, autoplay?: boolean, typos?: boolean, label?: string }} [options]
   */
  constructor(host, options = {}) {
    this.host = host;
    this.options = { rows: ["SPELLING", "RESTORED"], editable: true, autoplay: true, typos: true, ...options };
    this.id = `uifx-reel-${++instances}`;
    this.target = this.options.rows.map((r) => r.toUpperCase());
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.anims = new Map();
    this.frame = 0;
    this.last = 0;
    this.epoch = 0;
    this.undoStack = [];
    this.redoStack = [];
    this.playing = false;
    this.lens = { x: PAD - INSET, y: TOP, w: CELL + 2 * INSET, opacity: 0, flash: 0, tick: 0, grip: 0, red: 0, bump: 0, track: false };
    this.build();
    const intro = this.options.autoplay && this.options.typos && !this.reduced;
    this.load(intro ? makeTypos(this.target).model : createModel(this.target));
    if (intro) this.play();
    else if (this.options.editable) this.host.setAttribute("data-editing", "");
  }

  build() {
    const cols = Math.max(...this.target.map((r) => r.length));
    this.width = PAD * 2 + cols * CELL;
    this.height = TOP * 2 + CELL_H + (this.target.length - 1) * ROW_GAP;
    this.host.classList.add("uifx-reel");

    const root = svg("svg", { viewBox: `0 0 ${this.width} ${this.height}`, class: "uifx-reel-scene", "aria-hidden": "true" });
    const defs = svg("defs", {}, root);
    const vblur = svg("filter", { id: `${this.id}-vblur`, x: "-20%", y: "-5%", width: "140%", height: "110%" }, defs);
    svg("feGaussianBlur", { stdDeviation: `0 ${FACE * 0.035}` }, vblur);
    const hblur = svg("filter", { id: `${this.id}-hblur`, x: "-5%", y: "-5%", width: "110%", height: "110%" }, defs);
    svg("feGaussianBlur", { stdDeviation: "2.2 0" }, hblur);
    this.sceneGlitch = glitchFilter(defs, `${this.id}-scene`, { x: "-2%", y: "0%", width: "104%", height: "100%" });

    const clip = svg("clipPath", { id: `${this.id}-lens-clip` }, defs);
    this.lensClip = svg("rect", { rx: 2 }, clip);
    const hole = svg("mask", { id: `${this.id}-hole`, maskUnits: "userSpaceOnUse", x: -50, y: -50, width: this.width + 100, height: this.height + 100 }, defs);
    svg("rect", { x: -50, y: -50, width: this.width + 100, height: this.height + 100, fill: "white" }, hole);
    this.lensHole = svg("rect", { rx: 2, fill: "black" }, hole);

    this.scene = svg("g", {}, root);
    const base = svg("g", { mask: `url(#${this.id}-hole)` }, this.scene);
    this.letters = svg("g", { id: `${this.id}-letters`, class: "uifx-reel-letters" }, base);
    this.rowGroups = this.target.map((_, r) => {
      const glitch = glitchFilter(defs, `${this.id}-row-${r}`, { x: "-2%", y: "0%", width: "104%", height: "100%" });
      const group = svg("g", { transform: `translate(0 ${TOP + r * ROW_GAP})` }, this.letters);
      return { group, glitch };
    });

    const lens = svg("g", { class: "uifx-reel-lens" }, this.scene);
    this.lensGlass = svg("rect", { rx: 2, class: "uifx-reel-lens-glass" }, lens);
    const view = svg("g", { "clip-path": `url(#${this.id}-lens-clip)` }, lens);
    this.lensUses = [
      { node: svg("use", { href: `#${this.id}-letters`, class: "uifx-reel-fringe-red" }, view), scale: MAGNIFY + 0.025 },
      { node: svg("use", { href: `#${this.id}-letters`, class: "uifx-reel-fringe-cyan" }, view), scale: MAGNIFY - 0.025 },
      { node: svg("use", { href: `#${this.id}-letters` }, view), scale: MAGNIFY },
    ];
    this.lensRim = svg("rect", { rx: 2, class: "uifx-reel-lens-rim" }, lens);

    this.hits = this.target.map((_, r) =>
      svg("rect", { class: "uifx-reel-hit", x: PAD - INSET, y: TOP + r * ROW_GAP, width: (cols + 1) * CELL + INSET, height: CELL_H, "data-row": r }, root),
    );

    this.input = document.createElement("textarea");
    this.input.className = "uifx-reel-input";
    this.input.rows = 1;
    this.input.setAttribute("autocapitalize", "characters");
    this.input.setAttribute("autocomplete", "off");
    this.input.setAttribute("autocorrect", "off");
    this.input.spellcheck = false;
    this.text = document.createElement("span");
    this.text.className = "uifx-reel-text";

    this.root = root;
    this.host.append(root, this.input, this.text);
    this.cells = this.target.map(() => []);

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onDoubleClick = this.onDoubleClick.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onInput = this.onInput.bind(this);
    this.onBlur = this.onBlur.bind(this);
    root.addEventListener("pointerdown", this.onPointerDown);
    root.addEventListener("pointermove", this.onPointerMove);
    root.addEventListener("pointerup", this.onPointerUp);
    root.addEventListener("pointercancel", this.onPointerUp);
    root.addEventListener("dblclick", this.onDoubleClick);
    this.input.addEventListener("keydown", this.onKeyDown);
    this.input.addEventListener("input", this.onInput);
    this.input.addEventListener("blur", this.onBlur);
  }

  destroy() {
    this.epoch++;
    cancelAnimationFrame(this.frame);
    for (const anim of this.anims.values()) anim.resolve(false);
    this.anims.clear();
    this.root.remove();
    this.input.remove();
    this.text.remove();
    this.host.classList.remove("uifx-reel");
    this.host.removeAttribute("data-editing");
  }

  // Cells: one per letter, a nested <svg> that clips a reel of faces.

  load(model) {
    this.model = model;
    this.cells.forEach((row) => row.forEach((c) => c.node.remove()));
    this.cells = model.rows.map((row, r) => row.map((l) => this.makeCell(l, r)));
    this.updateText();
    this.kick();
  }

  makeCell(letter, r, before) {
    const node = svg("svg", { class: "uifx-reel-cell", height: CELL_H });
    this.rowGroups[r].group.insertBefore(node, before?.node ?? null);
    const wash = svg("rect", { class: "uifx-reel-wash", width: CELL, height: CELL_H, opacity: 0 }, node);
    const glyph = svg("g", { class: "uifx-reel-glyph" }, node);
    const sharp = svg("g", {}, glyph);
    const blurred = svg("g", { filter: `url(#${this.id}-vblur)`, opacity: 0 }, glyph);
    const cell = { id: letter.id, ch: letter.ch, row: r, w: CELL, pos: 0, blur: 0, sx: 0, sy: 0, rot: 0, red: 0, wash: 0, hidden: false, removing: false, glitch: null, node, washNode: wash, glyph, sharp, blurred };
    this.setFaces(cell, [letter.ch]);
    return cell;
  }

  setFaces(cell, faces) {
    for (const group of [cell.sharp, cell.blurred]) {
      group.replaceChildren(...faces.map((face, i) => {
        const text = svg("text", { y: BASELINE + i * FACE, "text-anchor": "middle" });
        text.textContent = face;
        return text;
      }));
    }
    cell.faces = faces;
  }

  cellById(id) {
    for (const row of this.cells) for (const c of row) if (c.id === id && !c.removing) return c;
    return null;
  }

  cellLeft(cell) {
    let x = PAD;
    for (const c of this.cells[cell.row]) {
      if (c === cell) return x;
      x += c.w;
    }
    return x;
  }

  // Animation: keyed tweens driven by one requestAnimationFrame loop.

  animate(key, duration, step) {
    this.anims.get(key)?.resolve(false);
    this.anims.delete(key);
    if (this.reduced || duration <= 0) {
      step(1, duration);
      this.kick();
      return Promise.resolve(true);
    }
    return new Promise((resolve) => {
      const anim = { start: null, duration, step, resolve: (done) => { this.anims.delete(key); resolve(done); } };
      this.anims.set(key, anim);
      this.kick();
    });
  }

  wait(ms) {
    return this.animate(`wait-${Math.random()}`, ms, () => {});
  }

  kick() {
    if (!this.frame) this.frame = requestAnimationFrame((now) => this.tick(now));
  }

  tick(now) {
    this.frame = 0;
    const dt = this.last ? Math.min(64, now - this.last) : 16;
    this.last = now;
    for (const anim of [...this.anims.values()]) {
      anim.start ??= now;
      const elapsed = now - anim.start;
      const t = clamp01(elapsed / anim.duration);
      anim.step(t, elapsed);
      if (t >= 1) anim.resolve(true);
    }
    const moving = this.trackLens(dt);
    this.render();
    if (this.anims.size || moving) this.kick();
    else this.last = 0;
  }

  render() {
    for (const row of this.cells) {
      let x = PAD;
      for (const c of row) {
        set(c.node, "x", x);
        set(c.node, "width", Math.max(0, c.w));
        x += c.w;
        set(c.glyph, "transform", `translate(${CELL / 2 + c.sx} ${c.sy}) rotate(${c.rot})`);
        set(c.glyph, "opacity", c.hidden ? 0 : 1);
        set(c.glyph, "filter", c.glitch ? `url(#${c.glitch.id})` : "none");
        const shift = `translate(0 ${-c.pos * FACE})`;
        set(c.sharp, "transform", shift);
        set(c.blurred, "transform", shift);
        set(c.sharp, "opacity", 1 - c.blur);
        set(c.blurred, "opacity", c.blur);
        set(c.washNode, "opacity", c.wash);
        set(c.node, "class", c.red > 0 ? "uifx-reel-cell is-removing" : "uifx-reel-cell");
      }
    }
    const L = this.lens;
    const x = L.x + L.bump + INSET - 5;
    const w = Math.max(0, L.w - 2 * (INSET - 5));
    for (const rect of [this.lensGlass, this.lensRim, this.lensClip, this.lensHole]) {
      set(rect, "x", x);
      set(rect, "y", L.y + 2);
      set(rect, "width", w);
      set(rect, "height", CELL_H - 4);
    }
    set(this.lensHole, "fill-opacity", L.opacity);
    set(this.lensGlass, "fill-opacity", (0.05 + 0.03 * L.tick + 0.07 * L.flash + 0.03 * L.grip) * L.opacity);
    set(this.lensRim, "stroke-opacity", (0.22 + 0.18 * L.grip + 0.12 * L.tick + 0.32 * L.flash) * L.opacity);
    set(this.lensRim, "class", L.red > 0 ? "uifx-reel-lens-rim is-removing" : "uifx-reel-lens-rim");
    const cx = x + w / 2;
    const cy = L.y + CELL_H / 2;
    for (const { node, scale } of this.lensUses) {
      set(node, "transform", `translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`);
      set(node, "opacity", L.opacity);
    }
  }

  // The lens follows the selection while editing; the intro moves it by script.

  selectionRect() {
    const range = selectedRange(this.model);
    if (!range) return null;
    const length = this.model.rows[range.row].length;
    const span = range.end > range.start ? (range.end - range.start) * CELL : length < this.model.maxCols ? CELL : 0;
    return { x: PAD + range.start * CELL - INSET, y: TOP + range.row * ROW_GAP, w: span + 2 * INSET };
  }

  trackLens(dt) {
    const L = this.lens;
    if (!L.track) return false;
    const goal = this.selectionRect();
    const k = 1 - Math.exp(-dt / 35);
    const fade = 1 - Math.exp(-dt / 60);
    let moving = false;
    if (goal) {
      if (L.opacity < 0.01) Object.assign(L, { x: goal.x, y: goal.y, w: goal.w });
      for (const key of ["x", "y", "w"]) {
        const d = goal[key] - L[key];
        L[key] = Math.abs(d) < 0.05 ? goal[key] : L[key] + d * k;
        moving ||= Math.abs(d) >= 0.05;
      }
    }
    const opacity = goal ? 1 : 0;
    const d = opacity - L.opacity;
    L.opacity = Math.abs(d) < 0.01 ? opacity : L.opacity + d * fade;
    return moving || Math.abs(d) >= 0.01;
  }

  async hopLens(to) {
    const L = this.lens;
    const points = [];
    if (Math.abs(to.y - L.y) > 0.01) points.push({ x: L.x, y: to.y });
    let x = L.x;
    while (Math.abs(to.x - x) > 0.01) {
      x += Math.sign(to.x - x) * Math.min(CELL, Math.abs(to.x - x));
      points.push({ x, y: to.y });
    }
    let index = 0;
    for (const p of points) {
      const from = { x: L.x, y: L.y };
      const duration = 80 + noise(p.x * 3 + p.y + index++ * 17) * 65;
      const ok = await this.animate("lens", duration, (t) => {
        const e = easeOutCubic(clamp01(t / 0.57));
        L.x = from.x + (p.x - from.x) * e;
        L.y = from.y + (p.y - from.y) * e;
        L.tick = (1 - t) ** 2;
      });
      if (!ok) return false;
    }
    L.tick = 0;
    return true;
  }

  lensWidth(w, duration) {
    const L = this.lens;
    const from = L.w;
    return this.animate("lens-w", duration, (t) => (L.w = from + (w - from) * easeOutCubic(t)));
  }

  flashLens(show) {
    const L = this.lens;
    return this.animate("lens-fade", show ? 300 : 260, (t, ms) => {
      L.opacity = show ? clamp01(ms / 40) : 1 - clamp01(ms / 130);
      L.flash = Math.exp(-ms / (show ? 130 : 80));
      if (t >= 1) L.flash = 0;
    });
  }

  bumpLens(dx, dy) {
    const L = this.lens;
    const keys = [0, 4, -2.5, 1, 0];
    const dir = dx || dy;
    return this.animate("lens-bump", 200, (t) => {
      const f = t * (keys.length - 1);
      const i = Math.min(keys.length - 2, Math.floor(f));
      L.bump = (keys[i] + (keys[i + 1] - keys[i]) * easeInOutCubic(f - i)) * dir;
    });
  }

  // Letter animations.

  roll(cell, faces, { mistake = false, tempo = 1, reverse = false } = {}) {
    if (faces.length < 2) return Promise.resolve(true);
    const list = reverse ? [...faces].reverse() : faces;
    const n = list.length - 1;
    const from = reverse ? n : 0;
    const to = reverse ? 0 : n;
    const token = (cell.rollToken = {});
    cell.ch = faces.at(-1);
    this.setFaces(cell, list);
    const duration = (mistake ? 900 : 300 + 45 * n) / tempo;
    let previous = from;
    let previousMs = 0;
    const position = (ms) => {
      if (!mistake) return from + (to - from) * easeInOutCubic(clamp01(ms / duration));
      if (ms < 260) return easeOutQuint(ms / 260) * (n - 1);
      if (ms < 450) return n - 1;
      return n - 1 + easeInOutCubic(clamp01((ms - 450) / (duration - 450)));
    };
    return this.animate(`roll-${cell.id}`, duration, (t, ms) => {
      cell.pos = position(ms);
      const speed = Math.abs(cell.pos - previous) / Math.max(1, ms - previousMs) * 1000;
      cell.blur = t >= 1 ? 0 : clamp01((speed * 1.2 - 4) / 20);
      previous = cell.pos;
      previousMs = ms;
      if (t >= 1) {
        this.setFaces(cell, [cell.ch]);
        cell.pos = 0;
      }
    }).then((done) => {
      if (!done && cell.rollToken === token) {
        this.setFaces(cell, [cell.ch]);
        Object.assign(cell, { pos: 0, blur: 0 });
      }
      return done;
    });
  }

  /** Marks a letter red, shakes it, then collapses its cell. */
  remove(cell, { follow = false } = {}) {
    cell.removing = true;
    const defs = this.root.querySelector("defs");
    cell.glitch = glitchFilter(defs, `${this.id}-cell-${cell.id}`, { x: "-30%", y: "0%", width: "160%", height: "100%" });
    const L = this.lens;
    const left = this.cellLeft(cell);
    return this.animate(`remove-${cell.id}`, 860, (t, ms) => {
      const n = ms / 1000;
      const erase = easeOutQuint(clamp01((ms - 480) / 380));
      const amount = Math.min(1, n / 0.014) * (0.65 + 0.35 * Math.exp(-n / 0.18)) * (1 - erase * 0.3);
      cell.sx = (4.8 * Math.sin(n * 89) + 1.4 * Math.sin(n * 197)) * amount;
      cell.sy = 2.2 * Math.sin(n * 131) * amount;
      cell.rot = 3.5 * Math.sin(n * 71) * amount;
      cell.red = t < 1 ? 1 : 0;
      cell.wash = 0.12 * Math.max(0, 1 - n / 0.55) ** 2;
      cell.w = CELL * (1 - erase);
      set(cell.glitch.displace, "scale", (5 + 3 * (0.5 + 0.5 * Math.sin(n * 93))) * amount);
      set(cell.glitch.turbulence, "seed", 7 + (Math.floor(n / 0.042) % 37));
      if (follow) {
        L.x = left - INSET + cell.sx * 0.6;
        L.w = cell.w + 2 * INSET;
        L.red = t < 1 ? 1 : 0;
      }
    }).then((done) => {
      cell.glitch.filter.remove();
      cell.node.remove();
      const row = this.cells[cell.row];
      if (row.includes(cell)) row.splice(row.indexOf(cell), 1);
      if (follow) L.red = 0;
      this.kick();
      return done;
    });
  }

  insert(letter, r, index) {
    const row = this.cells[r];
    const before = row.filter((c) => !c.removing)[index];
    const cell = this.makeCell(letter, r, before);
    row.splice(before ? row.indexOf(before) : row.length, 0, cell);
    cell.w = 0;
    this.animate(`grow-${cell.id}`, 160, (t) => (cell.w = CELL * easeOutCubic(t)));
    this.roll(cell, wheel(CHARSET[Math.floor(Math.random() * CHARSET.length)], letter.ch));
  }

  /** Turns the letters `ids` like a conveyor belt by `by` cells (positive: to the left). */
  belt(r, ids, chars, by) {
    const cells = ids.map((id) => this.cellById(id));
    const n = cells.length;
    const left = this.cellLeft(cells[0]);
    const defs = this.root.querySelector("defs");
    const glitch = glitchFilter(defs, `${this.id}-belt-${r}`, { x: "-2%", y: "0%", width: "104%", height: "100%" });
    const node = svg("svg", { class: "uifx-reel-cell", x: left, width: n * CELL, height: CELL_H }, this.rowGroups[r].group);
    const body = svg("g", { filter: `url(#${glitch.id})` }, node);
    const strip = (parent) => {
      for (let k = -1; k <= 2; k++)
        chars.forEach((ch, i) => {
          const text = svg("text", { x: (k * n + i + 0.5) * CELL, y: BASELINE, "text-anchor": "middle" }, parent);
          text.textContent = ch;
        });
      return parent;
    };
    const sharp = strip(svg("g", {}, body));
    const blurred = strip(svg("g", { filter: `url(#${this.id}-hblur)`, opacity: 0 }, body));
    const token = {};
    this.belts ??= {};
    this.belts[r] = token;
    cells.forEach((c) => (c.hidden = true));
    let previous = 0;
    let previousMs = 0;
    return this.animate(`belt-${r}`, 420, (t, ms) => {
      const pos = by * easeOutBack(t);
      const wrapped = ((pos % n) + n) % n;
      const shift = `translate(${-wrapped * CELL} 0)`;
      set(sharp, "transform", shift);
      set(blurred, "transform", shift);
      const speed = (Math.abs(pos - previous) / Math.max(1, ms - previousMs)) * 1000;
      previous = pos;
      previousMs = ms;
      const blur = t >= 1 ? 0 : clamp01((speed - 1) / 10);
      set(sharp, "opacity", 1 - blur);
      set(blurred, "opacity", blur);
      set(glitch.displace, "scale", ms < 330 ? 2.8 * (1 - ms / 330) : 0);
      set(glitch.turbulence, "seed", 17 + Math.floor(Math.min(ms, 330) / 40));
    }).then((done) => {
      if (this.belts[r] === token)
        cells.forEach((c, i) => {
          c.ch = chars[(((i + by) % n) + n) % n];
          this.setFaces(c, [c.ch]);
          c.hidden = false;
        });
      node.remove();
      glitch.filter.remove();
      this.kick();
      return done;
    });
  }

  glitchRow(r) {
    const { glitch } = this.rowGroups[r];
    const group = this.rowGroups[r].group;
    set(group, "filter", `url(#${glitch.id})`);
    return this.animate(`row-${r}`, 260, (t) => {
      set(glitch.displace, "scale", t < 1 ? 4.5 * Math.sin(Math.PI * t) * (1 - 0.35 * t) : 0);
      set(glitch.turbulence, "seed", 41 + r * 7 + Math.floor(t * 4));
      if (t >= 1) set(group, "filter", "none");
    });
  }

  // The intro script.

  async play() {
    const epoch = ++this.epoch;
    const alive = () => epoch === this.epoch;
    const { model, ops } = makeTypos(this.target);
    this.playing = true;
    this.host.removeAttribute("data-editing");
    this.lens.track = false;
    this.load(model);
    if (!(await this.wait(400)) || !alive()) return;

    // Each step runs only while this intro is still the current one.
    const step = async (run) => alive() && (await run()) && alive();
    const lensW = (cells) => cells * CELL + 2 * INSET;

    let first = true;
    for (const op of ops) {
      const cell = this.cellById(op.type === "rotate" ? op.ids[0] : op.id);
      const goal = { x: this.cellLeft(cell) - INSET, y: TOP + op.row * ROW_GAP };
      if (first) {
        Object.assign(this.lens, goal, { w: lensW(1) });
        if (!(await step(() => this.flashLens(true)))) return;
        first = false;
      } else if (!(await step(() => this.hopLens(goal)))) return;
      if (!(await step(() => this.wait(90)))) return;

      if (op.type === "sub") {
        const tempo = 0.8 + noise(op.id) * 0.3;
        if (!(await step(() => this.roll(cell, op.wheel, { mistake: op.mistake, tempo })))) return;
      }
      if (op.type === "del") {
        if (!(await step(() => this.wait(60)))) return;
        if (!(await step(() => this.remove(cell, { follow: true })))) return;
        if (!(await step(() => this.lensWidth(lensW(1), 140)))) return;
      }
      if (op.type === "rotate") {
        this.lens.grip = 1;
        if (!(await step(() => this.lensWidth(lensW(op.ids.length), 160)))) return;
        if (!(await step(() => this.wait(120)))) return;
        const chars = op.ids.map((i) => this.cellById(i).ch);
        if (!(await step(() => this.belt(op.row, op.ids, chars, op.by)))) return;
        if (!(await step(() => this.wait(140)))) return;
        this.lens.grip = 0;
        if (!(await step(() => this.lensWidth(lensW(1), 160)))) return;
      }
      if (!(await step(() => this.wait(op.type === "sub" ? 380 : 200)))) return;
    }

    if (!(await step(() => this.wait(260)))) return;
    if (!(await step(() => this.flashLens(false)))) return;
    for (let r = 0; r < this.target.length; r++) {
      if (!(await step(() => this.wait(r ? 100 : 70)))) return;
      this.glitchRow(r);
    }
    if (await step(() => this.wait(300))) this.finish();
  }

  /** Ends the intro (or skips it) and makes the title editable. */
  finish() {
    this.epoch++;
    for (const anim of [...this.anims.values()]) anim.resolve(false);
    this.anims.clear();
    this.rowGroups.forEach(({ group }) => set(group, "filter", "none"));
    this.playing = false;
    Object.assign(this.lens, { opacity: 0, flash: 0, tick: 0, grip: 0, red: 0, bump: 0, track: true });
    this.load(createModel(this.target));
    this.undoStack = [];
    this.redoStack = [];
    if (this.options.editable) this.host.setAttribute("data-editing", "");
  }

  /** Rewinds to the typos (a short tape glitch) and plays the intro again. */
  async replay() {
    if (this.reduced) return;
    const epoch = ++this.epoch;
    for (const anim of [...this.anims.values()]) anim.resolve(false);
    this.playing = true;
    this.input.blur();
    this.lens.track = false;
    this.lens.opacity = 0;
    set(this.scene, "filter", `url(#${this.sceneGlitch.id})`);
    let swapped = false;
    await this.animate("rewind", 520, (t, ms) => {
      set(this.sceneGlitch.displace, "scale", 16 * Math.sin(Math.PI * t));
      set(this.sceneGlitch.turbulence, "seed", 3 + Math.floor(ms / 40));
      if (t >= 0.5 && !swapped) {
        swapped = true;
        this.load(makeTypos(this.target).model);
      }
    });
    set(this.scene, "filter", "none");
    if (epoch === this.epoch) this.play();
  }

  // Editing.

  commit(next, { record = true, rotateBy = 0 } = {}) {
    const previous = this.model;
    if (next === previous) return;
    if (record && next.rows !== previous.rows) {
      this.undoStack = [...this.undoStack, previous].slice(-64);
      this.redoStack = [];
    }
    this.model = next;
    if (next.rows !== previous.rows) this.sync(previous, next, rotateBy);
    this.updateText();
    this.kick();
  }

  sync(previous, next, rotateBy) {
    next.rows.forEach((row, r) => {
      if (row === previous.rows[r]) return;
      if (rotateBy) {
        const range = selectedRange(next);
        const ids = row.slice(range.start, range.end).map((l) => l.id);
        const chars = previous.rows[r].slice(range.start, range.end).map((l) => l.ch);
        this.belt(r, ids, chars, rotateBy);
        return;
      }
      const ids = new Map(row.map((l) => [l.id, l]));
      for (const cell of [...this.cells[r]]) {
        if (cell.removing) continue;
        const letter = ids.get(cell.id);
        if (!letter) this.remove(cell);
        else if (letter.ch !== cell.ch)
          this.roll(cell, this.cycling ? [cell.ch, letter.ch] : wheel(cell.ch, letter.ch), { reverse: this.cycling < 0 });
      }
      row.forEach((letter, index) => {
        if (!this.cellById(letter.id)) this.insert(letter, r, index);
      });
    });
  }

  updateText() {
    const text = modelText(this.model).join(" ");
    this.text.textContent = text;
    this.input.setAttribute("aria-label", `Edit title: ${text}`);
    this.host.dispatchEvent(new CustomEvent("reelchange", { detail: { rows: modelText(this.model) } }));
  }

  hitIndex(event) {
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(this.root.getScreenCTM().inverse());
    const r = Number(event.target.getAttribute?.("data-row"));
    return { row: r, index: Math.floor((point.x - PAD) / CELL) };
  }

  onPointerDown(event) {
    if (this.playing) {
      this.finish();
      return;
    }
    if (!this.options.editable || !event.target.classList.contains("uifx-reel-hit")) return;
    event.preventDefault();
    const { row, index } = this.hitIndex(event);
    this.dragging = { row };
    this.root.setPointerCapture(event.pointerId);
    this.lens.track = true;
    this.commit(select(this.model, row, index, event.shiftKey), { record: false });
    this.input.focus({ preventScroll: true });
  }

  onPointerMove(event) {
    if (!this.dragging) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(this.root.getScreenCTM().inverse());
    this.commit(select(this.model, this.dragging.row, Math.floor((point.x - PAD) / CELL), true), { record: false });
  }

  onPointerUp() {
    this.dragging = null;
  }

  onDoubleClick(event) {
    if (!event.target.classList.contains("uifx-reel-hit")) this.replay();
  }

  onBlur() {
    if (this.model.selection) this.commit({ ...this.model, selection: null }, { record: false });
  }

  onInput() {
    const text = this.input.value.replace(/[\r\n]/g, "");
    this.input.value = "";
    if (text) this.commit(typeText(this.model, text));
  }

  onKeyDown(event) {
    if (event.isComposing) return;
    const key = event.key;
    const command = event.metaKey || event.ctrlKey;
    if (command && key.toLowerCase() === "z") {
      event.preventDefault();
      this.history(event.shiftKey);
      return;
    }
    if (command && key.toLowerCase() === "a") {
      event.preventDefault();
      const row = this.model.selection?.row ?? 0;
      const last = Math.max(0, this.model.rows[row].length - 1);
      this.commit({ ...this.model, selection: { row, anchor: 0, head: last } }, { record: false });
      return;
    }
    if (command || key === "Tab") return;
    if (key === "Escape") {
      event.preventDefault();
      this.input.blur();
      return;
    }
    if (key === "Enter") {
      event.preventDefault();
      return;
    }
    if (key === "Backspace" || key === "Delete") {
      event.preventDefault();
      this.commit(erase(this.model, key === "Backspace"));
      return;
    }
    if (key === "Home" || key === "End") {
      event.preventDefault();
      const row = this.model.selection?.row ?? 0;
      this.commit(select(this.model, row, key === "Home" ? 0 : this.model.rows[row].length, event.shiftKey), { record: false });
      return;
    }
    if (!key.startsWith("Arrow")) return;
    event.preventDefault();
    const dx = key === "ArrowLeft" ? -1 : key === "ArrowRight" ? 1 : 0;
    const dy = key === "ArrowUp" ? -1 : key === "ArrowDown" ? 1 : 0;
    if (event.altKey && dy) {
      this.cycling = -dy;
      this.commit(cycle(this.model, -dy));
      this.cycling = 0;
      return;
    }
    if (event.altKey && dx) {
      const next = rotate(this.model, -dx);
      if (next !== this.model) this.commit(next, { rotateBy: -dx });
      return;
    }
    const next = move(this.model, dx, dy, event.shiftKey);
    const a = this.model.selection;
    const b = next.selection;
    if (a && a.row === b.row && a.head === b.head && a.anchor === b.anchor) this.bumpLens(dx, dy);
    else this.commit(next, { record: false });
  }

  history(redo) {
    const from = redo ? this.redoStack : this.undoStack;
    const to = redo ? this.undoStack : this.redoStack;
    const model = from.pop();
    if (!model) return;
    to.push(this.model);
    this.commit({ ...model, nextId: Math.max(model.nextId, this.model.nextId) }, { record: false });
  }
}
