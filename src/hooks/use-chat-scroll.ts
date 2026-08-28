"use client";

import { useEffect, useRef } from "react";
import type { KleoUIMessage } from "@/lib/chat/message-metadata";

export function useChatScroll(
  messages: KleoUIMessage[],
  status: string,
  uploadError: string | null,
  chatError: { title: string; message: string } | null,
) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const isStreaming = status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: isStreaming ? "auto" : "smooth",
      block: "end",
    });
  }, [messages, status, uploadError, chatError, isStreaming]);

  return bottomRef;
}
