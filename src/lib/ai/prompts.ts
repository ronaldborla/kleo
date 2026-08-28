import type { RetrievedChunk } from "@/lib/rag/search";

export function buildSystemPrompt(chunks: RetrievedChunk[]) {
  const contextBlock =
    chunks.length === 0
      ? "No document context is available yet. Ask the user to upload a PDF, TXT, or Markdown file before answering document-specific questions."
      : chunks
          .map((chunk, index) => {
            const location = chunk.pageNumber
              ? `page ${chunk.pageNumber}`
              : chunk.sectionHeading
                ? `section "${chunk.sectionHeading}"`
                : "document";
            return `[Source ${index + 1}] ${chunk.filename} (${location})\n${chunk.content}`;
          })
          .join("\n\n---\n\n");

  return `You are Kleo, a helpful document assistant. Answer questions using only the provided document context.

Rules:
- If the answer is not supported by the context, say you cannot find it in the document.
- When you make factual claims grounded in the document, call the showEvidence tool with the supporting sources.
- Include filename, page or section, and a short excerpt for each source.
- Keep answers concise and conversational.
- Do not invent citations.

Document context:
${contextBlock}`;
}
