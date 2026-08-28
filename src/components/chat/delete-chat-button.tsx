"use client";

import { Trash2 } from "lucide-react";
import { useChatDelete } from "@/components/chat/chat-delete-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DeleteChatButtonProps = {
  chatId: string;
  chatTitle: string;
  className?: string;
};

export function DeleteChatButton({
  chatId,
  chatTitle,
  className,
}: DeleteChatButtonProps) {
  const { requestDelete } = useChatDelete();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn("shrink-0 text-muted-foreground hover:text-destructive", className)}
      aria-label="Delete chat"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        requestDelete(chatId, chatTitle);
      }}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
