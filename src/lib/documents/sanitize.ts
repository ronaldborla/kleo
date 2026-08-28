const MAX_FILENAME_LENGTH = 255;

export function sanitizeFilename(filename: string): string {
  const withoutControlChars = filename.replace(/[\u0000-\u001f\u007f]/g, "");
  const trimmed = withoutControlChars.trim();

  if (!trimmed) {
    return "upload";
  }

  if (trimmed.length <= MAX_FILENAME_LENGTH) {
    return trimmed;
  }

  const extensionIndex = trimmed.lastIndexOf(".");
  if (extensionIndex > 0 && extensionIndex > trimmed.length - 12) {
    const extension = trimmed.slice(extensionIndex);
    const base = trimmed.slice(0, MAX_FILENAME_LENGTH - extension.length);
    return `${base}${extension}`;
  }

  return trimmed.slice(0, MAX_FILENAME_LENGTH);
}
