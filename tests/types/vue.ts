import { h, ref } from "vue";
import { ChromaticImage, PixelField, PullCord, ReelTitle, Wordmark } from "@yonson2/uifx-vue";

const field = ref<InstanceType<typeof PixelField> | null>(null);
field.value?.play("decrypt");
const title = ref<InstanceType<typeof ReelTitle> | null>(null);
title.value?.replay();

h(PixelField, { text: "HI", intro: "rain", class: "hero", onPress: () => {} }, () => [h(Wordmark)]);
h(ReelTitle, { rows: ["A"], onChange: (rows: string[]) => rows.join("") });
h(PullCord, { label: "Theme", config: { gravity: 900 }, onPull: () => {} });
h(ChromaticImage, { src: "a.png", variant: "jitter" });
// @ts-expect-error not a variant
h(ChromaticImage, { src: "a.png", variant: "blur" });
// @ts-expect-error scale is a number
h(PixelField, { scale: "2" });
