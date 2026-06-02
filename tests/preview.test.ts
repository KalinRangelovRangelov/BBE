import { describe, it, expect } from "vitest";
import { renderBBCode } from "../src/preview";

describe("renderBBCode (IP.Board dialect)", () => {
  it("renders inline emphasis", () => {
    const html = renderBBCode("[b]bold[/b] [i]it[/i] [u]u[/u] [s]gone[/s]");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>it</em>");
    expect(html).toContain("text-decoration:underline");
    expect(html).toContain("text-decoration:line-through");
  });

  it("renders color, size, font and background", () => {
    expect(renderBBCode("[color=red]x[/color]")).toContain("color:red");
    expect(renderBBCode("[color=#ff0000]x[/color]")).toContain("color:#ff0000");
    expect(renderBBCode("[size=4]x[/size]")).toContain("font-size:1.3em");
    expect(renderBBCode("[size=18]x[/size]")).toContain("font-size:18px");
    expect(renderBBCode("[font=Arial]x[/font]")).toContain("font-family:Arial");
    expect(renderBBCode("[background=#ff0]x[/background]")).toContain("background-color:#ff0");
  });

  it("renders block alignment", () => {
    expect(renderBBCode("[center]x[/center]")).toContain("text-align:center");
    expect(renderBBCode("[right]x[/right]")).toContain("text-align:right");
    expect(renderBBCode("[justify]x[/justify]")).toContain("text-align:justify");
  });

  it("renders bulleted and numbered lists", () => {
    const ul = renderBBCode("[list][*]a[*]b[/list]");
    expect(ul).toContain("<ul>");
    expect(ul).toContain("<li>a</li>");
    expect(ul).toContain("<li>b</li>");
    const ol = renderBBCode("[list=1][*]a[*]b[/list]");
    expect(ol).toContain("<ol");
  });

  it("renders links with rel/target and supports content-as-href", () => {
    const a = renderBBCode("[url=https://x.test]y[/url]");
    expect(a).toContain('href="https://x.test"');
    expect(a).toContain('rel="nofollow noopener"');
    expect(a).toContain(">y</a>");
    const bare = renderBBCode("[url]https://x.test[/url]");
    expect(bare).toContain('href="https://x.test"');
  });

  it("renders email and image", () => {
    expect(renderBBCode("[email]a@b.test[/email]")).toContain('href="mailto:a@b.test"');
    const img = renderBBCode("[img]https://x.test/a.png[/img]");
    expect(img).toContain('<img src="https://x.test/a.png"');
  });

  it("renders an attributed quote with a citation", () => {
    const q = renderBBCode('[quote name="Bob" date="2026"]hi[/quote]');
    expect(q).toContain("<blockquote");
    expect(q).toContain('class="ipsQuote"');
    expect(q).toContain("ipsQuote_citation");
    expect(q).toContain("Bob");
    expect(q).toContain("2026");
    expect(q).toContain("hi");
  });

  it("parses the IP.Board single-quoted quote header with name, date and time", () => {
    const q = renderBBCode(
      "[quote name='Alice' date='Jan 1 2026, 12:00' post='42']hello there[/quote]",
    );
    expect(q).toContain('class="ipsQuote"');
    expect(q).toContain("Alice");
    // The full date AND time survive (BBob would otherwise split on the spaces).
    expect(q).toContain("Jan 1 2026, 12:00");
    expect(q).toContain("hello there");
    // Author and timestamp are joined with the IP.Board-style separator.
    expect(q).toContain("@");
  });

  it("does not corrupt apostrophes in quote body text", () => {
    const q = renderBBCode("[quote name='Ana']it's a can't-miss 'deal'[/quote]");
    expect(q).toContain("it's a can't-miss 'deal'");
    expect(q).toContain("Ana");
  });

  it("renders a plain quote without a citation", () => {
    const q = renderBBCode("[quote]hi[/quote]");
    expect(q).toContain("<blockquote");
    expect(q).not.toContain("ipsQuote_citation");
  });

  it("keeps code content verbatim (no nested BBCode parsing)", () => {
    const c = renderBBCode("[code][b]not bold[/b]\nx < y[/code]");
    expect(c).toContain("<pre");
    expect(c).toContain("<code>");
    // The [b] tag stays literal and the < is escaped, not parsed.
    expect(c).toContain("[b]not bold[/b]");
    expect(c).toContain("x &lt; y");
    expect(c).not.toContain("<strong>");
  });

  it("renders spoiler as a details/summary toggle", () => {
    const s = renderBBCode("[spoiler]secret[/spoiler]");
    expect(s).toContain("<details");
    expect(s).toContain("<summary");
    expect(s).toContain("secret");
  });

  it("renders member mentions, acronyms and hr", () => {
    expect(renderBBCode("[member=Alice]")).toContain("@Alice");
    const ab = renderBBCode("[acronym=HyperText Markup Language]HTML[/acronym]");
    expect(ab).toContain('<abbr title="HyperText Markup Language"');
    expect(ab).toContain(">HTML</abbr>");
    expect(renderBBCode("[hr]")).toContain("<hr");
  });

  it("converts newlines to <br> outside code blocks", () => {
    const html = renderBBCode("line1\nline2");
    expect(html).toContain("line1<br>");
    expect(html).toContain("line2");
  });

  it("embeds YouTube via a privacy-friendly iframe", () => {
    const yt = renderBBCode("[youtube]dQw4w9WgXcQ[/youtube]");
    expect(yt).toContain("<iframe");
    expect(yt).toContain('src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"');
    const media = renderBBCode("[media]https://www.youtube.com/watch?v=dQw4w9WgXcQ[/media]");
    expect(media).toContain("youtube-nocookie.com/embed/dQw4w9WgXcQ");
  });

  it("renders emoticon codes as inline images", () => {
    const html = renderBBCode("hello ;) and :blink: now");
    const imgs = (html.match(/<img class="emoticon"/g) || []).length;
    expect(imgs).toBe(2);
    expect(html).toContain('alt=";)"');
    expect(html).toContain('alt=":blink:"');
    expect(html).toContain("data:image/gif;base64,");
  });

  it("does not turn emoticon codes inside code blocks into images", () => {
    const html = renderBBCode("[code]wink ;) here[/code]");
    expect(html).toContain("wink ;) here");
    expect(html).not.toContain('class="emoticon"');
  });

  it("leaves unknown tags as literal text", () => {
    const html = renderBBCode("[blink]x[/blink]");
    expect(html).toContain("[blink]x[/blink]");
  });

  // ---- security ----------------------------------------------------------
  it("strips raw <script> from text content", () => {
    const html = renderBBCode("[b]<script>alert(1)</script>[/b]");
    expect(html).not.toContain("<script>");
  });

  it("never emits a javascript: link href", () => {
    const html = renderBBCode("[url=javascript:alert(1)]x[/url]");
    expect(html.toLowerCase()).not.toContain('href="javascript:');
  });

  it("removes iframes whose src is not a whitelisted embed host", () => {
    // A crafted [media] pointing at a non-video host must not yield an iframe.
    const html = renderBBCode("[media]https://evil.test/x[/media]");
    expect(html).not.toContain("<iframe");
  });
});
