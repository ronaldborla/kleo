import { createChatStreamResponse } from "@/lib/ai/chat-stream";
import { titleFromUserMessage } from "@/lib/chat/title";
import {
  getChatErrorStatus,
  getSafeClientErrorMessage,
} from "@/lib/chat-errors";
import {
  getChatById,
  getMessagesByChatId,
  saveMessage,
  updateChatTitleIfDefault,
} from "@/lib/db/queries";
import {
  getUserMessageText,
  parseChatRequest,
} from "@/lib/chat/validate-request";
import { searchRelevantChunks } from "@/lib/rag/search";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = parseChatRequest(body);

    if (!parsed.ok) {
      return Response.json({ error: parsed.error }, { status: 400 });
    }

    const { chatId, newUserMessage } = parsed.data;

    const chat = await getChatById(chatId);
    if (!chat) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }

    const existingMessages = await getMessagesByChatId(chatId);
    const query = getUserMessageText(newUserMessage);

    await saveMessage(chatId, newUserMessage);

    if (query) {
      await updateChatTitleIfDefault(chatId, titleFromUserMessage(query));
    }

    const messagesForModel = [...existingMessages, newUserMessage];
    const retrievedChunks = query
      ? await searchRelevantChunks(chatId, query)
      : [];

    return createChatStreamResponse({
      messages: messagesForModel,
      retrievedChunks,
      onFinish: async (responseMessage) => {
        await saveMessage(chatId, responseMessage);
      },
    });
  } catch (error) {
    console.error("Chat failed:", error);
    return Response.json(
      {
        error: getSafeClientErrorMessage(
          error,
          "Failed to generate a response. Please try again.",
        ),
      },
      { status: getChatErrorStatus(error) },
    );
  }
}
