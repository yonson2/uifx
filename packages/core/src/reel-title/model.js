// Pure edit model of the reel title: rows of letters with stable ids, and a selection.
// The engine (reel-title.js) animates the difference between two models.

export const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#?$&";

/**
 * @typedef {{ id: number, ch: string }} Letter
 * @typedef {{ row: number, anchor: number, head: number }} Selection
 * @typedef {{ rows: Letter[][], selection: Selection | null, nextId: number, maxCols: number }} Model
 */

/** @returns {Model} */
export function createModel(rows, maxCols = Math.max(...rows.map((r) => r.length)) + 1) {
  let id = 0;
  return {
    rows: rows.map((r) => Array.from(r.toUpperCase(), (ch) => ({ id: id++, ch }))),
    selection: null,
    nextId: id,
    maxCols,
  };
}

export function modelText(model) {
  return model.rows.map((r) => r.map((l) => l.ch).join(""));
}

/** The selected letters as [start, end) of one row; start === end is a caret. */
export function selectedRange(model) {
  const s = model.selection;
  if (!s) return null;
  return {
    row: s.row,
    start: Math.min(s.anchor, s.head),
    end: Math.min(model.rows[s.row].length, Math.max(s.anchor, s.head) + 1),
  };
}

export function select(model, row, index, extend = false) {
  const last = Math.min(model.rows[row].length, model.maxCols - 1);
  const head = Math.max(0, Math.min(last, index));
  const anchor = extend && model.selection?.row === row ? Math.min(last, model.selection.anchor) : head;
  return { ...model, selection: { row, anchor, head } };
}

export function move(model, dx, dy, extend = false) {
  const s = model.selection ?? { row: 0, anchor: 0, head: 0 };
  const row = Math.max(0, Math.min(model.rows.length - 1, s.row + dy));
  return select(model, row, s.head + dx, extend);
}

/** Types over the selection. Overwritten letters keep their ids, so they roll. */
export function typeText(model, text) {
  const range = selectedRange(model);
  if (!range) return model;
  const row = model.rows[range.row];
  const room = model.maxCols - row.length + range.end - range.start;
  const chars = Array.from(text.toUpperCase())
    .filter((ch) => !/[\u0000-\u001f\u007f]/.test(ch))
    .slice(0, room);
  if (!chars.length) return model;
  let nextId = model.nextId;
  const typed = chars.map((ch, i) => ({
    id: i < range.end - range.start ? row[range.start + i].id : nextId++,
    ch,
  }));
  const rows = [...model.rows];
  rows[range.row] = [...row.slice(0, range.start), ...typed, ...row.slice(range.end)];
  const caret = range.start + typed.length;
  const wrap = caret >= model.maxCols;
  const nextRow = wrap ? (range.row + 1) % rows.length : range.row;
  const head = wrap ? 0 : caret;
  return { ...model, rows, nextId, selection: { row: nextRow, anchor: head, head } };
}

/** Deletes the selection; at a caret, Backspace deletes the letter before it. */
export function erase(model, backward) {
  const range = selectedRange(model);
  if (!range) return model;
  let { start, end } = range;
  if (start === end && backward && start > 0) start--;
  if (start === end) return model;
  const rows = [...model.rows];
  rows[range.row] = [...rows[range.row].slice(0, start), ...rows[range.row].slice(end)];
  const head = Math.max(0, start - 1);
  return { ...model, rows, selection: { row: range.row, anchor: head, head } };
}

/** Steps each selected letter through CHARSET. */
export function cycle(model, delta) {
  const range = selectedRange(model);
  if (!range || range.start === range.end) return model;
  const n = CHARSET.length;
  const rows = [...model.rows];
  rows[range.row] = rows[range.row].map((l, i) => {
    if (i < range.start || i >= range.end) return l;
    const at = Math.max(0, CHARSET.indexOf(l.ch));
    return { ...l, ch: CHARSET[(((at + delta) % n) + n) % n] };
  });
  return { ...model, rows };
}

/** Rotates the selected letters like a conveyor: delta 1 moves them one cell left. */
export function rotate(model, delta) {
  const range = selectedRange(model);
  if (!range || range.end - range.start < 2) return model;
  const chars = model.rows[range.row].slice(range.start, range.end).map((l) => l.ch);
  const n = chars.length;
  const by = ((delta % n) + n) % n;
  if (!by) return model;
  const rows = [...model.rows];
  rows[range.row] = rows[range.row].map((l, i) =>
    i < range.start || i >= range.end ? l : { ...l, ch: chars[(i - range.start + by) % n] },
  );
  return { ...model, rows };
}

/** The faces a reel shows on its way from one letter to another. */
export function wheel(from, to) {
  if (from === to) return [to];
  const at = Math.max(0, CHARSET.indexOf(from));
  return [from, ...[1, 2, 3].map((k) => CHARSET[(at + k * 7) % CHARSET.length]), to];
}

// Typos for the intro: a few letters swapped for lookalikes, one extra letter per row,
// and one swapped pair in the last row. The intro fixes them one by one.

