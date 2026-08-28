import { generateId } from "ai";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/constants";
import { ingestDocument } from "@/lib/documents/ingest";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import {
  getChatById,
  saveUploadNoticeMessage,
} from "@/lib/db/queries";

function extensionOf(filename: string) {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}

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

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds the 10 MB limit." },
        { status: 400 },
      );
    }

    const extension = extensionOf(file.name);
    if (
      !ALLOWED_MIME_TYPES.has(file.type) &&
      !ALLOWED_EXTENSIONS.has(extension)
    ) {
      return NextResponse.json(
        { error: "Only PDF, TXT, and Markdown files are supported." },
        { status: 400 },
      );
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
      generateId(),
    );

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
