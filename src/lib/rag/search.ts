import { embed } from "ai";
import { sql } from "drizzle-orm";
import { EMBEDDING_MODEL, RETRIEVAL_LIMIT } from "@/lib/constants";
import { gateway } from "@/lib/ai/gateway";
import { db } from "@/lib/db";

export type RetrievedChunk = {
  id: string;
  content: string;
  filename: string;
  pageNumber: number | null;
  sectionHeading: string | null;
  similarity: number;
};

export async function searchRelevantChunks(
  chatId: string,
  query: string,
): Promise<RetrievedChunk[]> {
  const { embedding } = await embed({
    model: gateway.embeddingModel(EMBEDDING_MODEL),
    value: query,
  });

  const vectorLiteral = `[${embedding.join(",")}]`;

  const result = await db.execute<{
    id: string;
    content: string;
    filename: string;
    page_number: number | null;
    section_heading: string | null;
    similarity: number;
  }>(sql`
    SELECT
      c.id,
      c.content,
      d.filename,
      c.page_number,
      c.section_heading,
      1 - (c.embedding <=> ${vectorLiteral}::vector) AS similarity
    FROM chunks c
    INNER JOIN documents d ON d.id = c.document_id
    WHERE d.chat_id = ${chatId}
      AND d.status = 'ready'
      AND c.embedding IS NOT NULL
    ORDER BY c.embedding <=> ${vectorLiteral}::vector
    LIMIT ${RETRIEVAL_LIMIT}
  `);

  return result.rows.map((row) => ({
    id: row.id,
    content: row.content,
    filename: row.filename,
    pageNumber: row.page_number,
    sectionHeading: row.section_heading,
    similarity: Number(row.similarity),
  }));
}
