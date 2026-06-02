// A tiny anchored-popup manager shared by the color, size and emoji pickers.
// Only one popup is open at a time; a repeat click on the same anchor closes it.
// Dismissal happens on outside-click or Escape.

interface Active {
  el: HTMLElement;
  anchorId: string;
  close: () => void;
}

let active: Active | null = null;

let anchorSeq = 0;
function anchorId(el: HTMLElement): string {
  if (!el.dataset.popupAnchorId) el.dataset.popupAnchorId = String(++anchorSeq);
  return el.dataset.popupAnchorId;
}

/**
 * Toggle a popup anchored beneath `anchor`. `build` receives a `close` callback
 * so swatch/option handlers can dismiss the popup after acting. `className` is
 * applied to the popup container for styling.
 */
export function togglePopup(
  anchor: HTMLElement,
  className: string,
  build: (close: () => void) => HTMLElement,
): void {
  const id = anchorId(anchor);
  if (active) {
    const wasSame = active.anchorId === id;
    active.close();
    if (wasSame) return;
  }

  const el = document.createElement("div");
  el.className = `popup ${className}`;

  const onDocClick = (e: MouseEvent) => {
    if (!el.contains(e.target as Node) && e.target !== anchor) close();
  };
  const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
  function close() {
    document.removeEventListener("mousedown", onDocClick);
    document.removeEventListener("keydown", onKey);
    el.remove();
    if (active && active.el === el) active = null;
  }

  el.appendChild(build(close));
  document.body.appendChild(el);

  // Position under the anchor, nudged left if it would overflow the viewport.
  const r = anchor.getBoundingClientRect();
  const left = Math.min(r.left, window.innerWidth - el.offsetWidth - 8);
  el.style.top = `${r.bottom + 4}px`;
  el.style.left = `${Math.max(8, left)}px`;

  // Defer so the opening click doesn't immediately dismiss the popup.
  setTimeout(() => document.addEventListener("mousedown", onDocClick), 0);
  document.addEventListener("keydown", onKey);

  active = { el, anchorId: id, close };
}
