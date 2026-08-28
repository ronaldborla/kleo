import { NextResponse } from "next/server";
import { titleFromFilename } from "@/lib/chat/title";
import { uploadFileToChat } from "@/lib/documents/upload-to-chat";
import { validateUploadFile } from "@/lib/documents/validate";
import {
  createChat,
  getRecentChats,
  softDeleteChat,
} from "@/lib/db/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    Math.max(Number.parseInt(searchParams.get("limit") ?? "10", 10) || 10, 1),
    50,
  );

  const chats = await getRecentChats(limit);
  return NextResponse.json({ chats });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "A document file is required to create a chat." },
      { status: 400 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const validation = validateUploadFile(file);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const chat = await createChat(titleFromFilename(file.name));

  try {
    const document = await uploadFileToChat(chat.id, file);
    return NextResponse.json({ id: chat.id, document });
  } catch (error) {
    await softDeleteChat(chat.id);
    console.error("Create chat upload failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to upload document.",
      },
      { status: 500 },
    );
  }
}
