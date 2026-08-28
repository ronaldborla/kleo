"use client";

import { FileText, FileUp, Loader2, MessageSquareText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { ChatDropZone } from "@/components/chat/chat-drop-zone";
import { ChatDeleteProvider } from "@/components/chat/chat-delete-provider";
import { ChatList, type ChatListEntry } from "@/components/chat/chat-list";
import { ErrorState } from "@/components/chat/error-state";
import { Button } from "@/components/ui/button";
import { useDocumentUpload } from "@/hooks/use-document-upload";

type HomeViewProps = {
  recentChats: ChatListEntry[];
};

export function HomeView({ recentChats }: HomeViewProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    createChatAndUpload,
    uploadError,
    isUploading,
    clearUploadError,
  } = useDocumentUpload();

  const handleUpload = async (file: File) => {
    try {
      const { chatId } = await createChatAndUpload(file);
      router.push(`/chat/${chatId}`);
    } catch {
      // Error state is handled by the hook.
    }
  };

  return (
    <ChatDeleteProvider>
      <ChatDropZone
        onDropFile={(file) => void handleUpload(file)}
        disabled={isUploading}
      >
        <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col px-4 py-10">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Kleo</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload a document and ask questions with grounded citations.
          </p>
        </header>

        <section className="rounded-2xl border bg-muted/20 p-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border bg-background">
            <MessageSquareText className="size-7 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">
            Upload a document to get started
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Attach or drag and drop a PDF, TXT, or Markdown file, then ask
            questions. Kleo will answer with citations and expandable evidence
            cards.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md,.markdown,text/plain,text/markdown,application/pdf"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              await handleUpload(file);
              event.target.value = "";
            }}
          />

          <Button
            type="button"
            className="mt-6"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <FileUp />
            )}
            {isUploading ? "Uploading..." : "Choose file"}
          </Button>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <FileText className="size-4" />
            Supported formats: PDF, TXT, Markdown
          </div>
        </section>

        {uploadError ? (
          <div className="mt-4">
            <ErrorState
              title="Upload failed"
              message={uploadError}
              onRetry={clearUploadError}
            />
          </div>
        ) : null}

        <section className="mt-10">
          <h2 className="mb-3 text-sm font-medium">Recent chats</h2>

          <div className="rounded-xl border bg-background">
            <ChatList
              chats={recentChats}
              emptyMessage="No chats yet. Upload a document above to start your first conversation."
            />
          </div>
        </section>
      </div>
    </ChatDropZone>
    </ChatDeleteProvider>
  );
}
