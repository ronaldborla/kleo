import type { KleoUIMessage } from "@/lib/chat/message-metadata";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  toUIMessageStream,
  type InferUIMessageChunk,
} from "ai";
import {
  buildEvidenceFromChunks,
  ensureEvidenceInMessage,
  injectShowEvidenceStream,
  isShowEvidenceStreamChunk,
} from "@/lib/ai/evidence";
import { gateway } from "@/lib/ai/gateway";
import { buildModelFallbackNotice } from "@/lib/ai/model-fallback";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { chatTools } from "@/lib/ai/tools";
import {
  getChatErrorMessage,
  getModelFallbackReason,
  isRetryableModelError,
  MODELS_UNAVAILABLE_MESSAGE,
} from "@/lib/chat-errors";
import { CHAT_MODEL_CHAIN } from "@/lib/constants";
import { createMessageId } from "@/lib/id";
import type { RetrievedChunk } from "@/lib/rag/search";

type StreamWriter = {
  write: (part: InferUIMessageChunk<KleoUIMessage>) => void;
};

function isAssistantContentChunk(chunk: InferUIMessageChunk<KleoUIMessage>) {
  const { type } = chunk;

  return (
    type === "text-start" ||
    type === "text-delta" ||
    type === "text-end" ||
    type === "reasoning-start" ||
    type === "reasoning-delta" ||
    type === "reasoning-end" ||
    type === "start-step" ||
    type.startsWith("tool-")
  );
}

function writeTextBlock(writer: StreamWriter, text: string) {
  const id = createMessageId();

  writer.write({ type: "text-start", id });
  writer.write({ type: "text-delta", id, delta: text });
  writer.write({ type: "text-end", id });
}

function writeFallbackNotice(
  writer: StreamWriter,
  modelIndex: number,
  modelId: string,
  previousError: unknown,
) {
  if (modelIndex === 0) {
    return;
  }

  const fromModelId = CHAT_MODEL_CHAIN[modelIndex - 1];
  const reason = getModelFallbackReason(previousError);

  writeTextBlock(
    writer,
    `*${buildModelFallbackNotice(fromModelId, modelId, reason)}*\n\n`,
  );
}

function canRetryModel(modelIndex: number, error: unknown) {
  return (
    isRetryableModelError(error) && modelIndex < CHAT_MODEL_CHAIN.length - 1
  );
}

async function pipeModelStream({
  writer,
  modelId,
  messages,
  retrievedChunks,
  modelIndex,
  previousError,
}: {
  writer: StreamWriter;
  modelId: string;
  messages: KleoUIMessage[];
  retrievedChunks: RetrievedChunk[];
  modelIndex: number;
  previousError: unknown;
}) {
  const result = streamText({
    model: gateway.languageModel(modelId),
    system: buildSystemPrompt(retrievedChunks),
    messages: await convertToModelMessages(messages),
    tools: chatTools,
    stopWhen: stepCountIs(2),
    maxRetries: 0,
  });

  const reader = toUIMessageStream({
    stream: result.stream,
    originalMessages: messages,
    generateMessageId: createMessageId,
    onError: (error) => getChatErrorMessage(error),
  }).getReader();

  const bufferedChunks: InferUIMessageChunk<KleoUIMessage>[] = [];
  let hasStartedStreaming = false;
  let hasEvidenceTool = false;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      if (isShowEvidenceStreamChunk(value)) {
        hasEvidenceTool = true;
      }

      if (value.type === "error") {
        const error = new Error(value.errorText);
        reader.releaseLock();

        return {
          success: false as const,
          retryable: canRetryModel(modelIndex, error),
          error,
        };
      }

      if (!hasStartedStreaming) {
        if (isAssistantContentChunk(value)) {
          writeFallbackNotice(writer, modelIndex, modelId, previousError);

          for (const bufferedChunk of bufferedChunks) {
            writer.write(bufferedChunk);
          }
          bufferedChunks.length = 0;
          writer.write(value);
          hasStartedStreaming = true;
          continue;
        }

        bufferedChunks.push(value);
        continue;
      }

      writer.write(value);
    }
  } catch (error) {
    reader.releaseLock();

    return {
      success: false as const,
      retryable: canRetryModel(modelIndex, error),
      error,
    };
  }

  reader.releaseLock();

  if (!hasStartedStreaming) {
    for (const bufferedChunk of bufferedChunks) {
      writer.write(bufferedChunk);
    }

    writeFallbackNotice(writer, modelIndex, modelId, previousError);
  }

  if (!hasEvidenceTool) {
    const evidence = buildEvidenceFromChunks(retrievedChunks);
    if (evidence) {
      injectShowEvidenceStream(writer, evidence);
    }
  }

  writer.write({
    type: "message-metadata",
    messageMetadata: {
      model: modelId,
      createdAt: Date.now(),
    },
  });

  return { success: true as const };
}

export function createChatStreamResponse({
  messages,
  retrievedChunks,
  onFinish,
}: {
  messages: KleoUIMessage[];
  retrievedChunks: RetrievedChunk[];
  onFinish: (responseMessage: KleoUIMessage) => Promise<void>;
}) {
  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      originalMessages: messages,
      generateId: createMessageId,
      onError: (error) => getChatErrorMessage(error),
      onEnd: async ({ responseMessage }) => {
        if (responseMessage) {
          await onFinish(
            ensureEvidenceInMessage(responseMessage, retrievedChunks),
          );
        }
      },
      execute: async ({ writer }) => {
        let lastError: unknown;

        for (let modelIndex = 0; modelIndex < CHAT_MODEL_CHAIN.length; modelIndex++) {
          const modelId = CHAT_MODEL_CHAIN[modelIndex];
          const attempt = await pipeModelStream({
            writer,
            modelId,
            messages,
            retrievedChunks,
            modelIndex,
            previousError: lastError,
          });

          if (attempt.success) {
            return;
          }

          lastError = attempt.error;

          if (!attempt.retryable) {
            throw attempt.error;
          }
        }

        throw lastError instanceof Error
          ? new Error(MODELS_UNAVAILABLE_MESSAGE, { cause: lastError })
          : new Error(MODELS_UNAVAILABLE_MESSAGE);
      },
    }),
  });
}
