import { NextResponse } from "next/server";
import { parseChatId } from "@/lib/chat/validate-request";
import {
  getChatById,
  getDocumentsByChatId,
  getMessagesByChatId,
  softDeleteChat,
} from "@/lib/db/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const parsed = parseChatId(id);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const chat = await getChatById(parsed.chatId);

  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const [documents, messages] = await Promise.all([
    getDocumentsByChatId(parsed.chatId),
    getMessagesByChatId(parsed.chatId),
  ]);

  return NextResponse.json({ chat, documents, messages });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const parsed = parseChatId(id);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const chat = await getChatById(parsed.chatId);

  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  await softDeleteChat(parsed.chatId);

  return NextResponse.json({ success: true });
}
