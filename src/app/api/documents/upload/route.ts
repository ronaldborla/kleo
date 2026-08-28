import { NextResponse } from "next/server";
import { getSafeClientErrorMessage } from "@/lib/chat-errors";
import { parseChatId } from "@/lib/chat/validate-request";
import { validateUploadFile } from "@/lib/documents/validate";
import { uploadFileToChat } from "@/lib/documents/upload-to-chat";
import { getChatById } from "@/lib/db/queries";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const chatIdValue = formData.get("chatId");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const parsedChatId = parseChatId(chatIdValue);
    if (!parsedChatId.ok) {
      return NextResponse.json({ error: parsedChatId.error }, { status: 400 });
    }

    const validation = validateUploadFile(file);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const chat = await getChatById(parsedChatId.chatId);
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const document = await uploadFileToChat(parsedChatId.chatId, file);
    return NextResponse.json({ document });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json(
      {
        error: getSafeClientErrorMessage(
          error,
          "Failed to upload document. Please try again.",
        ),
      },
      { status: 500 },
    );
  }
}
