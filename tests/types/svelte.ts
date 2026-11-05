import { mount, type ComponentProps } from "svelte";
import { ChromaticImage, PixelField, PullCord, ReelTitle } from "@yonson2/uifx-svelte";

const target = document.createElement("div");
const field = mount(PixelField, { target, props: { text: "HI", intro: "middleout", onpress: () => {} } });
field.play("unstable");
const title = mount(ReelTitle, { target, props: { rows: ["A"], onchange: (rows) => rows.join("") } });
title.replay();
mount(PullCord, { target, props: { label: "Theme", config: { damping: 0.9 } } });

const image: ComponentProps<typeof ChromaticImage> = { src: "a.png", variant: "crt" };
// @ts-expect-error not a variant
const wrong: ComponentProps<typeof ChromaticImage> = { src: "a.png", variant: "blur" };
// @ts-expect-error not an effect
mount(PixelField, { target, props: { intro: "explode" } });
export { image, wrong };
