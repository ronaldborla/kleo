"use client";

import type { UIMessage } from "ai";
import { isToolUIPart, getToolName } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { EvidenceCards } from "@/components/evidence-cards";
import type { ShowEvidenceInput } from "@/lib/ai/tools";
import { cn } from "@/lib/utils";

function isShowEvidenceOutput(output: unknown): output is ShowEvidenceInput {
  if (!output || typeof output !== "object") return false;
  const value = output as ShowEvidenceInput;
  return Array.isArray(value.sources) && typeof value.summary === "string";
}

export function MessageList({ messages }: { messages: UIMessage[] }) {
  return (
    <div className="flex flex-col gap-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6",
          isUser
            ? "bg-primary text-primary-foreground"
            : "border bg-card text-card-foreground",
        )}
      >
        {message.parts.map((part, index) => {
          if (part.type === "text") {
            return (
              <div key={`${message.id}-text-${index}`} className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {part.text}
                </ReactMarkdown>
              </div>
            );
          }

          if (
            isToolUIPart(part) &&
            getToolName(part) === "showEvidence" &&
            part.state === "output-available" &&
            isShowEvidenceOutput(part.output)
          ) {
            return (
              <EvidenceCards
                key={`${message.id}-tool-${index}`}
                data={part.output}
              />
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
