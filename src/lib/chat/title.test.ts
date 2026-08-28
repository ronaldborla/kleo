import { describe, expect, it } from "vitest";
import {
  isDefaultChatTitle,
  titleFromFilename,
  titleFromUserMessage,
} from "@/lib/chat/title";

describe("isDefaultChatTitle", () => {
  it("treats empty and default titles as default", () => {
    expect(isDefaultChatTitle(null)).toBe(true);
    expect(isDefaultChatTitle("")).toBe(true);
    expect(isDefaultChatTitle("New chat")).toBe(true);
  });

  it("rejects custom titles", () => {
    expect(isDefaultChatTitle("Quarterly report")).toBe(false);
  });
});

describe("titleFromFilename", () => {
  it("removes the extension", () => {
    expect(titleFromFilename("quarterly-report.pdf")).toBe("quarterly-report");
  });

  it("truncates long filenames", () => {
    const title = titleFromFilename(`${"a".repeat(80)}.pdf`);
    expect(title.length).toBeLessThanOrEqual(60);
    expect(title.endsWith("…")).toBe(true);
  });
});

describe("titleFromUserMessage", () => {
  it("uses the first non-empty line", () => {
    expect(titleFromUserMessage("\n\nWhat is revenue?\nMore detail")).toBe(
      "What is revenue?",
    );
  });

  it("truncates long messages", () => {
    const title = titleFromUserMessage("x".repeat(100));
    expect(title.length).toBeLessThanOrEqual(60);
  });
});
