"use client";

import { FileUp, Loader2, Send } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChatComposerProps = {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onUpload: (file: File) => Promise<void>;
  isBusy: boolean;
  isUploading: boolean;
  disabled?: boolean;
};

export function ChatComposer({
  input,
  onInputChange,
  onSubmit,
  onUpload,
  isBusy,
  isUploading,
  disabled = false,
}: ChatComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <form
      onSubmit={onSubmit}
      className="border-t bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,.markdown,text/plain,text/markdown,application/pdf"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            await onUpload(file);
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled || isBusy || isUploading}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload document"
        >
          {isUploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileUp className="size-4" />
          )}
        </Button>
        <Textarea
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder="Ask a question about your document..."
          rows={1}
          className="min-h-[44px] resize-none"
          disabled={disabled || isBusy}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <Button
          type="submit"
          size="icon"
          disabled={disabled || isBusy || !input.trim()}
          aria-label="Send message"
        >
          {isBusy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </div>
    </form>
  );
}
