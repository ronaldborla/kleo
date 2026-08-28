export type ParsedSegment = {
  content: string;
  pageNumber: number | null;
  sectionHeading: string | null;
};

function extensionOf(filename: string) {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}

export async function parseDocument(
  filename: string,
  mimeType: string,
  buffer: ArrayBuffer,
): Promise<{ segments: ParsedSegment[]; pageCount: number | null }> {
  const extension = extensionOf(filename);

  if (mimeType === "application/pdf" || extension === ".pdf") {
    return parsePdf(buffer);
  }

  if (
    mimeType === "text/markdown" ||
    extension === ".md" ||
    extension === ".markdown"
  ) {
    return parseMarkdown(buffer);
  }

  return parseText(buffer);
}

async function parsePdf(buffer: ArrayBuffer) {
  const { extractText } = await import("unpdf");
  const { totalPages, text } = await extractText(new Uint8Array(buffer), {
    mergePages: false,
  });

  const pages = Array.isArray(text) ? text : [text];
  const segments = pages
    .map((content, index) => ({
      content: content.trim(),
      pageNumber: index + 1,
      sectionHeading: null,
    }))
    .filter((segment) => segment.content.length > 0);

  return { segments, pageCount: totalPages };
}

async function parseText(buffer: ArrayBuffer) {
  const content = new TextDecoder().decode(buffer).trim();
  return {
    segments: [{ content, pageNumber: null, sectionHeading: null }],
    pageCount: null,
  };
}

async function parseMarkdown(buffer: ArrayBuffer) {
  const raw = new TextDecoder().decode(buffer);
  const sections = raw.split(/(?=^#{1,6}\s)/m).filter(Boolean);
  const segments: ParsedSegment[] = [];

  for (const section of sections) {
    const headingMatch = section.match(/^(#{1,6})\s+(.+)$/m);
    const sectionHeading = headingMatch?.[2]?.trim() ?? null;
    const content = section.trim();

    if (content.length > 0) {
      segments.push({
        content,
        pageNumber: null,
        sectionHeading,
      });
    }
  }

  if (segments.length === 0) {
    return parseText(buffer);
  }

  return { segments, pageCount: null };
}
