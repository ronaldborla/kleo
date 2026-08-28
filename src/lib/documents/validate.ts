import {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/constants";

export function extensionOf(filename: string) {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}

export type UploadValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function validateUploadFile(file: File): UploadValidationResult {
  const extension = extensionOf(file.name);

  if (
    !ALLOWED_MIME_TYPES.has(file.type) &&
    !ALLOWED_EXTENSIONS.has(extension)
  ) {
    return {
      ok: false,
      error: `"${file.name}" is not supported. Please upload a PDF, TXT, or Markdown file.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: `"${file.name}" exceeds the 10 MB limit.`,
    };
  }

  return { ok: true };
}
