import type { ModelFallbackReason } from "@/lib/chat-errors";

export function formatModelLabel(modelId: string) {
  const slashIndex = modelId.indexOf("/");
  return slashIndex === -1 ? modelId : modelId.slice(slashIndex + 1);
}

export function buildModelFallbackNotice(
  fromModelId: string,
  toModelId: string,
  reason: ModelFallbackReason = "transient",
) {
  const fromModel = formatModelLabel(fromModelId);
  const toModel = formatModelLabel(toModelId);

  if (reason === "rate_limit") {
    return `${fromModel} was rate-limited. Automatically switched to ${toModel}.`;
  }

  return `${fromModel} is temporarily unavailable. Automatically switched to ${toModel}.`;
}
