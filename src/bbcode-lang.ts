import {
  StreamLanguage,
  LanguageSupport,
  HighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

interface State {
  inTag: boolean;
}

// A small streaming tokenizer: it recognises `[tag]`, `[/tag]`, `[tag=value]`
// and `[tag attr="v"]`, emitting tokens that map to standard highlight tags.
// A full Lezer grammar would be overkill for BBCode's flat bracket syntax.
const bbcodeStream = StreamLanguage.define<State>({
  startState: () => ({ inTag: false }),
  token(stream, state) {
    if (!state.inTag) {
      // Opening or closing tag head: "[tag" or "[/tag".
      if (stream.match(/\[\/?[a-zA-Z*][a-zA-Z0-9]*/)) {
        state.inTag = true;
        return "tagName";
      }
      // Plain text up to the next bracket.
      if (stream.match(/[^[]+/)) return null;
      stream.next();
      return null;
    }

    // Inside a tag's brackets.
    if (stream.eat("]")) {
      state.inTag = false;
      return "bracket";
    }
    if (stream.match(/"[^"]*"/) || stream.match(/=[^\]\s]+/)) return "attributeValue";
    if (stream.match(/[a-zA-Z][\w-]*/)) return "attributeName";
    stream.next();
    return "bracket";
  },
  tokenTable: {
    tagName: t.tagName,
    attributeName: t.attributeName,
    attributeValue: t.string,
    bracket: t.bracket,
  },
});

const bbHighlight = HighlightStyle.define([
  { tag: t.tagName, color: "#4ea1ff", fontWeight: "bold" },
  { tag: t.bracket, color: "#858585" },
  { tag: t.attributeName, color: "#c586c0" },
  { tag: t.string, color: "#ce9178" },
]);

/** CodeMirror language support that highlights BBCode tags and attributes. */
export function bbcode(): LanguageSupport {
  return new LanguageSupport(bbcodeStream, [syntaxHighlighting(bbHighlight)]);
}
