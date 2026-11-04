import { describe, expect, test } from "vitest";
import { applyOps, createModel, cycle, erase, makeTypos, modelText, rotate, select, typeText, wheel } from "../packages/core/src/reel-title/model.js";

const TITLES = [["SPELLING", "RESTORED"], ["OPENCODE", "RELOADED"], ["HI"], ["ABC", "DEFGH", "Z"], ["GLASS", "LENS", "TYPO"]];

describe("makeTypos", () => {
  test.each(TITLES)("fixing every typo gives the title back: %s", (...rows) => {
    const { model, ops } = makeTypos(rows);
    expect(modelText(applyOps(model, ops))).toEqual(rows);
  });

  test("is deterministic for the same text", () => {
    expect(makeTypos(["SPELLING", "RESTORED"])).toEqual(makeTypos(["SPELLING", "RESTORED"]));
  });

  test("puts typos in rows that are long enough", () => {
    const { model, ops } = makeTypos(["SPELLING", "RESTORED"]);
    const typed = modelText(model);
    expect(typed[0]).not.toBe("SPELLING");
    expect(typed[1]).not.toBe("RESTORED");
    expect(new Set(ops.map((op) => op.type))).toEqual(new Set(["sub", "del", "rotate"]));
  });
});

describe("editing", () => {
  const base = () => createModel(["ABC", "XYZ"]);

  test("typing overwrites the selected letter and keeps its id", () => {
    const before = select(base(), 0, 1);
    const after = typeText(before, "q");
    expect(modelText(after)).toEqual(["AQC", "XYZ"]);
    expect(after.rows[0][1].id).toBe(before.rows[0][1].id);
    expect(after.selection).toEqual({ row: 0, anchor: 2, head: 2 });
  });

  test("typing at the end appends until the row is full, then wraps", () => {
    const model = typeText(select(base(), 0, 3), "DE");
    expect(modelText(model)).toEqual(["ABCD", "XYZ"]);
    expect(model.selection.row).toBe(1);
  });

  test("Backspace at the end deletes the last letter", () => {
    expect(modelText(erase(select(base(), 0, 3), true))).toEqual(["AB", "XYZ"]);
  });

  test("Delete removes the selected letters", () => {
    expect(modelText(erase(select(select(base(), 1, 0), 1, 1, true), false))).toEqual(["ABC", "Z"]);
  });

  test("cycle steps through the charset and wraps", () => {
    expect(modelText(cycle(select(base(), 0, 0), 1))[0]).toBe("BBC");
    expect(modelText(cycle(select(base(), 0, 0), -1))[0]).toBe("&BC");
  });

  test("rotate moves a selection like a conveyor", () => {
    const range = select(select(base(), 0, 0), 0, 2, true);
    expect(modelText(rotate(range, 1))[0]).toBe("BCA");
    expect(modelText(rotate(range, -1))[0]).toBe("CAB");
  });

  test("wheel starts on the old letter and stops on the new one", () => {
    expect(wheel("A", "A")).toEqual(["A"]);
    const faces = wheel("A", "Q");
    expect(faces[0]).toBe("A");
    expect(faces.at(-1)).toBe("Q");
    expect(faces).toHaveLength(5);
  });
});
