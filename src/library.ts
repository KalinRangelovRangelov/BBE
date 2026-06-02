import type { SnippetSpec } from "./editor";

export interface LibraryItem {
  label: string;
  hint?: string;
  /** A snippet to insert, OR omitted when the item opens a `widget` instead. */
  spec?: SnippetSpec;
  /** Renders an interactive control rather than a plain insert button. */
  widget?: "color" | "size" | "emoji";
}

/** Compact toolbar: the most frequently used inline/block tags. */
export const toolbar: LibraryItem[] = [
  { label: "B", hint: "Bold", spec: { insert: "[b]$[/b]", wrap: { prefix: "[b]", suffix: "[/b]" } } },
  { label: "i", hint: "Italic", spec: { insert: "[i]$[/i]", wrap: { prefix: "[i]", suffix: "[/i]" } } },
  { label: "U", hint: "Underline", spec: { insert: "[u]$[/u]", wrap: { prefix: "[u]", suffix: "[/u]" } } },
  { label: "S̶", hint: "Strikethrough", spec: { insert: "[s]$[/s]", wrap: { prefix: "[s]", suffix: "[/s]" } } },
  { label: "🎨 Color", hint: "Text color", widget: "color" },
  { label: "A↕ Size", hint: "Font size (1–7)", widget: "size" },
  { label: "🙂 Emote", hint: "Emoticons", widget: "emoji" },
  { label: "“ ”", hint: "Quote", spec: { insert: "[quote]$[/quote]", wrap: { prefix: "[quote]", suffix: "[/quote]" }, block: true } },
  { label: "• List", hint: "Bulleted list", spec: { insert: "[list]\n[*]$\n[*]\n[/list]", block: true } },
  { label: "🔗", hint: "Link", spec: { insert: "[url=https://]$[/url]", wrap: { prefix: "[url=https://]", suffix: "[/url]" } } },
  { label: "🖼", hint: "Image", spec: { insert: "[img]$[/img]", wrap: { prefix: "[img]", suffix: "[/img]" } } },
  { label: "</>", hint: "Code", spec: { insert: "[code]$[/code]", wrap: { prefix: "[code]", suffix: "[/code]" }, block: true } },
];

/** Full browsable palette covering the IP.Board BBCode set. */
export const palette: { category: string; items: LibraryItem[] }[] = [
  {
    category: "Text",
    items: [
      { label: "Bold", spec: { insert: "[b]$[/b]", wrap: { prefix: "[b]", suffix: "[/b]" } } },
      { label: "Italic", spec: { insert: "[i]$[/i]", wrap: { prefix: "[i]", suffix: "[/i]" } } },
      { label: "Underline", spec: { insert: "[u]$[/u]", wrap: { prefix: "[u]", suffix: "[/u]" } } },
      { label: "Strikethrough", spec: { insert: "[s]$[/s]", wrap: { prefix: "[s]", suffix: "[/s]" } } },
    ],
  },
  {
    category: "Color & Font",
    items: [
      { label: "Color", hint: "pick a color", widget: "color" },
      { label: "Size", hint: "pick 1–7", widget: "size" },
      { label: "Font", hint: "[font=name]", spec: { insert: "[font=Arial]$[/font]", wrap: { prefix: "[font=Arial]", suffix: "[/font]" } } },
      { label: "Background", hint: "[background=#hex]", spec: { insert: "[background=#ffff00]$[/background]", wrap: { prefix: "[background=#ffff00]", suffix: "[/background]" } } },
    ],
  },
  {
    category: "Alignment",
    items: [
      { label: "Left", spec: { insert: "[left]$[/left]", wrap: { prefix: "[left]", suffix: "[/left]" }, block: true } },
      { label: "Center", spec: { insert: "[center]$[/center]", wrap: { prefix: "[center]", suffix: "[/center]" }, block: true } },
      { label: "Right", spec: { insert: "[right]$[/right]", wrap: { prefix: "[right]", suffix: "[/right]" }, block: true } },
      { label: "Justify", spec: { insert: "[justify]$[/justify]", wrap: { prefix: "[justify]", suffix: "[/justify]" }, block: true } },
    ],
  },
  {
    category: "Lists",
    items: [
      { label: "Bulleted list", hint: "[list]", spec: { insert: "[list]\n[*]$\n[*]\n[/list]", block: true } },
      { label: "Numbered list", hint: "[list=1]", spec: { insert: "[list=1]\n[*]$\n[*]\n[/list]", block: true } },
      { label: "List item", hint: "[*]", spec: { insert: "[*]$", block: true } },
    ],
  },
  {
    category: "Blocks",
    items: [
      { label: "Quote", spec: { insert: "[quote]$[/quote]", wrap: { prefix: "[quote]", suffix: "[/quote]" }, block: true } },
      { label: "Quote (attributed)", hint: "name + date", spec: { insert: "[quote name='Author' date='Jun 1 2026, 20:59']$[/quote]", block: true } },
      { label: "Code", spec: { insert: "[code]$[/code]", wrap: { prefix: "[code]", suffix: "[/code]" }, block: true } },
      { label: "Spoiler", spec: { insert: "[spoiler]$[/spoiler]", wrap: { prefix: "[spoiler]", suffix: "[/spoiler]" }, block: true } },
      { label: "Horizontal rule", hint: "[hr]", spec: { insert: "[hr]", block: true } },
    ],
  },
  {
    category: "Links & Media",
    items: [
      { label: "Link", hint: "[url=…]", spec: { insert: "[url=https://]$[/url]", wrap: { prefix: "[url=https://]", suffix: "[/url]" } } },
      { label: "Email", hint: "[email]", spec: { insert: "[email]$[/email]", wrap: { prefix: "[email]", suffix: "[/email]" } } },
      { label: "Image", hint: "[img]", spec: { insert: "[img]$[/img]", wrap: { prefix: "[img]", suffix: "[/img]" } } },
      { label: "YouTube", hint: "[youtube]id[/youtube]", spec: { insert: "[youtube]$[/youtube]", block: true } },
      { label: "Media embed", hint: "[media]url[/media]", spec: { insert: "[media]$[/media]", block: true } },
      { label: "Member mention", hint: "[member=name]", spec: { insert: "[member=$]" } },
      { label: "Acronym", hint: "[acronym=full]", spec: { insert: "[acronym=full text]$[/acronym]", wrap: { prefix: "[acronym=full text]", suffix: "[/acronym]" } } },
    ],
  },
];
