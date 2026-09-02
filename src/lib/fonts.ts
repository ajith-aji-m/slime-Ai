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
 * NOTE (perf backlog): this ships the full variable icon font (~3.9MB woff2).
 * It loads async with `display: swap` and is immutable-cached, so it never blocks
 * first paint. A later optimization can subset it to the glyph set in
 * `src/config/icons.ts` using `pyftsubset --unicodes=<codepoints> --layout-features=liga`.
 */
export const materialSymbols = localFont({
  src: "../assets/fonts/material-symbols-outlined.woff2",
  display: "swap",
  variable: "--font-material-symbols",
  weight: "100 700",
  fallback: [],
});
