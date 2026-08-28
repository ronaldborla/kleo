const DEFAULT_CHAT_TITLE = "New chat";
const MAX_TITLE_LENGTH = 60;

export function isDefaultChatTitle(title: string | null | undefined) {
  if (!title?.trim()) return true;
  return title.trim() === DEFAULT_CHAT_TITLE;
}

export function titleFromFilename(filename: string) {
  const withoutExtension = filename.replace(/\.[^.]+$/, "").trim();
  return truncateTitle(withoutExtension || filename);
}

export function titleFromUserMessage(text: string) {
  const firstLine = text.split("\n").find((line) => line.trim())?.trim() ?? text.trim();
  return truncateTitle(firstLine);
}

function truncateTitle(title: string) {
  if (title.length <= MAX_TITLE_LENGTH) return title;
  return `${title.slice(0, MAX_TITLE_LENGTH - 1).trimEnd()}…`;
}
