import type { Editor } from "./editor";
import { togglePopup } from "./popup";

// Preview font-size for each step 1–7, mirroring sizeToCss() in bbcode-preset.ts
// so the dropdown entries look the same size as the rendered output.
const STEP_EM: Record<number, string> = {
  1: "0.7em", 2: "0.85em", 3: "1em", 4: "1.3em", 5: "1.6em", 6: "2em", 7: "2.6em",
};

function applySize(editor: Editor, n: number): void {
  editor.applySnippet({
    insert: `[size=${n}]$[/size]`,
    wrap: { prefix: `[size=${n}]`, suffix: "[/size]" },
  });
}

/** Toggle a 1–7 size dropdown, each option shown at its actual size. */
export function toggleSizePicker(editor: Editor, anchor: HTMLElement): void {
  togglePopup(anchor, "size-popup", (close) => {
    const list = document.createElement("div");
    list.className = "size-list";
    for (let n = 1; n <= 7; n++) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "size-option";
      b.textContent = String(n);
      b.style.fontSize = STEP_EM[n];
      b.title = `[size=${n}]`;
      b.onclick = () => { applySize(editor, n); close(); };
      list.appendChild(b);
    }
    return list;
  });
}
