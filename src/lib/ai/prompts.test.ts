import { describe, expect, it } from "vitest";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import type { RetrievedChunk } from "@/lib/rag/search";

describe("buildSystemPrompt", () => {
  it("asks for upload when there is no context", () => {
    const prompt = buildSystemPrompt([]);

    expect(prompt).toContain("No document context is available yet");
    expect(prompt).toContain("<document_context>");
  });

  it("includes source blocks and untrusted framing", () => {
    const chunks: RetrievedChunk[] = [
      {
        id: "chunk-1",
        filename: "report.pdf",
        content: "Revenue grew.",
        pageNumber: 2,
        sectionHeading: null,
        similarity: 0.9,
      },
    ];

    const prompt = buildSystemPrompt(chunks);

    expect(prompt).toContain('[Source 1] report.pdf (page 2)');
    expect(prompt).toContain("Revenue grew.");
    expect(prompt).toContain("untrusted reference data");
    expect(prompt).toContain("</document_context>");
  });
});
