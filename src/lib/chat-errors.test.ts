import { describe, expect, it } from "vitest";
import {
  GatewayRateLimitError,
} from "@ai-sdk/gateway";
import {
  getChatErrorMessage,
  getChatErrorStatus,
  getChatErrorTitle,
  getModelFallbackReason,
  getSafeClientErrorMessage,
  isRateLimitError,
  isRetryableModelError,
  MODELS_UNAVAILABLE_MESSAGE,
  parseChatClientError,
  RATE_LIMIT_MESSAGE,
} from "@/lib/chat-errors";

describe("isRateLimitError", () => {
  it("detects gateway rate limit errors", () => {
    const error = new GatewayRateLimitError({
      message: "Rate limit exceeded",
      statusCode: 429,
    });

    expect(isRateLimitError(error)).toBe(true);
  });

  it("detects rate limit messages", () => {
    expect(isRateLimitError(new Error("rate_limit_exceeded"))).toBe(true);
  });
});

describe("isRetryableModelError", () => {
  it("rejects non-retryable client errors", () => {
    expect(isRetryableModelError({ statusCode: 401 })).toBe(false);
    expect(isRetryableModelError({ statusCode: 403 })).toBe(false);
  });

  it("accepts retryable status codes", () => {
    expect(isRetryableModelError({ statusCode: 429 })).toBe(true);
    expect(isRetryableModelError({ statusCode: 503 })).toBe(true);
  });
});

describe("getModelFallbackReason", () => {
  it("returns rate_limit for rate limit errors", () => {
    expect(getModelFallbackReason({ statusCode: 429 })).toBe("rate_limit");
  });

  it("returns transient for other retryable errors", () => {
    expect(getModelFallbackReason({ statusCode: 503 })).toBe("transient");
  });
});

describe("getSafeClientErrorMessage", () => {
  it("returns known safe messages", () => {
    expect(getSafeClientErrorMessage({ statusCode: 429 })).toBe(
      RATE_LIMIT_MESSAGE,
    );
    expect(
      getSafeClientErrorMessage(new Error(MODELS_UNAVAILABLE_MESSAGE)),
    ).toBe(MODELS_UNAVAILABLE_MESSAGE);
  });

  it("returns generic fallback for unexpected errors", () => {
    expect(
      getSafeClientErrorMessage(
        new Error("relation \"chats\" does not exist"),
        "Failed.",
      ),
    ).toBe("Failed.");
  });
});

describe("getChatErrorMessage", () => {
  it("returns raw error messages for client parsing", () => {
    expect(getChatErrorMessage(new Error("Custom error"))).toBe("Custom error");
  });
});

describe("getChatErrorStatus", () => {
  it("returns 429 for rate limits", () => {
    expect(getChatErrorStatus({ statusCode: 429 })).toBe(429);
  });

  it("returns 500 for other errors", () => {
    expect(getChatErrorStatus(new Error("boom"))).toBe(500);
  });
});

describe("getChatErrorTitle", () => {
  it("maps known messages to titles", () => {
    expect(getChatErrorTitle(RATE_LIMIT_MESSAGE)).toBe("Rate limited");
    expect(getChatErrorTitle(MODELS_UNAVAILABLE_MESSAGE)).toBe(
      "Models unavailable",
    );
    expect(getChatErrorTitle("Other")).toBe("Chat error");
  });
});

describe("parseChatClientError", () => {
  it("parses JSON error bodies", () => {
    const result = parseChatClientError(
      new Error(JSON.stringify({ error: "Invalid chat request." })),
    );

    expect(result.message).toBe("Invalid chat request.");
    expect(result.title).toBe("Chat error");
  });
});
