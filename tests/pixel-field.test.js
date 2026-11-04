import { describe, expect, test } from "vitest";
import { EFFECTS, EFFECT_NAMES } from "../packages/core/src/pixel-field/effects.js";
import { parseBitmap, textToBitmap } from "../packages/core/src/pixel-field/font.js";

describe("bitmaps", () => {
  test("textToBitmap scales 5x7 glyphs with a gap", () => {
    const { rows, width, height } = textToBitmap("AB", { scale: 2, gap: 1 });
    expect(width).toBe((5 + 1 + 5) * 2);
    expect(height).toBe(14);
    expect(rows.every((r) => r.length === width && /^[01]+$/.test(r))).toBe(true);
  });

  test("unknown characters are blank", () => {
    expect(textToBitmap("~").rows.join("")).not.toContain("1");
  });

  test("parseBitmap pads rows and reads # as ink", () => {
    expect(parseBitmap(["#.", "#"])).toEqual({ rows: ["10", "10"], width: 2, height: 2 });
  });
});

describe("entrance effects", () => {
  const { rows, width, height } = textToBitmap("FX");
  const cells = rows.flatMap((line, row) => [...line].flatMap((px, col) => (px === "1" ? [{ col, row, r1: Math.random(), r2: Math.random() }] : [])));

  test.each(EFFECT_NAMES)("%s settles every cell by its duration", (name) => {
    const effect = EFFECTS[name]({ width, height });
    for (const cell of cells) expect(effect.at(cell, effect.duration)).toEqual({ dx: 0, dy: 0, tone: null });
  });

  test.each(EFFECT_NAMES)("%s is still moving at the start", (name) => {
    const effect = EFFECTS[name]({ width, height });
    const settled = cells.filter((cell) => effect.at(cell, 0)?.tone === null);
    expect(settled.length).toBeLessThan(cells.length);
  });
});
