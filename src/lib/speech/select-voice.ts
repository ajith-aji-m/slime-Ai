/**
 * Picks the best installed `SpeechSynthesisVoice` for `lang` out of
 * `voices`. Preference order:
 *
 * 1. `preferredURI` (the user's explicit pick in Settings), but only if its
 *    own language still matches what's being spoken — a voice picked for
 *    English shouldn't get force-fed Tamil just because it's "preferred".
 * 2. An exact language match, ranked by a quality heuristic: a name hint
 *    like "Natural"/"Enhanced"/"Online"/"Neural" (OS/browser vendors use
 *    these to flag their better engines) or a non-local/network voice —
 *    both usually sound noticeably less robotic than the plain offline
 *    default.
 * 3. A same-primary-subtag match (e.g. a "ta-LK" voice when "ta-IN" was
 *    asked for) — still intelligible, better than nothing.
 * 4. `null` — nothing on this device/browser can speak this language at
 *    all. That's a real, honest gap (the OS has no voice data for it, not
 *    a bug in this code) — callers should say so rather than silently
 *    falling back to an English voice that will mangle the text.
 */
export function pickVoice(
  voices: SpeechSynthesisVoice[],
  lang: string,
  preferredURI?: string | null,
): SpeechSynthesisVoice | null {
  const primary = lang.split("-")[0]?.toLowerCase() ?? lang.toLowerCase();

  if (preferredURI) {
    const preferred = voices.find((v) => v.voiceURI === preferredURI);
    if (preferred && preferred.lang.toLowerCase().startsWith(primary)) {
      return preferred;
    }
  }

  const exact = voices.filter((v) => v.lang.toLowerCase() === lang.toLowerCase());
  const samePrimary = voices.filter((v) =>
    v.lang.toLowerCase().startsWith(primary),
  );
  const pool = exact.length > 0 ? exact : samePrimary;
  if (pool.length === 0) return null;

  const qualityHint = /natural|enhanced|online|premium|neural/i;
  const score = (v: SpeechSynthesisVoice) =>
    (qualityHint.test(v.name) ? 2 : 0) + (v.localService ? 0 : 1);
  return [...pool].sort((a, b) => score(b) - score(a))[0];
}
