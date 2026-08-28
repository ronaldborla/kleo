"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useCallback, useMemo, useState } from "react";
import { ChatComposer } from "@/components/chat/chat-composer";
import { EmptyState } from "@/components/chat/empty-state";
import { ErrorState } from "@/components/chat/error-state";
import { MessageList } from "@/components/chat/message-list";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Document } from "@/lib/db/schema";

type ChatViewProps = {
  chatId: string;
  initialMessages: UIMessage[];
  initialDocuments: Document[];
};

export function ChatView({
  chatId,
  initialMessages,
  initialDocuments,
}: ChatViewProps) {
  const [input, setInput] = useState("");
  const [documents, setDocuments] = useState(initialDocuments);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { chatId },
      }),
    [chatId],
  );

  const { messages, sendMessage, status, error, setMessages } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
  });

  const isBusy = status === "streaming" || status === "submitted";
  const readyDocuments = documents.filter((doc) => doc.status === "ready");
  const processingDocuments = documents.filter(
    (doc) => doc.status === "processing",
  );
  const failedDocuments = documents.filter((doc) => doc.status === "failed");

  const refreshChat = useCallback(async () => {
    const response = await fetch(`/api/chats/${chatId}`);
    if (!response.ok) return;
    const data = await response.json();
    setDocuments(data.documents);
    setMessages(data.messages);
  }, [chatId, setMessages]);

  const handleUpload = useCallback(
    async (file: File) => {
      setUploadError(null);
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("chatId", chatId);

        const response = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Upload failed");
        }

        await refreshChat();
      } catch (uploadFailure) {
        setUploadError(
          uploadFailure instanceof Error
            ? uploadFailure.message
            : "Upload failed",
        );
      } finally {
        setIsUploading(false);
      }
    },
    [chatId, refreshChat],
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || isBusy) return;

    sendMessage({ text });
    setInput("");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold">Kleo</h1>
          <p className="text-xs text-muted-foreground">
            Document chat with grounded citations
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {readyDocuments.length > 0 ? (
            <Badge variant="secondary">
              {readyDocuments.length} document
              {readyDocuments.length === 1 ? "" : "s"} ready
            </Badge>
          ) : null}
          {processingDocuments.length > 0 ? (
            <Badge variant="outline">Indexing document...</Badge>
          ) : null}
          {failedDocuments.length > 0 ? (
            <Badge variant="destructive">Upload failed</Badge>
          ) : null}
        </div>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto max-w-3xl px-4 py-6">
          {uploadError ? (
            <div className="mb-4">
              <ErrorState
                title="Upload failed"
                message={uploadError}
                onRetry={() => setUploadError(null)}
              />
            </div>
          ) : null}

          {error ? (
            <div className="mb-4">
              <ErrorState
                title="Chat error"
                message={error.message}
              />
            </div>
          ) : null}

          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <MessageList messages={messages} />
          )}
        </div>
      </ScrollArea>

      <ChatComposer
        input={input}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        onUpload={handleUpload}
        isBusy={isBusy}
        isUploading={isUploading}
      />
    </div>
  );
}
