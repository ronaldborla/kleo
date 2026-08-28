import { describe, expect, it } from "vitest";
import { CHUNK_SIZE } from "@/lib/constants";
import { chunkSegments } from "@/lib/documents/chunk";

describe("chunkSegments", () => {
  it("skips empty segments", () => {
    expect(
      chunkSegments([
        { content: "   ", pageNumber: 1, sectionHeading: null },
      ]),
    ).toEqual([]);
  });

  it("creates a single chunk for short text", () => {
    const chunks = chunkSegments([
      {
        content: "Short paragraph.",
        pageNumber: 2,
        sectionHeading: "Intro",
      },
    ]);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({
      content: "Short paragraph.",
      pageNumber: 2,
      sectionHeading: "Intro",
      chunkIndex: 0,
      tokenCount: 4,
    });
  });

  it("splits long text into multiple chunks", () => {
    const longText = "a".repeat(CHUNK_SIZE + 200);
    const chunks = chunkSegments([
      { content: longText, pageNumber: null, sectionHeading: null },
    ]);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].chunkIndex).toBe(0);
    expect(chunks[1].chunkIndex).toBe(1);
  });
});
