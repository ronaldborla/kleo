import { and, asc, desc, eq, isNull, or } from "drizzle-orm";
import type { UIMessage } from "ai";
import type { KleoMessageMetadata } from "@/lib/chat/message-metadata";
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
  const [chat] = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, chatId), isNull(chats.deletedAt)));
  return chat ?? null;
}

export async function getRecentChats(limit: number) {
  return db
    .select()
    .from(chats)
    .where(isNull(chats.deletedAt))
    .orderBy(desc(chats.updatedAt))
    .limit(limit);
}

export async function softDeleteChat(chatId: string) {
  const [chat] = await db
    .update(chats)
    .set({ deletedAt: new Date() })
    .where(and(eq(chats.id, chatId), isNull(chats.deletedAt)))
    .returning();
  return chat ?? null;
}

export async function updateChatTitleIfDefault(chatId: string, title: string) {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) return;

  await db
    .update(chats)
    .set({ title: trimmedTitle, updatedAt: new Date() })
    .where(
      and(
        eq(chats.id, chatId),
        or(isNull(chats.title), eq(chats.title, ""), eq(chats.title, "New chat")),
      ),
    );
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

  return rows.map((row) => {
    const storedMetadata = row.metadata as KleoMessageMetadata | null;
    const metadata: KleoMessageMetadata | undefined =
      row.role === "assistant"
        ? {
            ...storedMetadata,
            createdAt:
              storedMetadata?.createdAt ?? row.createdAt.getTime(),
          }
        : undefined;

    return {
      id: row.id,
      role: row.role,
      parts: row.parts,
      metadata,
    } as UIMessage<KleoMessageMetadata>;
  });
}

export async function saveMessage(
  chatId: string,
  message: Pick<UIMessage<KleoMessageMetadata>, "id" | "role" | "parts" | "metadata">,
) {
  await db
    .insert(messages)
    .values({
      id: message.id,
      chatId,
      role: message.role,
      parts: message.parts,
      metadata: message.metadata ?? null,
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
    metadata: { createdAt: Date.now() },
  });
}
