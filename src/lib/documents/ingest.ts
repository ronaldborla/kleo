import { embedMany } from "ai";
import { eq } from "drizzle-orm";
import { EMBEDDING_MODEL } from "@/lib/constants";
import { gateway } from "@/lib/ai/gateway";
import { chunkSegments } from "@/lib/documents/chunk";
import { parseDocument } from "@/lib/documents/parse";
import { db } from "@/lib/db";
import { chunks, documents } from "@/lib/db/schema";

const EMBED_BATCH_SIZE = 20;

export async function ingestDocument(
  documentId: string,
  filename: string,
  mimeType: string,
  buffer: ArrayBuffer,
) {
  try {
    const { segments, pageCount } = await parseDocument(
      filename,
      mimeType,
      buffer,
    );
    const documentChunks = chunkSegments(segments);

    if (documentChunks.length === 0) {
      throw new Error("No readable text found in the uploaded file.");
    }

    for (let i = 0; i < documentChunks.length; i += EMBED_BATCH_SIZE) {
      const batch = documentChunks.slice(i, i + EMBED_BATCH_SIZE);
      const { embeddings } = await embedMany({
        model: gateway.embeddingModel(EMBEDDING_MODEL),
        values: batch.map((chunk) => chunk.content),
      });

      await db.insert(chunks).values(
        batch.map((chunk, index) => ({
          documentId,
          content: chunk.content,
          pageNumber: chunk.pageNumber,
          sectionHeading: chunk.sectionHeading,
          chunkIndex: chunk.chunkIndex,
          tokenCount: chunk.tokenCount,
          embedding: embeddings[index],
        })),
      );
    }

    await db
      .update(documents)
      .set({
        status: "ready",
        pageCount,
        errorMessage: null,
      })
      .where(eq(documents.id, documentId));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process document.";

    await db
      .update(documents)
      .set({
        status: "failed",
        errorMessage: message,
      })
      .where(eq(documents.id, documentId));

    throw error;
  }
}
