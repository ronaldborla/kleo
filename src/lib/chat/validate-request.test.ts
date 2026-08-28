import { describe, expect, it } from "vitest";
import { MAX_USER_MESSAGE_CHARS } from "@/lib/constants";
import {
  getUserMessageText,
  parseChatId,
  parseChatRequest,
} from "@/lib/chat/validate-request";

const validChatId = "550e8400-e29b-41d4-a716-446655440000";

describe("parseChatId", () => {
  it("accepts valid UUIDs", () => {
    expect(parseChatId(validChatId)).toEqual({
      ok: true,
      chatId: validChatId,
    });
  });

  it("rejects invalid ids", () => {
    expect(parseChatId("not-a-uuid")).toEqual({
      ok: false,
      error: "Invalid chat id.",
    });
  });
});

describe("parseChatRequest", () => {
  it("accepts a valid chat request", () => {
    const result = parseChatRequest({
      chatId: validChatId,
      messages: [
        {
          id: "1",
          role: "user",
          parts: [{ type: "text", text: "Hello" }],
        },
      ],
    });

    expect(result.ok).toBe(true);
  });

  it("rejects non-user final messages", () => {
    const result = parseChatRequest({
      chatId: validChatId,
      messages: [
        {
          id: "1",
          role: "assistant",
          parts: [{ type: "text", text: "Hello" }],
        },
      ],
    });

    expect(result).toEqual({
      ok: false,
      error: "Last message must be a user text message.",
    });
  });

  it("rejects oversized user text", () => {
    const result = parseChatRequest({
      chatId: validChatId,
      messages: [
        {
          id: "1",
          role: "user",
          parts: [{ type: "text", text: "x".repeat(MAX_USER_MESSAGE_CHARS + 1) }],
        },
      ],
    });

    expect(result).toEqual({
      ok: false,
      error: "Last message must be a user text message.",
    });
  });
});

describe("getUserMessageText", () => {
  it("joins text parts", () => {
    expect(
      getUserMessageText({
        parts: [
          { type: "text", text: "Line 1" },
          { type: "text", text: "Line 2" },
        ],
      }),
    ).toBe("Line 1\nLine 2");
  });
});
