import type { CSSProperties } from "react";

/**
 * Decorative water-bubble field behind the glass shell. Fixed, non-interactive
 * and sits behind every panel (they're translucent, so the bubbles drift softly
 * through the glass and crisply in the gutters). The bubble set is static so
 * server and client render identically — no `Math.random` at render time.
 */
interface Bubble {
  /** horizontal position */
  left: string;
  /** diameter in px */
  size: number;
  /** seconds for one full rise */
  rise: number;
  /** negative seconds so bubbles are mid-flight on first paint */
  delay: number;
  /** horizontal sway amplitude in px */
  sway: number;
  /** base opacity */
  opacity: number;
}

const BUBBLES: Bubble[] = [
  { left: "4%", size: 52, rise: 30, delay: -6, sway: 9, opacity: 0.5 },
  { left: "11%", size: 20, rise: 21, delay: -14, sway: 6, opacity: 0.65 },
  { left: "18%", size: 34, rise: 26, delay: -2, sway: 8, opacity: 0.55 },
  { left: "26%", size: 14, rise: 17, delay: -9, sway: 5, opacity: 0.7 },
  { left: "34%", size: 44, rise: 34, delay: -20, sway: 11, opacity: 0.42 },
  { left: "43%", size: 24, rise: 23, delay: -4, sway: 7, opacity: 0.6 },
  { left: "52%", size: 16, rise: 19, delay: -13, sway: 6, opacity: 0.68 },
  { left: "60%", size: 38, rise: 28, delay: -24, sway: 9, opacity: 0.5 },
  { left: "68%", size: 12, rise: 16, delay: -7, sway: 4, opacity: 0.72 },
  { left: "75%", size: 58, rise: 36, delay: -16, sway: 12, opacity: 0.38 },
  { left: "83%", size: 22, rise: 22, delay: -3, sway: 7, opacity: 0.62 },
  { left: "90%", size: 30, rise: 27, delay: -11, sway: 8, opacity: 0.55 },
  { left: "96%", size: 18, rise: 20, delay: -18, sway: 5, opacity: 0.66 },
];

export function AmbientBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {BUBBLES.map((b, i) => (
        <span
          key={i}
          className="sl-bubble"
          style={
            {
              left: b.left,
              width: b.size,
              height: b.size,
              animationDuration: `${b.rise}s`,
              animationDelay: `${b.delay}s`,
            } as CSSProperties
          }
        >
          <span
            className="sl-bubble__orb"
            style={
              {
                opacity: b.opacity,
                animationDuration: `${(b.rise / 3).toFixed(2)}s`,
                "--sl-bubble-sway": `${b.sway}px`,
              } as CSSProperties
            }
          />
        </span>
      ))}
    </div>
  );
}
