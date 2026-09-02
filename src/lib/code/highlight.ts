export type TokenType =
  | "keyword"
  | "string"
  | "comment"
  | "number"
  | "function"
  | "property"
  | "operator"
  | "plain";

export interface CodeToken {
  text: string;
  type: TokenType;
}

interface Rule {
  type: TokenType;
  /** must NOT carry the global flag — it's added to the combined pattern */
  source: string;
}

const JS_KEYWORDS =
  "abstract|as|async|await|break|case|catch|class|const|continue|debugger|declare|default|delete|do|else|enum|export|extends|false|finally|for|from|function|get|if|implements|import|in|instanceof|interface|is|keyof|let|namespace|new|null|of|package|private|protected|public|readonly|return|satisfies|set|static|super|switch|this|throw|true|try|type|typeof|undefined|var|void|while|with|yield";

const PY_KEYWORDS =
  "and|as|assert|async|await|break|class|continue|def|del|elif|else|except|False|finally|for|from|global|if|import|in|is|lambda|None|nonlocal|not|or|pass|raise|return|True|try|while|with|yield";

function jsRules(): Rule[] {
  return [
    { type: "comment", source: String.raw`\/\/[^\n]*|\/\*[\s\S]*?\*\/` },
    {
      type: "string",
      source: String.raw`\`(?:\\[\s\S]|[^\\\`])*\`|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'`,
    },
    { type: "keyword", source: String.raw`\b(?:${JS_KEYWORDS})\b` },
    {
      type: "number",
      source: String.raw`\b(?:0x[\da-fA-F]+|\d+\.?\d*(?:e[+-]?\d+)?)\b`,
    },
    { type: "function", source: String.raw`\b[A-Za-z_$][\w$]*(?=\s*\()` },
    { type: "property", source: String.raw`(?<=\.)[A-Za-z_$][\w$]*` },
    { type: "operator", source: String.raw`[=+\-*/%<>!&|?:.]{1,3}` },
  ];
}

function pyRules(): Rule[] {
  return [
    { type: "comment", source: String.raw`#[^\n]*` },
    {
      type: "string",
      source: String.raw`"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'`,
    },
    { type: "keyword", source: String.raw`\b(?:${PY_KEYWORDS})\b` },
    { type: "number", source: String.raw`\b\d+\.?\d*\b` },
    { type: "function", source: String.raw`\b[A-Za-z_][\w]*(?=\s*\()` },
    { type: "property", source: String.raw`(?<=\.)[A-Za-z_][\w]*` },
    { type: "operator", source: String.raw`[=+\-*/%<>!&|:.]{1,3}` },
  ];
}

function jsonRules(): Rule[] {
  return [
    { type: "property", source: String.raw`"(?:\\.|[^"\\])*"(?=\s*:)` },
    { type: "string", source: String.raw`"(?:\\.|[^"\\])*"` },
    { type: "keyword", source: String.raw`\b(?:true|false|null)\b` },
    { type: "number", source: String.raw`-?\b\d+\.?\d*(?:e[+-]?\d+)?\b` },
    { type: "operator", source: String.raw`[:,]` },
  ];
}

function bashRules(): Rule[] {
  return [
    { type: "comment", source: String.raw`#[^\n]*` },
    { type: "string", source: String.raw`"(?:\\.|[^"\\])*"|'[^']*'` },
    { type: "property", source: String.raw`\$\w+|\$\{[^}]+\}` },
    {
      type: "keyword",
      source: String.raw`\b(?:if|then|else|elif|fi|for|in|do|done|while|case|esac|function|return|export|local)\b`,
    },
    { type: "operator", source: String.raw`(?:^|\s)-{1,2}[A-Za-z-]+` },
    { type: "number", source: String.raw`\b\d+\b` },
  ];
}

function cssRules(): Rule[] {
  return [
    { type: "comment", source: String.raw`\/\*[\s\S]*?\*\/` },
    { type: "string", source: String.raw`"(?:\\.|[^"\\])*"|'[^']*'` },
    { type: "property", source: String.raw`[-A-Za-z]+(?=\s*:)` },
    { type: "function", source: String.raw`[A-Za-z-]+(?=\()` },
    {
      type: "number",
      source: String.raw`#[\da-fA-F]{3,8}\b|\b\d+\.?\d*(?:px|rem|em|%|vh|vw|s|ms|deg|fr)?\b`,
    },
    { type: "keyword", source: String.raw`@[A-Za-z-]+|![A-Za-z]+` },
    { type: "operator", source: String.raw`[:;{}]` },
  ];
}

function rulesFor(language: string): Rule[] | null {
  switch (language.toLowerCase()) {
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
    case "javascript":
    case "typescript":
      return jsRules();
    case "py":
    case "python":
      return pyRules();
    case "json":
      return jsonRules();
    case "sh":
    case "bash":
    case "shell":
    case "zsh":
      return bashRules();
    case "css":
    case "scss":
      return cssRules();
    default:
      return null;
  }
}

const cache = new Map<string, CodeToken[]>();

/**
 * Tiny regex tokenizer for light-theme code highlighting. Deliberately
 * dependency-free — same approach the Stitch export used with hand-written
 * `.keyword`/`.string` spans. Results are cached per (language|code).
 */
export function highlight(code: string, language: string): CodeToken[] {
  const key = `${language}\u0000${code}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const rules = rulesFor(language);
  if (!rules) {
    const plain: CodeToken[] = [{ text: code, type: "plain" }];
    cache.set(key, plain);
    return plain;
  }

  const combined = new RegExp(
    rules.map((r, i) => `(?<g${i}>${r.source})`).join("|"),
    "g",
  );

  const tokens: CodeToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = combined.exec(code)) !== null) {
    if (match[0] === "") {
      combined.lastIndex += 1;
      continue;
    }
    if (match.index > lastIndex) {
      tokens.push({ text: code.slice(lastIndex, match.index), type: "plain" });
    }
    const groupIndex = rules.findIndex(
      (_, i) => match?.groups?.[`g${i}`] !== undefined,
    );
    tokens.push({
      text: match[0],
      type: rules[groupIndex]?.type ?? "plain",
    });
    lastIndex = combined.lastIndex;
  }

  if (lastIndex < code.length) {
    tokens.push({ text: code.slice(lastIndex), type: "plain" });
  }

  if (cache.size > 200) cache.clear();
  cache.set(key, tokens);
  return tokens;
}
