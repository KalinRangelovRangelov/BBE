import presetHTML5 from "@bbob/preset-html5";
import { getUniqAttr, escapeHTML } from "@bbob/plugin-helper";

// A BBob AST node passed to a tag handler. `attrs` is a string→string map; a
// `[tag=value]` payload appears as a key whose value equals the key (read it
// with getUniqAttr), while `[tag k="v"]` attributes appear as named entries.
interface BBNode {
  tag: string;
  attrs: Record<string, string>;
  content: Array<BBNode | string> | null;
}
// What a handler may return: a tag node (plain object is fine) or raw text.
type Out = { tag: string; attrs: Record<string, string>; content: Array<BBNode | string> | string | null } | string;
interface Core {
  render: (content: Array<BBNode | string> | null | undefined) => string;
}

/** Flatten a content array to its literal text (used for raw constructs). */
function rawText(content: Array<BBNode | string> | null): string {
  return (content || []).map((n) => (typeof n === "string" ? n : "")).join("");
}

/**
 * Map an IP.Board [size=N] value to a CSS font-size. IP.Board's editor emits
 * either a small integer step (1–7, like legacy HTML font sizes) or an explicit
 * pixel value; anything already carrying a unit is passed through unchanged.
 */
function sizeToCss(v: string | null): string {
  if (!v) return "inherit";
  const steps: Record<string, string> = {
    "1": "0.7em", "2": "0.85em", "3": "1em",
    "4": "1.3em", "5": "1.6em", "6": "2em", "7": "2.6em",
  };
  if (steps[v]) return steps[v];
  if (/^\d+$/.test(v)) return `${v}px`;
  return v;
}

function styleNode(style: string, content: BBNode["content"]): Out {
  return { tag: "span", attrs: { style }, content };
}
function alignNode(align: string, content: BBNode["content"]): Out {
  return { tag: "div", attrs: { style: `text-align:${align}` }, content };
}

