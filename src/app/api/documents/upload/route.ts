import { createMessageId } from "@/lib/id";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { validateUploadFile } from "@/lib/documents/validate";
import { ingestDocument } from "@/lib/documents/ingest";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { titleFromFilename } from "@/lib/chat/title";
import {
  getChatById,
  saveUploadNoticeMessage,
  updateChatTitleIfDefault,
} from "@/lib/db/queries";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const chatId = formData.get("chatId");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (typeof chatId !== "string" || !chatId) {
      return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
    }

    const chat = await getChatById(chatId);
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const validation = validateUploadFile(file);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
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

    return NextResponse.json({ document: updatedDocument });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to upload document.",
      },
      { status: 500 },
    );
  }
}
