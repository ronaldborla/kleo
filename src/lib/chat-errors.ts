import {
  GatewayFailedDependencyError,
  GatewayInternalServerError,
  GatewayModelNotFoundError,
  GatewayRateLimitError,
  GatewayResponseError,
} from "@ai-sdk/gateway";
import { RetryError } from "ai";

export const RATE_LIMIT_MESSAGE =
  "All configured models are rate-limited right now. Please wait a moment and try again.";

export const MODELS_UNAVAILABLE_MESSAGE =
  "All configured models are unavailable right now. Please wait a moment and try again.";

const RETRYABLE_STATUS_CODES = new Set([404, 408, 429, 500, 502, 503]);

export type ModelFallbackReason = "rate_limit" | "transient";

function hasRateLimitSignal(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    if (value instanceof Error) {
      return /rate.?limit|rate_limit_exceeded|429/i.test(value.message);
    }
    return false;
  }

  const error = value as Record<string, unknown>;

  if (error.statusCode === 429 || error.type === "rate_limit_exceeded") {
    return true;
  }

  if (error.name === "GatewayRateLimitError") {
    return true;
  }

  if (
    typeof error.message === "string" &&
    /rate.?limit|rate_limit_exceeded|429/i.test(error.message)
  ) {
    return true;
  }

  if ("lastError" in error && hasRateLimitSignal(error.lastError)) {
    return true;
  }

  if ("cause" in error && hasRateLimitSignal(error.cause)) {
    return true;
  }

  if (Array.isArray(error.errors)) {
    return error.errors.some((entry) => hasRateLimitSignal(entry));
  }

  return false;
}

function getStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const candidate = error as Record<string, unknown>;
  if (typeof candidate.statusCode === "number") {
    return candidate.statusCode;
  }

  return undefined;
}

function isGatewayTransientError(error: unknown) {
  if (error && typeof error === "object" && "name" in error) {
    const name = (error as { name?: string }).name;
    if (name === "GatewayTimeoutError") {
      return true;
    }
  }

  return (
    GatewayInternalServerError.isInstance(error) ||
    GatewayResponseError.isInstance(error) ||
    GatewayFailedDependencyError.isInstance(error) ||
    GatewayModelNotFoundError.isInstance(error)
  );
}

function isNonRetryableClientError(error: unknown) {
  const statusCode = getStatusCode(error);
  return statusCode === 400 || statusCode === 401 || statusCode === 403;
}

export function isRateLimitError(error: unknown): boolean {
  if (RetryError.isInstance(error)) {
    return hasRateLimitSignal(error.lastError) || hasRateLimitSignal(error);
  }

  return hasRateLimitSignal(error) || GatewayRateLimitError.isInstance(error);
}

export function isRetryableModelError(error: unknown): boolean {
  if (isNonRetryableClientError(error)) {
    return false;
  }

  if (isRateLimitError(error)) {
    return true;
  }

  if (isGatewayTransientError(error)) {
    return true;
  }

  const statusCode = getStatusCode(error);
  if (statusCode != null && RETRYABLE_STATUS_CODES.has(statusCode)) {
    return true;
  }

  if (error instanceof Error) {
    if (/timeout|timed out|503|502|500|404|model not found|unavailable/i.test(error.message)) {
      return true;
    }
  }

  if (RetryError.isInstance(error)) {
    return isRetryableModelError(error.lastError);
  }

  if (error && typeof error === "object" && "cause" in error) {
    return isRetryableModelError((error as { cause?: unknown }).cause);
  }

  return false;
}

export function getModelFallbackReason(error: unknown): ModelFallbackReason {
  return isRateLimitError(error) ? "rate_limit" : "transient";
}

export function getChatErrorMessage(error: unknown): string {
  if (isRateLimitError(error)) {
    return RATE_LIMIT_MESSAGE;
  }

  if (error instanceof Error && error.message === MODELS_UNAVAILABLE_MESSAGE) {
    return MODELS_UNAVAILABLE_MESSAGE;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong while generating a response. Please try again.";
}

export function getChatErrorStatus(error: unknown): number {
  if (isRateLimitError(error)) {
    return 429;
  }

  return 500;
}

export function getChatErrorTitle(message: string): string {
  if (message === RATE_LIMIT_MESSAGE) {
    return "Rate limited";
  }

  if (message === MODELS_UNAVAILABLE_MESSAGE) {
    return "Models unavailable";
  }

  return "Chat error";
}

export function parseChatClientError(error: Error): {
  title: string;
  message: string;
} {
  let candidate: unknown = error;

  try {
    const parsed = JSON.parse(error.message) as { error?: string };
    if (typeof parsed.error === "string") {
      candidate = { message: parsed.error };
    }
  } catch {
    // Keep the original error when the body is not JSON.
  }

  const message = getChatErrorMessage(candidate);
  return {
    title: getChatErrorTitle(message),
    message,
  };
}
