import { createMessageId } from "@/lib/id";
import { eq } from "drizzle-orm";
import { validateUploadFile } from "@/lib/documents/validate";
import { ingestDocument } from "@/lib/documents/ingest";
import { titleFromFilename } from "@/lib/chat/title";
import {
  getChatById,
  saveUploadNoticeMessage,
  updateChatTitleIfDefault,
} from "@/lib/db/queries";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";

export async function uploadFileToChat(chatId: string, file: File) {
  const chat = await getChatById(chatId);
  if (!chat) {
    throw new Error("Chat not found");
  }

  const validation = validateUploadFile(file);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const [document] = await db
    .insert(documents)
    .values({
      chatId,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      status: "processing",
    })
    .returning();

  const buffer = await file.arrayBuffer();

  await ingestDocument(
    document.id,
    file.name,
    file.type || "application/octet-stream",
    buffer,
  );

  const [updatedDocument] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, document.id));

  const pageLabel =
    updatedDocument.pageCount != null
      ? `${updatedDocument.pageCount} page${updatedDocument.pageCount === 1 ? "" : "s"}`
      : "ready";

  await saveUploadNoticeMessage(
    chatId,
    `Uploaded **${file.name}** (${pageLabel}). You can now ask questions about this document.`,
    createMessageId(),
  );

  await updateChatTitleIfDefault(chatId, titleFromFilename(file.name));

  return updatedDocument;
}
