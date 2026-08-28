import type { KleoUIMessage } from "@/lib/chat/message-metadata";
import { createChatStreamResponse } from "@/lib/ai/chat-stream";
import { titleFromUserMessage } from "@/lib/chat/title";
import {
  getChatById,
  saveMessage,
  updateChatTitleIfDefault,
} from "@/lib/db/queries";
import {
  getChatErrorMessage,
  getChatErrorStatus,
} from "@/lib/chat-errors";
import { searchRelevantChunks } from "@/lib/rag/search";

export const maxDuration = 60;

function getLastUserQuery(messages: KleoUIMessage[]) {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUserMessage) return "";

  return lastUserMessage.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages = body.messages as KleoUIMessage[] | undefined;
    const chatId = body.chatId as string | undefined;

    if (!messages?.length) {
      return Response.json({ error: "Messages are required" }, { status: 400 });
    }

    if (!chatId) {
      return Response.json({ error: "Missing chatId" }, { status: 400 });
    }

    const chat = await getChatById(chatId);
    if (!chat) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === "user") {
      await saveMessage(chatId, lastMessage);
    }

    const query = getLastUserQuery(messages);
    if (query) {
      await updateChatTitleIfDefault(chatId, titleFromUserMessage(query));
    }
    const retrievedChunks = query
      ? await searchRelevantChunks(chatId, query)
      : [];

    return createChatStreamResponse({
      messages,
      retrievedChunks,
      onFinish: async (responseMessage) => {
        await saveMessage(chatId, responseMessage);
      },
    });
  } catch (error) {
    console.error("Chat failed:", error);
    return Response.json(
      {
        error: getChatErrorMessage(error),
      },
      { status: getChatErrorStatus(error) },
    );
  }
}
