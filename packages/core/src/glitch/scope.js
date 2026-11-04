// Markup data for the oscilloscope (glitch.css animates the path and the blocks).

/** The resting waveform, viewBox "0 0 200 40". */
export const SCOPE_WAVE = "M0,20 Q10,5 20,20 Q30,35 40,20 Q50,5 60,20 Q70,35 80,20 Q90,5 100,20 Q110,35 120,20 Q130,5 140,20 Q150,35 160,20 Q170,5 180,20 Q190,35 200,20";

/** Corruption blocks over the scope; each flashes at another moment of the 4 s cycle. */
export const SCOPE_BLOCKS = [
  { left: "12%", top: "18%", width: "18%", height: "24%", delay: "0s" },
  { left: "47%", top: "52%", width: "11%", height: "32%", delay: "-1.4s" },
  { left: "71%", top: "8%", width: "21%", height: "20%", delay: "-2.7s" },
];

export const blockStyle = (b) => `left:${b.left};top:${b.top};width:${b.width};height:${b.height};animation-delay:${b.delay}`;
