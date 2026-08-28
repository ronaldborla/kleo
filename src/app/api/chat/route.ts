import {
  convertToModelMessages,
  generateId,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { CHAT_MODEL } from "@/lib/constants";
import { gateway } from "@/lib/ai/gateway";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { chatTools } from "@/lib/ai/tools";
import { getChatById, saveMessage } from "@/lib/db/queries";
import { searchRelevantChunks } from "@/lib/rag/search";

export const maxDuration = 60;

function getLastUserQuery(messages: UIMessage[]) {
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
    const messages = body.messages as UIMessage[] | undefined;
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
    const retrievedChunks = query
      ? await searchRelevantChunks(chatId, query)
      : [];

    const result = streamText({
      model: gateway.languageModel(CHAT_MODEL),
      system: buildSystemPrompt(retrievedChunks),
      messages: await convertToModelMessages(messages),
      tools: chatTools,
      stopWhen: stepCountIs(2),
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      generateMessageId: generateId,
      onFinish: async ({ responseMessage }) => {
        await saveMessage(chatId, responseMessage);
      },
    });
  } catch (error) {
    console.error("Chat failed:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Chat request failed.",
      },
      { status: 500 },
    );
  }
}
