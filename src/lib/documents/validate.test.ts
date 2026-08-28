import { describe, expect, it } from "vitest";
import { MAX_FILE_SIZE_BYTES } from "@/lib/constants";
import { extensionOf, validateUploadFile } from "@/lib/documents/validate";

function createFile(name: string, type: string, size = 10): File {
  const content = new Uint8Array(size);
  return {
    name,
    type,
    size,
    arrayBuffer: async () => content.buffer,
    slice: () => createFile(name, type, size),
    stream: () => new ReadableStream(),
    text: async () => "",
    lastModified: Date.now(),
    webkitRelativePath: "",
    bytes: async () => content,
  } as File;
}

describe("extensionOf", () => {
  it("returns empty string when there is no extension", () => {
    expect(extensionOf("README")).toBe("");
  });

  it("returns lowercase extension", () => {
    expect(extensionOf("Report.PDF")).toBe(".pdf");
  });

  it("handles multiple dots", () => {
    expect(extensionOf("archive.tar.gz")).toBe(".gz");
  });
});

describe("validateUploadFile", () => {
  it("accepts allowed mime types", () => {
    const result = validateUploadFile(
      createFile("notes.txt", "text/plain"),
    );

    expect(result).toEqual({ ok: true });
  });

  it("accepts allowed extensions without mime type", () => {
    const result = validateUploadFile(createFile("notes.md", ""));

    expect(result).toEqual({ ok: true });
  });

  it("rejects unsupported files", () => {
    const result = validateUploadFile(
      createFile("image.png", "image/png"),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("not supported");
    }
  });

  it("rejects files over the size limit", () => {
    const result = validateUploadFile(
      createFile("big.pdf", "application/pdf", MAX_FILE_SIZE_BYTES + 1),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("10 MB");
    }
  });
});
