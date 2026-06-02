import bbobHTML from "@bbob/html";
import DOMPurify from "dompurify";
import { ipboardPreset, ALLOWED_BBCODE_TAGS, CONTEXT_FREE_TAGS } from "./bbcode-preset";
import { EMOTICONS } from "./emoticons";

export type Theme = "dark" | "light";

// Embeds are the only iframes we permit, and only when their src points at a
// known video host. Everything else is dropped by the sanitize hook below.
const EMBED_SRC = /^https:\/\/(www\.youtube\.com|www\.youtube-nocookie\.com|player\.vimeo\.com)\//;

let hookInstalled = false;
function installHook(): void {
  if (hookInstalled) return;
  DOMPurify.addHook("uponSanitizeElement", (node, data) => {
    if (data.tagName === "iframe") {
      const src = (node as Element).getAttribute("src") || "";
      if (!EMBED_SRC.test(src)) (node as Element).parentNode?.removeChild(node);
    }
  });
  hookInstalled = true;
}

/**
 * BBob's lexer only recognises double-quoted attribute values, but IP.Board
 * emits single quotes — e.g. `[quote name='Alice' date='Jan 1 2026, 12:00'
 * post='42']`. Convert single-quoted values to double quotes, but only
 * inside tag openings (`[ … ]`), so apostrophes in body text and code blocks
 * are never touched.
 */
function normalizeAttrQuotes(src: string): string {
  return src.replace(/\[[^\]\n]*\]/g, (tag) =>
    tag.replace(/=\s*'([^']*)'/g, '="$1"'),
  );
}

// Match any emoticon code; longer codes first so e.g. ":lol:" beats a shorter
// overlap. Codes are regex-escaped. The replace callback looks the code up by
// its (unescaped) matched text.
const EMO_SRC = new Map(EMOTICONS.map((e) => [e.code, e.src]));
const EMO_RE = new RegExp(
  EMOTICONS.map((e) => e.code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .sort((a, b) => b.length - a.length)
    .join("|"),
  "g",
);
function emoticonize(text: string): string {
  return text.replace(EMO_RE, (code) =>
    `<img class="emoticon" src="${EMO_SRC.get(code)}" alt="${code}">`);
}

/**
 * Final pass over the sanitized HTML: convert newlines to <br> and replace
 * emoticon codes with their images. Both operate only on text — never inside
 * HTML tags, and never inside <pre>…</pre> code blocks (which stay verbatim).
 * Run after sanitization because the emoticon images are trusted, inlined
 * data: URIs that DOMPurify's default URI policy would otherwise strip.
 */
function postProcess(html: string): string {
  return html
    .split(/(<pre[\s\S]*?<\/pre>)/g)
    .map((seg, i) => {
      if (i % 2 === 1) return seg; // inside <pre>: leave verbatim
      return seg
        .split(/(<[^>]+>)/g)
        .map((piece, j) =>
          j % 2 === 1 ? piece : emoticonize(piece.replace(/\r?\n/g, "<br>\n")))
        .join("");
    })
    .join("");
}

/**
 * Render BBCode (IP.Board dialect) to sanitized HTML safe to inject into the
 * preview pane. BBob does not HTML-escape text, so DOMPurify is the security
 * boundary: it strips scripts/handlers and allows iframes only for whitelisted
 * video embeds.
 */
export function renderBBCode(source: string): string {
  installHook();
  const raw = bbobHTML(normalizeAttrQuotes(source), ipboardPreset(), {
    onlyAllowTags: ALLOWED_BBCODE_TAGS,
    contextFreeTags: CONTEXT_FREE_TAGS,
  });
  const clean = DOMPurify.sanitize(raw, {
    ADD_TAGS: ["iframe", "details", "summary"],
    ADD_ATTR: ["target", "allow", "allowfullscreen", "frameborder", "open"],
    FORBID_TAGS: ["script", "style", "object", "embed", "form", "input", "link", "meta"],
  });
  return postProcess(clean);
}

/** Kept for interface symmetry with the editor's theme toggle; styling of code
 * blocks is driven entirely by CSS variables, so there is nothing to swap. */
export function setCodeTheme(_theme: Theme): void {
  /* no-op */
}
