const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

export function isSafeUrl(href: string): boolean {
  const trimmed = href.trim();
  if (!trimmed) return false;

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return true;
  }

  try {
    const url = new URL(trimmed, "https://example.com");
    return SAFE_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
}

export function sanitizeMarkdownUrl(href: string): string {
  return isSafeUrl(href) ? href : "";
}
