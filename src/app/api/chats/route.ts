import { NextResponse } from "next/server";
import { createChat, getRecentChats } from "@/lib/db/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    Math.max(Number.parseInt(searchParams.get("limit") ?? "10", 10) || 10, 1),
    50,
  );

  const chats = await getRecentChats(limit);
  return NextResponse.json({ chats });
}

export async function POST() {
  const chat = await createChat();
  return NextResponse.json({ id: chat.id });
}
