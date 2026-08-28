import type { KleoUIMessage } from "@/lib/chat/message-metadata";
import { createMessageId } from "@/lib/id";
import type { RetrievedChunk } from "@/lib/rag/search";
import type { ShowEvidenceInput } from "@/lib/ai/tools";
import { isToolUIPart, getToolName, type InferUIMessageChunk } from "ai";

function truncateExcerpt(content: string, maxLength = 240) {
  const normalized = content.trim().replace(/\s+/g, " ");
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function similarityToRelevance(similarity: number): ShowEvidenceInput["sources"][number]["relevance"] {
  if (similarity >= 0.8) return "high";
  if (similarity >= 0.65) return "medium";
  return "low";
}

export function buildEvidenceFromChunks(
  chunks: RetrievedChunk[],
): ShowEvidenceInput | null {
  if (chunks.length === 0) return null;

  return {
    summary: "Sources used to answer this question",
    sources: chunks.map((chunk) => ({
      filename: chunk.filename,
      page: chunk.pageNumber,
      section: chunk.sectionHeading,
      excerpt: truncateExcerpt(chunk.content),
      relevance: similarityToRelevance(chunk.similarity),
    })),
  };
}

export function hasShowEvidencePart(message: Pick<KleoUIMessage, "parts">) {
  return message.parts.some(
    (part) => isToolUIPart(part) && getToolName(part) === "showEvidence",
  );
}

export function getShowEvidenceData(part: unknown): ShowEvidenceInput | null {
  if (!part || typeof part !== "object") return null;

  const candidate = part as {
    state?: string;
    output?: unknown;
    input?: unknown;
  };

  if (
    candidate.state === "output-available" &&
    isShowEvidenceOutput(candidate.output)
  ) {
    return candidate.output;
  }

  if (
    candidate.state === "output-available" &&
    isShowEvidenceOutput(candidate.input)
  ) {
    return candidate.input;
  }

  if (isShowEvidenceOutput(candidate.input)) {
    return candidate.input;
  }

  return null;
}

function isShowEvidenceOutput(output: unknown): output is ShowEvidenceInput {
  if (!output || typeof output !== "object") return false;
  const value = output as ShowEvidenceInput;
  return Array.isArray(value.sources) && typeof value.summary === "string";
}

type EvidenceStreamWriter = {
  write: (part: InferUIMessageChunk<KleoUIMessage>) => void;
};

export function injectShowEvidenceStream(
  writer: EvidenceStreamWriter,
  evidence: ShowEvidenceInput,
) {
  const toolCallId = createMessageId();

  writer.write({
    type: "tool-input-start",
    toolCallId,
    toolName: "showEvidence",
  });

  writer.write({
    type: "tool-input-available",
    toolCallId,
    toolName: "showEvidence",
    input: evidence,
  });

  writer.write({
    type: "tool-output-available",
    toolCallId,
    output: evidence,
  });
}

export function ensureEvidenceInMessage(
  message: KleoUIMessage,
  chunks: RetrievedChunk[],
): KleoUIMessage {
  if (hasShowEvidencePart(message)) {
    return message;
  }

  const evidence = buildEvidenceFromChunks(chunks);
  if (!evidence) {
    return message;
  }

  return {
    ...message,
    parts: [
      ...message.parts,
      {
        type: "tool-showEvidence",
        toolCallId: createMessageId(),
        state: "output-available",
        input: evidence,
        output: evidence,
      },
    ],
  };
}

export function isShowEvidenceStreamChunk(chunk: {
  type: string;
  toolName?: string;
}) {
  return (
    (chunk.type === "tool-input-start" ||
      chunk.type === "tool-input-available") &&
    chunk.toolName === "showEvidence"
  );
}
