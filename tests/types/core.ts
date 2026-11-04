// Type check of @uifx/core: valid use compiles, each @ts-expect-error line must fail.
import {
  CORD_CONFIG, EFFECT_NAMES, PixelField, PullCord, ReelTitle, SCOPE_BLOCKS, applyOps, blockStyle,
  makeTypos, modelText, setTheme, textToBitmap, toggleTheme, transitionTheme, type ReelChangeEvent,
} from "@uifx/core";

const host = document.createElement("div");

const field = new PixelField(host, { text: "HI", intro: "burn", onPress: () => field.play("random") });
field.play(EFFECT_NAMES[0]);
// @ts-expect-error not an effect
field.play("explode");
new PixelField(host, { intro: false, bitmap: ["#.#", ".#."] });

const reel = new ReelTitle(host, { rows: ["A", "B"], autoplay: false });
reel.replay().then(() => reel.destroy());
host.addEventListener("reelchange", (event) => (event as ReelChangeEvent).detail.rows.join(" "));
// @ts-expect-error rows is a list of strings
new ReelTitle(host, { rows: "AB" });

const cord = new PullCord(host, { onPull: () => toggleTheme({ transition: "fade" }), config: { gravity: 900 } });
cord.setPressed(null);
cord.setConfig({ ...CORD_CONFIG, damping: 0.9 });
// @ts-expect-error unknown config key
cord.setConfig({ gravityy: 1 });

setTheme("dark", { transition: "none" });
// @ts-expect-error unknown transition
setTheme("dark", { transition: "spin" });
transitionTheme(() => {}, { wave: false });

const { model, ops } = makeTypos(["SPELLING"]);
const rows: string[] = modelText(applyOps(model, ops));
const width: number = textToBitmap("HI").width + rows.length;
const style: string = blockStyle(SCOPE_BLOCKS[0]) + width;
