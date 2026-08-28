import { NextResponse } from "next/server";
import {
  getChatById,
  getDocumentsByChatId,
  getMessagesByChatId,
} from "@/lib/db/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const chat = await getChatById(id);

  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const [documents, messages] = await Promise.all([
    getDocumentsByChatId(id),
    getMessagesByChatId(id),
  ]);

  return NextResponse.json({ chat, documents, messages });
}
