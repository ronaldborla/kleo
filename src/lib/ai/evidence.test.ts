import { describe, expect, it } from "vitest";
import {
  buildEvidenceFromChunks,
  getShowEvidenceData,
  hasShowEvidencePart,
  isShowEvidenceStreamChunk,
} from "@/lib/ai/evidence";
import type { RetrievedChunk } from "@/lib/rag/search";

const sampleChunks: RetrievedChunk[] = [
  {
    id: "chunk-1",
    filename: "report.pdf",
    content: "Revenue increased in Q4.",
    pageNumber: 3,
    sectionHeading: null,
    similarity: 0.9,
  },
  {
    id: "chunk-2",
    filename: "report.pdf",
    content: "Costs remained flat.",
    pageNumber: 4,
    sectionHeading: "Costs",
    similarity: 0.7,
  },
];

describe("buildEvidenceFromChunks", () => {
  it("returns null for empty chunks", () => {
    expect(buildEvidenceFromChunks([])).toBeNull();
  });

  it("maps similarity to relevance tiers", () => {
    const evidence = buildEvidenceFromChunks(sampleChunks);

    expect(evidence?.sources[0].relevance).toBe("high");
    expect(evidence?.sources[1].relevance).toBe("medium");
  });

  it("truncates long excerpts", () => {
    const evidence = buildEvidenceFromChunks([
      {
        ...sampleChunks[0],
        content: "x".repeat(300),
        similarity: 0.5,
      },
    ]);

    expect(evidence?.sources[0].excerpt.length).toBeLessThanOrEqual(240);
    expect(evidence?.sources[0].relevance).toBe("low");
  });
});

describe("getShowEvidenceData", () => {
  it("reads output-available evidence", () => {
    const data = getShowEvidenceData({
      state: "output-available",
      output: {
        summary: "Sources",
        sources: [],
      },
    });

    expect(data).toEqual({ summary: "Sources", sources: [] });
  });

  it("rejects invalid shapes", () => {
    expect(getShowEvidenceData({ state: "output-available", output: {} })).toBeNull();
    expect(getShowEvidenceData(null)).toBeNull();
  });
});

describe("hasShowEvidencePart", () => {
  it("detects showEvidence tool parts", () => {
    expect(
      hasShowEvidencePart({
        parts: [
          {
            type: "tool-showEvidence",
            toolCallId: "1",
            state: "output-available",
            input: { summary: "Sources", sources: [] },
            output: { summary: "Sources", sources: [] },
          },
        ],
      }),
    ).toBe(true);
  });
});

describe("isShowEvidenceStreamChunk", () => {
  it("matches showEvidence stream chunks", () => {
    expect(
      isShowEvidenceStreamChunk({
        type: "tool-input-start",
        toolName: "showEvidence",
      }),
    ).toBe(true);

    expect(
      isShowEvidenceStreamChunk({
        type: "tool-input-start",
        toolName: "other",
      }),
    ).toBe(false);
  });
});
