import { Hanken_Grotesk } from "next/font/google";
import localFont from "next/font/local";

/**
 * Hanken Grotesk — the single typeface for the whole product.
 * Source: aetheric_intelligence_light/DESIGN.md ("leverages Hanken Grotesk across all roles").
 */
export const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-hanken",
  weight: ["400", "500", "600", "700"],
});

/**
 * Material Symbols Outlined — icon font, self-hosted (no CDN, no layout shift).
 * The export uses specific Material Symbols glyphs; we keep them 1:1.
 *
 * The woff2 is subsetted to exactly the glyphs in `ICON_NAMES`
 * (`src/components/ui/icon.tsx`) — ~77 KB instead of the ~3.9 MB full font.
 * Regenerate after adding an icon: `node scripts/refresh-icon-font.mjs`.
 */
export const materialSymbols = localFont({
  src: "../assets/fonts/material-symbols-outlined.woff2",
  display: "swap",
  variable: "--font-material-symbols",
  weight: "100 700",
  fallback: [],
});
