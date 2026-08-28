import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatMessageTimestamp,
  formatResponseFooter,
} from "@/lib/chat/message-metadata";

describe("formatMessageTimestamp", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when no timestamp is provided", () => {
    expect(formatMessageTimestamp()).toBeNull();
  });

  it("formats timestamps with locale settings", () => {
    vi.spyOn(Date.prototype, "toLocaleString").mockReturnValue(
      "Aug 28, 2026, 1:00 PM",
    );

    expect(formatMessageTimestamp(Date.parse("2026-08-28T05:00:00.000Z"))).toBe(
      "Aug 28, 2026, 1:00 PM",
    );
  });
});

describe("formatResponseFooter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("combines model and timestamp", () => {
    vi.spyOn(Date.prototype, "toLocaleString").mockReturnValue(
      "Aug 28, 2026, 1:00 PM",
    );

    expect(
      formatResponseFooter({
        model: "openai/gpt-4o-mini",
        createdAt: Date.parse("2026-08-28T05:00:00.000Z"),
      }),
    ).toBe("gpt-4o-mini · Aug 28, 2026, 1:00 PM");
  });

  it("returns only the model when timestamp is missing", () => {
    expect(formatResponseFooter({ model: "openai/gpt-4o-mini" })).toBe(
      "gpt-4o-mini",
    );
  });
});
