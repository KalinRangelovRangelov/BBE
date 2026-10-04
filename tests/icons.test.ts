import { describe, it, expect } from "vitest";
import { icon } from "../src/icons";
import { toolbar } from "../src/library";

describe("icon", () => {
  it("builds an aria-hidden SVG with a single non-empty path", () => {
    const svg = icon("format_bold");
    expect(svg.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(svg.tagName).toBe("svg");
    expect(svg.getAttribute("viewBox")).toBe("0 -960 960 960");
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.classList.contains("icon")).toBe(true);
    expect(svg.children.length).toBe(1);
    const path = svg.children[0];
    expect(path.tagName).toBe("path");
    expect(path.getAttribute("d")).toBeTruthy();
  });
});

describe("toolbar", () => {
  it("gives every button an icon and keeps emoji out of labels and hints", () => {
    for (const item of toolbar) {
      expect(item.icon, item.label).toBeTruthy();
      expect(item.label).not.toMatch(/\p{Extended_Pictographic}/u);
      expect(item.hint ?? "").not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });
});
