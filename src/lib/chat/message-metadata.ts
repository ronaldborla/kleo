import type { UIMessage } from "ai";
import { formatModelLabel } from "@/lib/ai/model-fallback";

export type KleoMessageMetadata = {
  model?: string;
  createdAt?: number;
};

export type KleoUIMessage = UIMessage<KleoMessageMetadata>;

export function formatMessageTimestamp(createdAt?: number) {
  if (!createdAt) return null;

  return new Date(createdAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatResponseFooter(metadata?: KleoMessageMetadata) {
  const timestamp = formatMessageTimestamp(metadata?.createdAt);
  const model = metadata?.model ? formatModelLabel(metadata.model) : null;

  if (model && timestamp) {
    return `${model} · ${timestamp}`;
  }

  if (model) return model;
  if (timestamp) return timestamp;
  return null;
}
