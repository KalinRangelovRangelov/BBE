import type { Editor } from "./editor";
import { togglePopup } from "./popup";

// A grid of predefined swatches, echoing the palette offered by the IP.Board
// rich-text editor's text-color button: a greyscale row, a vivid row, then
// light→dark tints. Users can still pick any color via the custom input.
const PALETTE: string[][] = [
  ["#000000", "#444444", "#666666", "#999999", "#cccccc", "#eeeeee", "#f3f3f3", "#ffffff"],
  ["#ff0000", "#ff9900", "#ffff00", "#00ff00", "#00ffff", "#0000ff", "#9900ff", "#ff00ff"],
  ["#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#cfe2f3", "#d9d2e9", "#ead1dc"],
  ["#ea9999", "#f9cb9c", "#ffe599", "#b6d7a8", "#a2c4c9", "#9fc5e8", "#b4a7d6", "#d5a6bd"],
  ["#cc0000", "#e69138", "#f1c232", "#6aa84f", "#45818e", "#3d85c6", "#674ea7", "#a64d79"],
  ["#990000", "#b45f06", "#bf9000", "#38761d", "#134f5c", "#0b5394", "#351c75", "#741b47"],
];

/** Wrap the selection (or insert a placeholder) in a [color=hex] tag. */
function applyColor(editor: Editor, hex: string): void {
  editor.applySnippet({
    insert: `[color=${hex}]$[/color]`,
    wrap: { prefix: `[color=${hex}]`, suffix: "[/color]" },
  });
}

/** Toggle a swatch popup anchored beneath `anchor`, applying to `editor`. */
export function toggleColorPicker(editor: Editor, anchor: HTMLElement): void {
  togglePopup(anchor, "color-popup", (close) => {
    const frag = document.createElement("div");

    const grid = document.createElement("div");
    grid.className = "color-grid";
    for (const row of PALETTE) {
      for (const hex of row) {
        const sw = document.createElement("button");
        sw.type = "button";
        sw.className = "color-swatch";
        sw.style.background = hex;
        sw.title = hex;
        sw.setAttribute("aria-label", hex);
        sw.onclick = () => { applyColor(editor, hex); close(); };
        grid.appendChild(sw);
      }
    }
    frag.appendChild(grid);

    // Custom-color row: native picker + free-text hex/name field.
    const custom = document.createElement("div");
    custom.className = "color-custom";

    const native = document.createElement("input");
    native.type = "color";
    native.value = "#3366ff";
    native.title = "Custom color";

    const hexInput = document.createElement("input");
    hexInput.type = "text";
    hexInput.className = "color-hex";
    hexInput.value = "#3366ff";
    hexInput.spellcheck = false;
    hexInput.setAttribute("aria-label", "Custom color value");

    native.oninput = () => { hexInput.value = native.value; };

    const apply = document.createElement("button");
    apply.type = "button";
    apply.className = "color-apply";
    apply.textContent = "Apply";
    apply.onclick = () => {
      const v = hexInput.value.trim();
      if (v) applyColor(editor, v);
      close();
    };
    hexInput.onkeydown = (e) => {
      if (e.key === "Enter") { e.preventDefault(); apply.click(); }
    };

    custom.append(native, hexInput, apply);
    frag.appendChild(custom);
    return frag;
  });
}
