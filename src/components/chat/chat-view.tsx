"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useMemo, useState } from "react";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatErrorBubble } from "@/components/chat/chat-error-bubble";
import { DeleteChatButton } from "@/components/chat/delete-chat-button";
import { getChatTitle } from "@/components/chat/chat-list";
import { EmptyState } from "@/components/chat/empty-state";
import { MessageList } from "@/components/chat/message-list";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { KleoUIMessage } from "@/lib/chat/message-metadata";
import { createMessageId } from "@/lib/id";
import { parseChatClientError } from "@/lib/chat-errors";
import type { Document } from "@/lib/db/schema";
import { ChatDropZone } from "@/components/chat/chat-drop-zone";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { useDocumentUpload } from "@/hooks/use-document-upload";

type ChatViewProps = {
  chatId: string;
  chatTitle: string | null;
  initialMessages: KleoUIMessage[];
  initialDocuments: Document[];
};

export function ChatView({
  chatId,
  chatTitle,
  initialMessages,
  initialDocuments,
}: ChatViewProps) {
  const [input, setInput] = useState("");
  const [documents, setDocuments] = useState(initialDocuments);
  const {
    uploadToChat,
    uploadError,
    isUploading,
    clearUploadError,
  } = useDocumentUpload();

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { chatId },
      }),
    [chatId],
  );

  const {
    messages,
    sendMessage,
    status,
    error,
    setMessages,
    clearError,
  } = useChat<KleoUIMessage>({
    id: chatId,
    messages: initialMessages,
    transport,
    generateId: createMessageId,
  });

  const isBusy = status === "streaming" || status === "submitted";
  const readyDocuments = documents.filter((doc) => doc.status === "ready");
  const processingDocuments = documents.filter(
    (doc) => doc.status === "processing",
  );
  const failedDocuments = documents.filter((doc) => doc.status === "failed");

  const chatError = error ? parseChatClientError(error) : null;

  const bottomRef = useChatScroll(
    messages,
    status,
    uploadError,
    chatError,
  );

  const refreshChat = useCallback(async () => {
    const response = await fetch(`/api/chats/${chatId}`);
    if (!response.ok) return;
    const data = await response.json();
    setDocuments(data.documents);
    setMessages(data.messages);
  }, [chatId, setMessages]);

  const handleUpload = useCallback(
    async (file: File) => {
      try {
        await uploadToChat(chatId, file);
        await refreshChat();
      } catch {
        // Error state is handled by the hook.
      }
    },
    [chatId, refreshChat, uploadToChat],
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || isBusy) return;

    clearError();
    sendMessage({ text });
    setInput("");
  };

  return (
    <ChatDropZone
      onDropFile={(file) => void handleUpload(file)}
      disabled={isBusy || isUploading}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex items-center justify-end border-b px-4 py-3">
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
            <DeleteChatButton
              chatId={chatId}
              chatTitle={getChatTitle(chatTitle)}
            />
          </div>
        </header>

        <ScrollArea className="min-h-0 flex-1">
          <div className="mx-auto max-w-3xl px-4 py-6">
            {messages.length === 0 ? <EmptyState /> : null}

            {messages.length > 0 ? (
              <MessageList messages={messages} />
            ) : null}

            <div className="mt-4 flex flex-col gap-4">
              {uploadError ? (
                <ChatErrorBubble
                  title="Upload failed"
                  message={uploadError}
                  onRetry={clearUploadError}
                />
              ) : null}

              {chatError ? (
                <ChatErrorBubble
                  title={chatError.title}
                  message={chatError.message}
                />
              ) : null}
            </div>

            <div ref={bottomRef} aria-hidden className="h-px" />
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
    </ChatDropZone>
  );
}
