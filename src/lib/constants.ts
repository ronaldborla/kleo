/** Primary model — best quality for RAG + tool calling. */
export const CHAT_MODEL = "openai/gpt-4o-mini";

/** Free-tier models used only when the primary or earlier fallbacks fail. */
export const CHAT_MODEL_FALLBACKS = [
  "inclusionai/ling-3.0-flash-fin-free",
  "minimax/minimax-m3-free",
  "minimax/minimax-m2.7-free",
  "poolside/laguna-s-2.1-free",
] as const;

export const CHAT_MODEL_CHAIN = [
  CHAT_MODEL,
  ...CHAT_MODEL_FALLBACKS,
] as const;

export const EMBEDDING_MODEL = "openai/text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_USER_MESSAGE_CHARS = 8_000;
export const MAX_CHAT_HISTORY_MESSAGES = 100;
export const CHUNK_SIZE = 800;
export const CHUNK_OVERLAP = 150;
export const RETRIEVAL_LIMIT = 6;

export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
]);

export const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".txt",
  ".md",
  ".markdown",
]);