const LOOKALIKE = { O: "0", E: "3", A: "4", I: "1", L: "1", S: "5", B: "8", G: "6", T: "7", Z: "2", D: "0", Q: "0" };
const NEAR = { E: "F", F: "E", O: "Q", Q: "O", P: "R", R: "P", C: "G", G: "C", B: "R", H: "N", N: "H", M: "N", U: "V", V: "U", I: "J", J: "I", K: "X", X: "K", T: "Y", Y: "T", D: "B", S: "5", A: "R", L: "I", W: "V", Z: "7" };
const JUNK = "#&$?";

export function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashText(text) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

/**
 * Builds the typo start state and the steps that fix it.
 * @returns {{ model: Model, ops: Array<
 *   { type: "sub", row: number, id: number, wheel: string[], mistake: boolean } |
 *   { type: "del", row: number, id: number } |
 *   { type: "rotate", row: number, ids: number[], by: number }> }}
 */
export function makeTypos(rows, seed = hashText(rows.join("\n"))) {
  const random = seededRandom(seed);
  const pick = (list) => list[Math.floor(random() * list.length)];
  const target = rows.map((r) => r.toUpperCase());
  const maxCols = Math.max(...target.map((r) => r.length)) + 1;
  let nextId = 0;
  let mistakeLeft = true;
  const ops = [];
  const typoRows = target.map((text, row) => {
    const letters = Array.from(text, (ch) => ({ id: nextId++, ch }));
    const isLetter = (i) => i >= 0 && i < letters.length && /[A-Z0-9]/.test(letters[i].ch);
    const taken = new Set();
    const free = (...ix) => ix.every((i) => isLetter(i) && !taken.has(i));
    const claim = (...ix) => ix.forEach((i) => taken.add(i));
    const rowOps = [];

    if (row === target.length - 1 && letters.length >= 5) {
      const spots = [];
      for (let i = 1; i + 1 < letters.length; i++)
        if (free(i, i + 1) && letters[i].ch !== letters[i + 1].ch) spots.push(i);
      if (spots.length) {
        const i = pick(spots);
        rowOps.push({ at: i, op: { type: "rotate", row, ids: [letters[i].id, letters[i + 1].id], by: 1 } });
        [letters[i].ch, letters[i + 1].ch] = [letters[i + 1].ch, letters[i].ch];
        claim(i - 1, i, i + 1, i + 2);
      }
    }

    let insertAt = -1;
    let insertCh = "";
    if (letters.length >= 3) {
      const spots = [];
      for (let i = 2; i <= letters.length; i++) if (!taken.has(i - 1) && !taken.has(i)) spots.push(i);
      if (spots.length) {
        insertAt = pick(spots);
        insertCh = row % 2 === 0 ? letters[insertAt - 1].ch : pick(JUNK);
        claim(insertAt - 2, insertAt - 1, insertAt);
      }
    }

    const wanted = row === 0 ? 3 : 1;
    const spots = letters.map((_, i) => i).filter((i) => free(i));
    const lookalikes = spots.filter((i) => LOOKALIKE[letters[i].ch]);
    const order = [...lookalikes, ...spots.filter((i) => !LOOKALIKE[letters[i].ch])];
    let subs = 0;
    for (const i of order) {
      if (subs >= wanted) break;
      if (!free(i) || taken.has(i - 1) || taken.has(i + 1)) continue;
      const ch = letters[i].ch;
      const look = LOOKALIKE[ch];
      const from = look ?? pick(CHARSET.replace(ch, ""));
      const mistake = mistakeLeft && subs === 1;
      const steps = mistake
        ? [pick(CHARSET), pick(CHARSET), pick(CHARSET), NEAR[ch] ?? pick(CHARSET)]
        : look
          ? []
          : [pick(CHARSET), pick(CHARSET)];
      if (mistake) mistakeLeft = false;
      rowOps.push({ at: i, op: { type: "sub", row, id: letters[i].id, wheel: [from, ...steps, ch], mistake } });
      letters[i].ch = from;
      claim(i);
      subs++;
    }

    if (insertAt >= 0) {
      const extra = { id: nextId++, ch: insertCh };
      rowOps.push({ at: insertAt - 0.5, op: { type: "del", row, id: extra.id } });
      letters.splice(insertAt, 0, extra);
    }

    rowOps.sort((a, b) => a.at - b.at).forEach(({ op }) => ops.push(op));
    return letters;
  });
  return { model: { rows: typoRows, selection: null, nextId, maxCols }, ops };
}

/** Applies the intro steps without animation; used by tests and to skip the intro. */
export function applyOps(model, ops) {
  const rows = model.rows.map((r) => r.map((l) => ({ ...l })));
  for (const op of ops) {
    const row = rows[op.row];
    if (op.type === "sub") row.find((l) => l.id === op.id).ch = op.wheel.at(-1);
    if (op.type === "del") row.splice(row.findIndex((l) => l.id === op.id), 1);
    if (op.type === "rotate") {
      const cells = op.ids.map((id) => row.find((l) => l.id === id));
      const chars = cells.map((l) => l.ch);
      cells.forEach((l, i) => (l.ch = chars[(i + op.by) % chars.length]));
    }
  }
  return { ...model, rows };
}
