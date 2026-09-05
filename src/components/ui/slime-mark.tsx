"use client";

import { useId, type CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";

export interface SlimeMarkProps {
  size?: number;
  className?: string;
  /** the kawaii face — keep on down to ~24px, drop it below that */
  face?: boolean;
  /** hero treatment: adds the water puddle + ripple rings and a gentle float */
  ripple?: boolean;
  /** expression — "typing" glances down in concentration; crossfades from "idle" */
  mood?: "idle" | "typing";
}

/**
 * The Slime AI brand mascot — a glossy gel teardrop, ported from the Stitch
 * "Liquid Aqua" export. Its body gradient is driven by `--sl-slime-1` /
 * `--sl-slime-mid` / `--sl-slime-2`, which shift with the active tool mode
 * (see `[data-mode]` in globals.css) and are registered as `<color>`, so the
 * mascot recolours smoothly in lock-step with the rest of the UI.
 */
export function SlimeMark({
  size = 40,
  className,
  face = true,
  ripple = false,
  mood = "idle",
}: SlimeMarkProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const body = `slime-body-${uid}`;
  const glow = `slime-glow-${uid}`;
  // hero treatment walks left → right across a static water surface, then
  // stops, turns to face the camera and blinks. Typing overrides it with the
  // concentrating nod instead — the water surface itself never moves either
  // way, only the slime's own body/eyes do.
  const walking = ripple && mood !== "typing";
  // px the slime travels left → right; the track is exactly wide enough to
  // hold that walk (slime width + the walk distance).
  const walkDistance = Math.round(size * 1.3);
  const trackWidth = size + walkDistance;

  return (
    <span
      aria-hidden
      className={cn(
        "sl-slime-mark relative inline-flex shrink-0 items-center",
        walking ? "justify-start" : "justify-center",
        className,
      )}
      style={
        {
          width: walking ? trackWidth : size,
          height: ripple ? size * 1.2 : size,
          "--sl-walk-x": `${walkDistance}px`,
        } as CSSProperties
      }
    >
      {ripple ? (
        // Layer 1 — the static water surface. Absolutely positioned against
        // the track, so it never moves no matter what the slime does.
        <>
          <span
            className="sl-slime-ripple absolute left-1/2 bottom-[3%] -translate-x-1/2 rounded-[100%] border"
            style={{
              width: walking ? trackWidth * 0.88 : size * 1.15,
              height: size * 0.3,
              borderColor: "color-mix(in srgb, var(--sl-slime-mid) 55%, transparent)",
            }}
          />
          <span
            className="absolute left-1/2 bottom-[6%] -translate-x-1/2 rounded-[100%] blur-[3px]"
            style={{
              width: walking ? trackWidth * 0.7 : size * 0.92,
              height: size * 0.2,
              background: "color-mix(in srgb, var(--sl-slime-mid) 30%, transparent)",
            }}
          />
        </>
      ) : null}
      {/* Layer 2 — the slime itself. Only this element moves. */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 180"
        fill="none"
        className={cn(
          "relative",
          mood === "typing"
            ? "sl-slime-typing"
            : walking
              ? "sl-slime-walk"
              : ripple && "sl-slime-float",
        )}
      >
        <defs>
          <linearGradient
            id={body}
            gradientUnits="userSpaceOnUse"
            x1="100"
            x2="100"
            y1="10"
            y2="175"
          >
            <stop offset="0%" stopColor="var(--sl-slime-1)" />
            <stop offset="22%" stopColor="var(--sl-slime-1)" />
            <stop offset="55%" stopColor="var(--sl-slime-mid)" />
            <stop offset="100%" stopColor="var(--sl-slime-2)" />
          </linearGradient>
          <radialGradient
            id={glow}
            cx="100"
            cy="42"
            r="70"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Gel teardrop body */}
        <path
          d="M100 18 C135 18 178 65 178 122 C178 158 145 168 100 168 C55 168 22 158 22 122 C22 65 65 18 100 18 Z"
          fill={`url(#${body})`}
        />
        {/* Top gloss */}
        <path
          d="M100 18 C135 18 178 65 178 122 C178 158 145 168 100 168 C55 168 22 158 22 122 C22 65 65 18 100 18 Z"
          fill={`url(#${glow})`}
        />
        {/* Curved specular streak */}
        <path
          d="M42 92 C40 62 70 32 100 30"
          stroke="#ffffff"
          strokeOpacity="0.7"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        {/* Mirrored specular streak, opposite side */}
        <path
          d="M158 92 C160 62 130 32 100 30"
          stroke="#ffffff"
          strokeOpacity="0.35"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="118" cy="38" r="2.5" fill="#ffffff" fillOpacity="0.8" />

        {face ? (
          <>
            {/* idle — open eyes, soft smile. While walking, the eyes turn to
                look the way it's heading and only turn back to the user once
                it has stopped (see `.sl-slime-walk-gaze`); the same group's
                blink runs once during that stopped pause. */}
            <g
              className="sl-slime-face"
              style={{ opacity: mood === "typing" ? 0 : 1 }}
            >
              <g className={walking ? "sl-slime-walk-gaze" : undefined}>
                <ellipse cx="78" cy="116" rx="6" ry="8.5" fill="#082f49" />
                <circle cx="76" cy="113" r="2.8" fill="#ffffff" />
                <ellipse cx="122" cy="116" rx="6" ry="8.5" fill="#082f49" />
                <circle cx="120" cy="113" r="2.8" fill="#ffffff" />
              </g>
              <path
                d="M92 124 Q100 133 108 124"
                stroke="#082f49"
                strokeWidth="3.2"
                strokeLinecap="round"
                fill="none"
              />
            </g>
            {/* typing — glancing down in concentration */}
            <g
              className="sl-slime-face"
              style={{ opacity: mood === "typing" ? 1 : 0 }}
            >
              <path
                d="M70 118 Q78 124 86 118"
                stroke="#082f49"
                strokeWidth="3.4"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M114 118 Q122 124 130 118"
                stroke="#082f49"
                strokeWidth="3.4"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M95 129 Q100 132.5 105 129"
                stroke="#082f49"
                strokeWidth="2.8"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          </>
        ) : null}
      </svg>
    </span>
  );
}
