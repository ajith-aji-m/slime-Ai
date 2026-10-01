/**
 * Best-effort spoken-language guess for `speechSynthesis`, based on which
 * Unicode *script* dominates the text — reliable where full statistical
 * language detection isn't needed: a script tells you unambiguously which
 * voice family can even read the characters, which is exactly what matters
 * for picking a matching voice. This is also precisely the bug a missing
 * `utterance.lang` causes: without it, the browser falls back to its
 * default (usually an English) voice regardless of script, which for
 * non-Latin text either mispronounces badly or — on some engines — produces
 * no audio at all for characters it can't map to phonemes (reported as
 * "showing but not speaking").
 *
 * Latin-script text (English and most European languages) falls through to
 * `fallback` rather than guessing a specific variant — telling French from
 * Spanish from English by characters alone isn't reliable the way script
 * detection is, so this doesn't try.
 */

interface ScriptRule {
  lang: string;
  pattern: RegExp;
}

const SCRIPT_RULES: ScriptRule[] = [
  { lang: "ta-IN", pattern: /\p{Script=Tamil}/gu },
  { lang: "hi-IN", pattern: /\p{Script=Devanagari}/gu },
  { lang: "te-IN", pattern: /\p{Script=Telugu}/gu },
  { lang: "kn-IN", pattern: /\p{Script=Kannada}/gu },
  { lang: "ml-IN", pattern: /\p{Script=Malayalam}/gu },
  { lang: "bn-IN", pattern: /\p{Script=Bengali}/gu },
  { lang: "gu-IN", pattern: /\p{Script=Gujarati}/gu },
  { lang: "pa-IN", pattern: /\p{Script=Gurmukhi}/gu },
  { lang: "or-IN", pattern: /\p{Script=Oriya}/gu },
  { lang: "ar-SA", pattern: /\p{Script=Arabic}/gu },
  { lang: "he-IL", pattern: /\p{Script=Hebrew}/gu },
  { lang: "th-TH", pattern: /\p{Script=Thai}/gu },
  { lang: "ru-RU", pattern: /\p{Script=Cyrillic}/gu },
  { lang: "el-GR", pattern: /\p{Script=Greek}/gu },
  { lang: "ko-KR", pattern: /\p{Script=Hangul}/gu },
  { lang: "ja-JP", pattern: /[\p{Script=Hiragana}\p{Script=Katakana}]/gu },
  { lang: "zh-CN", pattern: /\p{Script=Han}/gu },
];

/** Returns a BCP-47-ish tag (e.g. "ta-IN") picked by whichever script has
 * the most characters in `text`, or `fallback` if nothing non-Latin was
 * found. */
export function detectSpeechLang(text: string, fallback = "en-US"): string {
  let best = fallback;
  let bestCount = 0;
  for (const { lang, pattern } of SCRIPT_RULES) {
    const count = text.match(pattern)?.length ?? 0;
    if (count > bestCount) {
      best = lang;
      bestCount = count;
    }
  }
  return best;
}
