import { useRef } from "react";
import { ChromaticImage, GlitchText, PixelField, PullCord, ReelTitle, ThemeToggle, Wordmark, type PixelFieldHandle, type ReelTitleHandle } from "@yonson2/uifx-react";

export function App() {
  const field = useRef<PixelFieldHandle>(null);
  const title = useRef<ReelTitleHandle>(null);
  return (
    <>
      <PixelField ref={field} as="header" text="HI" intro="sweep" className="hero" onPress={() => field.current?.play("burn")}>
        <Wordmark />
      </PixelField>
      <ReelTitle ref={title} rows={["A"]} onChange={(rows) => rows.join("")} />
      <ChromaticImage src="a.png" variant="layers" alt="" />
      <GlitchText as="h2">SIGNAL</GlitchText>
      <PullCord label="Theme" pressed config={{ damping: 0.9 }} onPull={() => title.current?.replay()} />
      <ThemeToggle className="button">Toggle</ThemeToggle>
      {/* @ts-expect-error not a variant */}
      <ChromaticImage src="a.png" variant="blur" />
      {/* @ts-expect-error not an effect */}
      <PixelField intro="explode" />
    </>
  );
}
