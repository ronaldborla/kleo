import { asc, desc, eq } from "drizzle-orm";
import type { UIMessage } from "ai";
import { db } from "@/lib/db";
import { chats, documents, messages } from "@/lib/db/schema";

export async function createChat(title?: string) {
  const [chat] = await db
    .insert(chats)
    .values({ title: title ?? "New chat" })
    .returning();
  return chat;
}

export async function getChatById(chatId: string) {
  const [chat] = await db.select().from(chats).where(eq(chats.id, chatId));
  return chat ?? null;
}

export async function getDocumentsByChatId(chatId: string) {
  return db
    .select()
    .from(documents)
    .where(eq(documents.chatId, chatId))
    .orderBy(desc(documents.createdAt));
}

export async function getMessagesByChatId(chatId: string) {
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(asc(messages.createdAt));

  return rows.map(
    (row) =>
      ({
        id: row.id,
        role: row.role,
        parts: row.parts,
      }) as UIMessage,
  );
}

export async function saveMessage(
  chatId: string,
  message: Pick<UIMessage, "id" | "role" | "parts">,
) {
  await db
    .insert(messages)
    .values({
      id: message.id,
      chatId,
      role: message.role,
      parts: message.parts,
    })
    .onConflictDoNothing();

  await db
    .update(chats)
    .set({ updatedAt: new Date() })
    .where(eq(chats.id, chatId));
}

export async function saveUploadNoticeMessage(
  chatId: string,
  text: string,
  messageId: string,
) {
  await saveMessage(chatId, {
    id: messageId,
    role: "assistant",
    parts: [{ type: "text", text }],
  });
}
