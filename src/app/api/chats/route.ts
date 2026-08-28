import { NextResponse } from "next/server";
import { createChat } from "@/lib/db/queries";

export async function POST() {
  const chat = await createChat();
  return NextResponse.json({ id: chat.id });
}
