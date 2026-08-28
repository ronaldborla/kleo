import { CHUNK_OVERLAP, CHUNK_SIZE } from "@/lib/constants";
import type { ParsedSegment } from "@/lib/documents/parse";

export type DocumentChunk = {
  content: string;
  pageNumber: number | null;
  sectionHeading: string | null;
  chunkIndex: number;
  tokenCount: number;
};

function estimateTokens(text: string) {
  return Math.ceil(text.length / 4);
}

export function chunkSegments(segments: ParsedSegment[]): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  let chunkIndex = 0;

  for (const segment of segments) {
    const text = segment.content.trim();
    if (!text) continue;

    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + CHUNK_SIZE, text.length);
      const content = text.slice(start, end).trim();

      if (content.length > 0) {
        chunks.push({
          content,
          pageNumber: segment.pageNumber,
          sectionHeading: segment.sectionHeading,
          chunkIndex,
          tokenCount: estimateTokens(content),
        });
        chunkIndex += 1;
      }

      if (end >= text.length) break;
      start = Math.max(end - CHUNK_OVERLAP, start + 1);
    }
  }

  return chunks;
}
