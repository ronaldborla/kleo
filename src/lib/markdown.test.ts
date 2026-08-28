import { describe, expect, it } from "vitest";
import { isSafeUrl, sanitizeMarkdownUrl } from "@/lib/markdown";

describe("isSafeUrl", () => {
  it("allows http and https links", () => {
    expect(isSafeUrl("https://example.com")).toBe(true);
    expect(isSafeUrl("http://example.com")).toBe(true);
  });

  it("allows mailto and relative links", () => {
    expect(isSafeUrl("mailto:hello@example.com")).toBe(true);
    expect(isSafeUrl("/docs/guide")).toBe(true);
  });

  it("blocks javascript and data urls", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  });
});

describe("sanitizeMarkdownUrl", () => {
  it("returns safe urls unchanged", () => {
    expect(sanitizeMarkdownUrl("https://example.com")).toBe(
      "https://example.com",
    );
  });

  it("returns empty string for unsafe urls", () => {
    expect(sanitizeMarkdownUrl("javascript:alert(1)")).toBe("");
  });
});
