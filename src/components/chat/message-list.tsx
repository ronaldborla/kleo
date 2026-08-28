"use client";

import { isToolUIPart, getToolName } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { EvidenceCards } from "@/components/evidence-cards";
import { getShowEvidenceData } from "@/lib/ai/evidence";
import {
  formatResponseFooter,
  type KleoUIMessage,
} from "@/lib/chat/message-metadata";
import { isSafeUrl } from "@/lib/markdown";
import { cn } from "@/lib/utils";

export function MessageList({ messages }: { messages: KleoUIMessage[] }) {
  return (
    <div className="flex flex-col gap-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}

function MessageBubble({ message }: { message: KleoUIMessage }) {
  const isUser = message.role === "user";
  const footer =
    message.role === "assistant"
      ? formatResponseFooter(message.metadata)
      : null;

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
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  urlTransform={(url) => (isSafeUrl(url) ? url : "")}
                  components={{
                    a: ({ href, children, ...props }) =>
                      href && isSafeUrl(href) ? (
                        <a
                          href={href}
                          rel="noopener noreferrer"
                          target="_blank"
                          {...props}
                        >
                          {children}
                        </a>
                      ) : (
                        <span>{children}</span>
                      ),
                  }}
                >
                  {part.text}
                </ReactMarkdown>
              </div>
            );
          }

          if (isToolUIPart(part) && getToolName(part) === "showEvidence") {
            const evidence = getShowEvidenceData(part);
            if (evidence) {
              return (
                <EvidenceCards
                  key={`${message.id}-tool-${index}`}
                  data={evidence}
                />
              );
            }
          }

          return null;
        })}

        {footer ? (
          <p className="mt-3 border-t border-border/60 pt-2 text-xs text-muted-foreground">
            {footer}
          </p>
        ) : null}
      </div>
    </div>
  );
}
