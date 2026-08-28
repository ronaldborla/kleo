import { NextResponse } from "next/server";
import { uploadFileToChat } from "@/lib/documents/upload-to-chat";
import { getChatById } from "@/lib/db/queries";

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

    const document = await uploadFileToChat(chatId, file);
    return NextResponse.json({ document });
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