/** Turn a media URL or bare id into a privacy-friendly YouTube/Vimeo embed. */
function toEmbedSrc(input: string): string | null {
  const s = input.trim();
  // Bare 11-char YouTube id (what [youtube] usually carries).
  if (/^[\w-]{11}$/.test(s)) return `https://www.youtube-nocookie.com/embed/${s}`;
  const yt = s.match(/(?:youtu\.be\/|[?&]v=|youtube\.com\/(?:embed|shorts)\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vimeo = s.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

function embedNode(src: string): Out {
  return {
    tag: "div",
    attrs: { class: "ipsEmbed" },
    content: [
      {
        tag: "iframe",
        attrs: {
          src,
          frameborder: "0",
          allow: "accelerometer; encrypted-media; picture-in-picture",
          allowfullscreen: "true",
        },
        content: [],
      } as unknown as BBNode,
    ],
  };
}

/**
 * The IP.Board / Invision Community BBCode dialect, built on @bbob/preset-html5.
 * Handlers return AST nodes; their HTML is sanitized downstream in preview.ts.
 */
// BBob's own preset types model attrs as `Record<string, unknown> | undefined`,
// which fights our narrower handler signatures; cast `extend` so we can keep our
// handler bodies strongly typed against BBNode without satisfying their generics.
const extend = presetHTML5.extend as (
  cb: (tags: Record<string, unknown>) => Record<string, unknown>,
) => typeof presetHTML5;

export const ipboardPreset = extend((tags) => ({
  ...tags,

  // --- inline emphasis ---
  b: (node: BBNode): Out => ({ tag: "strong", attrs: {}, content: node.content }),
  i: (node: BBNode): Out => ({ tag: "em", attrs: {}, content: node.content }),
  u: (node: BBNode): Out => styleNode("text-decoration:underline", node.content),
  s: (node: BBNode): Out => styleNode("text-decoration:line-through", node.content),

  // --- color / size / font / background (value via [tag=value]) ---
  color: (node: BBNode): Out => styleNode(`color:${getUniqAttr(node.attrs) ?? ""}`, node.content),
  size: (node: BBNode): Out => styleNode(`font-size:${sizeToCss(getUniqAttr(node.attrs))}`, node.content),
  font: (node: BBNode): Out => styleNode(`font-family:${getUniqAttr(node.attrs) ?? "inherit"}`, node.content),
  background: (node: BBNode): Out => styleNode(`background-color:${getUniqAttr(node.attrs) ?? ""}`, node.content),

  // --- block alignment ---
  left: (node: BBNode): Out => alignNode("left", node.content),
  center: (node: BBNode): Out => alignNode("center", node.content),
  right: (node: BBNode): Out => alignNode("right", node.content),
  justify: (node: BBNode): Out => alignNode("justify", node.content),

  // --- links / mail / image ---
  url: (node: BBNode, { render }: Core): Out => {
    const href = getUniqAttr(node.attrs) || render(node.content);
    return {
      tag: "a",
      attrs: { href: String(href), rel: "nofollow noopener", target: "_blank" },
      content: node.content && node.content.length ? node.content : [String(href)],
    };
  },
  email: (node: BBNode, { render }: Core): Out => {
    const addr = getUniqAttr(node.attrs) || render(node.content);
    return { tag: "a", attrs: { href: `mailto:${addr}` }, content: node.content };
  },
  img: (node: BBNode, { render }: Core): Out => {
    const src = getUniqAttr(node.attrs) || render(node.content);
    return { tag: "img", attrs: { src: String(src), alt: "" }, content: [] };
  },

  // --- quote, with optional name='' date='' post='' attribution. IP.Board
  // emits these single-quoted; preview.ts normalizes them to the double quotes
  // BBob's parser requires. The citation mirrors IP.Board's "Name @ date" bar. ---
  quote: (node: BBNode): Out => {
    const name = node.attrs?.name || getUniqAttr(node.attrs);
    const date = node.attrs?.date;
    const cite: Array<BBNode | string> = [];
    if (name) {
      cite.push({ tag: "span", attrs: { class: "ipsQuote_name" }, content: [String(name)] });
      if (date) {
        cite.push(" @ ");
        cite.push({ tag: "span", attrs: { class: "ipsQuote_date" }, content: [String(date)] });
      }
    }
    const head: Array<BBNode | string> = cite.length
      ? [{ tag: "cite", attrs: { class: "ipsQuote_citation" }, content: cite }]
      : [];
    return {
      tag: "blockquote",
      attrs: { class: "ipsQuote" },
      content: [
        ...head,
        { tag: "div", attrs: { class: "ipsQuote_contents" }, content: node.content },
      ],
    };
  },

  // --- code: kept verbatim (see contextFreeTags in preview.ts); emit the inner
  // <code> as a raw escaped string so the walker never re-parses it as a tag. ---
  code: (node: BBNode): Out => ({
    tag: "pre",
    attrs: { class: "ipsCode" },
    content: [`<code>${escapeHTML(rawText(node.content))}</code>`],
  }),

  // --- spoiler: native <details> toggle, no inline JS needed ---
  spoiler: (node: BBNode): Out => ({
    tag: "details",
    attrs: { class: "ipsSpoiler" },
    content: [
      { tag: "summary", attrs: { class: "ipsSpoiler_header" }, content: ["Spoiler"] },
      { tag: "div", attrs: { class: "ipsSpoiler_contents" }, content: node.content },
    ],
  }),

  // --- @member mention ---
  member: (node: BBNode, { render }: Core): Out => {
    const name = getUniqAttr(node.attrs) || render(node.content);
    return { tag: "a", attrs: { class: "ipsMention", href: "#" }, content: [`@${name}`] };
  },

  // --- acronym / abbreviation ---
  acronym: (node: BBNode): Out => ({
    tag: "abbr",
    attrs: { title: getUniqAttr(node.attrs) ?? "" },
    content: node.content,
  }),

  // --- horizontal rule ---
  hr: (): Out => ({ tag: "hr", attrs: {}, content: [] }),

  // --- video embeds ---
  youtube: (node: BBNode, { render }: Core): Out => {
    const src = toEmbedSrc(render(node.content));
    return src ? embedNode(src) : styleNode("", node.content);
  },
  media: (node: BBNode, { render }: Core): Out => {
    const src = toEmbedSrc(getUniqAttr(node.attrs) || render(node.content));
    return src ? embedNode(src) : styleNode("", node.content);
  },
}));

/** Tags the parser recognises; anything else is left as literal text. */
export const ALLOWED_BBCODE_TAGS = [
  "b", "i", "u", "s",
  "color", "size", "font", "background",
  "left", "center", "right", "justify",
  "list", "*",
  "url", "email", "img",
  "quote", "code", "spoiler", "member", "hr", "acronym",
  "media", "youtube",
];

/** Tags whose inner content must NOT be parsed as BBCode (kept verbatim). */
export const CONTEXT_FREE_TAGS = ["code"];
