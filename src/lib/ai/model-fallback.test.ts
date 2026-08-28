import { describe, expect, it } from "vitest";
import {
  buildModelFallbackNotice,
  formatModelLabel,
} from "@/lib/ai/model-fallback";

describe("formatModelLabel", () => {
  it("returns the segment after the slash", () => {
    expect(formatModelLabel("openai/gpt-4o-mini")).toBe("gpt-4o-mini");
  });

  it("returns the original id when there is no slash", () => {
    expect(formatModelLabel("gpt-4o-mini")).toBe("gpt-4o-mini");
  });
});

describe("buildModelFallbackNotice", () => {
  it("describes rate limit fallbacks", () => {
    expect(
      buildModelFallbackNotice(
        "openai/gpt-4o-mini",
        "minimax/minimax-m3-free",
        "rate_limit",
      ),
    ).toContain("rate-limited");
  });

  it("describes transient fallbacks", () => {
    expect(
      buildModelFallbackNotice(
        "openai/gpt-4o-mini",
        "minimax/minimax-m3-free",
        "transient",
      ),
    ).toContain("temporarily unavailable");
  });
});
