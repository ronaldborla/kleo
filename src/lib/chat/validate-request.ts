import { z } from "zod";
import {
  MAX_CHAT_HISTORY_MESSAGES,
  MAX_USER_MESSAGE_CHARS,
} from "@/lib/constants";
import type { KleoUIMessage } from "@/lib/chat/message-metadata";

export const chatIdSchema = z.string().uuid();

const textPartSchema = z.object({
  type: z.literal("text"),
  text: z.string().min(1).max(MAX_USER_MESSAGE_CHARS),
});

const userMessageSchema = z.object({
  id: z.string().min(1),
  role: z.literal("user"),
  parts: z.array(textPartSchema).min(1),
});

const messageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  parts: z.array(z.unknown()),
});

export const chatRequestSchema = z.object({
  chatId: chatIdSchema,
  messages: z
    .array(messageSchema)
    .min(1)
    .max(MAX_CHAT_HISTORY_MESSAGES),
});

export type ParsedChatRequest = {
  chatId: string;
  newUserMessage: z.infer<typeof userMessageSchema>;
};

export function parseChatRequest(
  body: unknown,
):
  | { ok: true; data: ParsedChatRequest }
  | { ok: false; error: string } {
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, error: "Invalid chat request." };
  }

  const lastMessage = parsed.data.messages[parsed.data.messages.length - 1];
  const userParsed = userMessageSchema.safeParse(lastMessage);
  if (!userParsed.success) {
    return {
      ok: false,
      error: "Last message must be a user text message.",
    };
  }

  return {
    ok: true,
    data: {
      chatId: parsed.data.chatId,
      newUserMessage: userParsed.data,
    },
  };
}

export function parseChatId(
  value: unknown,
): { ok: true; chatId: string } | { ok: false; error: string } {
  const parsed = chatIdSchema.safeParse(value);
  if (!parsed.success) {
    return { ok: false, error: "Invalid chat id." };
  }

  return { ok: true, chatId: parsed.data };
}

export function getUserMessageText(
  message: Pick<KleoUIMessage, "parts">,
): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}
