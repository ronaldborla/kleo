import { describe, expect, it } from "vitest";
import { sanitizeFilename } from "@/lib/documents/sanitize";

describe("sanitizeFilename", () => {
  it("strips control characters", () => {
    expect(sanitizeFilename("report\u0007.pdf")).toBe("report.pdf");
  });

  it("falls back when the filename is empty", () => {
    expect(sanitizeFilename("   ")).toBe("upload");
  });

  it("truncates very long filenames", () => {
    const sanitized = sanitizeFilename(`${"a".repeat(300)}.pdf`);
    expect(sanitized.length).toBeLessThanOrEqual(255);
    expect(sanitized.endsWith(".pdf")).toBe(true);
  });
});
