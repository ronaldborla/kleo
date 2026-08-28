"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChatList,
  type ChatListEntry,
} from "@/components/chat/chat-list";

type ChatSidebarProps = {
  chats: ChatListEntry[];
  onNavigate?: () => void;
};

export function ChatSidebar({ chats, onNavigate }: ChatSidebarProps) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border px-4 py-4">
        <Link
          href="/"
          className="block"
          onClick={onNavigate}
        >
          <h1 className="text-lg font-semibold">Kleo</h1>
          <p className="text-xs text-muted-foreground">
            Document chat with citations
          </p>
        </Link>
        <Button asChild className="mt-4 w-full" size="sm">
          <Link href="/" onClick={onNavigate}>
            <Plus />
            New chat
          </Link>
        </Button>
      </div>

      <div className="px-4 py-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Recent chats
        </p>
      </div>

      <ScrollArea className="min-h-0 min-w-0 flex-1">
        <ChatList chats={chats} onNavigate={onNavigate} />
      </ScrollArea>
    </div>
  );
}
