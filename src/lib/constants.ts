export const CHAT_MODEL = "openai/gpt-4o-mini";
export const EMBEDDING_MODEL = "openai/text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
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
