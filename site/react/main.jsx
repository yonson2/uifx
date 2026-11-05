import "@fontsource/commit-mono/500.css";
import "@yonson2/uifx/index.css";
import "../shared/site.css";
import { StrictMode, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { EFFECT_NAMES } from "@yonson2/uifx";
import { ChromaticImage, CrtFilter, GlitchText, Oscilloscope, PixelField, PullCord, ReelTitle, ThemeToggle, Wordmark } from "@yonson2/uifx-react";
import { setupChrome } from "../shared/chrome.js";
import art from "../shared/art.svg";

const ROWS = ["SPELLING", "RESTORED"];

function App() {
  const field = useRef(null);
  const title = useRef(null);
  const [text, setText] = useState(ROWS.join(" / "));
  return (
    <>
      <PullCord />
      <PixelField ref={field} className="hero" text="REACT" aria-label="Pixel field demo">
        <Wordmark />
        <div className="hero-copy" data-pf-quiet>
          <h1 className="uifx-rise">Every effect, rendered with @yonson2/uifx-react.</h1>
          <p className="uifx-rise" style={{ "--uifx-stagger": 1 }}>
            Move the pointer. Press and hold, then let go. Click the word.
          </p>
        </div>
      </PixelField>

      <section className="section">
        <div className="eyebrow">Pixel field</div>
        <h2>&lt;PixelField&gt;</h2>
        <div className="controls">
          {["random", ...EFFECT_NAMES].map((name) => (
            <button key={name} className="button" type="button" onClick={() => field.current.play(name)}>
              {name}
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="eyebrow">Reel title</div>
        <h2>&lt;ReelTitle&gt;</h2>
        <div className="stage">
          <div className="reel-stage">
            <ReelTitle ref={title} rows={ROWS} onChange={(rows) => setText(rows.join(" / "))} />
          </div>
        </div>
        <div className="controls">
          <button className="button" type="button" onClick={() => title.current.replay()}>
            Replay
          </button>
          <code>onChange: {text}</code>
        </div>
      </section>

      <section className="section">
        <div className="eyebrow">Glitch kit</div>
        <h2>&lt;CrtFilter&gt; &lt;ChromaticImage&gt; &lt;GlitchText&gt; &lt;Oscilloscope&gt;</h2>
        <div className="grid">
          <div className="tile">
            <h3>CrtFilter</h3>
            <CrtFilter>
              <img src={art} alt="Sunset over the sea" />
            </CrtFilter>
          </div>
          {["crt", "shadow", "jitter", "layers"].map((variant) => (
            <div className="tile" key={variant}>
              <h3>ChromaticImage {variant}</h3>
              <ChromaticImage src={art} variant={variant} />
            </div>
          ))}
          <div className="tile">
            <h3>Oscilloscope</h3>
            <div className="scope-box">
              <Oscilloscope />
            </div>
          </div>
          <div className="tile tile-wide">
            <h3>GlitchText</h3>
            <GlitchText className="glitch-title">SIGNAL LOST</GlitchText>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="eyebrow">Theme wave and pull-cord</div>
        <h2>&lt;ThemeToggle&gt; &lt;PullCord&gt;</h2>
        <p className="lead">The button switches the theme with the wave; the cord at the top right, with a crossfade.</p>
        <ThemeToggle className="button primary">Toggle theme</ThemeToggle>
      </section>
    </>
  );
}

setupChrome();
createRoot(document.getElementById("app")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
