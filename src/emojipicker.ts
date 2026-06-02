import type { Editor } from "./editor";
import { togglePopup } from "./popup";
import { EMOTICONS } from "./emoticons";

/** Insert an emoticon's text code (the forum converts it to the image). */
function insertEmoticon(editor: Editor, code: string): void {
  editor.applySnippet({ insert: `${code} ` });
}

/** Toggle the emoticon popup: a grid of the forum's default smilies. */
export function toggleEmojiPicker(editor: Editor, anchor: HTMLElement): void {
  togglePopup(anchor, "emoji-popup", (close) => {
    const grid = document.createElement("div");
    grid.className = "emoji-grid";
    for (const e of EMOTICONS) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "emoji-item";
      b.title = e.code;
      const img = document.createElement("img");
      img.src = e.src;
      img.alt = e.code;
      b.appendChild(img);
      b.onclick = () => { insertEmoticon(editor, e.code); close(); };
      grid.appendChild(b);
    }
    return grid;
  });
}
