"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { DeleteChatButton } from "@/components/chat/delete-chat-button";
import { cn } from "@/lib/utils";

export type ChatListEntry = {
  id: string;
  title: string | null;
  updatedAt: Date | string;
};

type ChatListProps = {
  chats: ChatListEntry[];
  emptyMessage?: string;
  onNavigate?: () => void;
};

function formatRelativeTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const absMinutes = Math.abs(diffMinutes);

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absMinutes < 60) {
    return formatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) {
    return formatter.format(diffDays, "day");
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function getChatTitle(title: string | null) {
  if (title?.trim()) return title.trim();
  return "New chat";
}

export function ChatList({
  chats,
  emptyMessage = "No chats yet. Upload a document to start.",
  onNavigate,
}: ChatListProps) {
  const pathname = usePathname();

  if (chats.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="w-full max-w-full space-y-1 p-2">
      {chats.map((chat) => {
        const href = `/chat/${chat.id}`;
        const isActive = pathname === href;
        const title = getChatTitle(chat.title);

        return (
          <li key={chat.id} className="min-w-0">
            <div
              className={cn(
                "flex min-w-0 items-center gap-1 overflow-hidden rounded-lg transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive &&
                  "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
            >
              <Link
                href={href}
                onClick={onNavigate}
                className="flex min-w-0 flex-1 items-start gap-3 overflow-hidden px-3 py-2.5 text-sm"
              >
                <MessageSquare className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p
                    className="truncate font-medium"
                    title={title}
                  >
                    {title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatRelativeTime(chat.updatedAt)}
                  </p>
                </div>
              </Link>
              <DeleteChatButton
                chatId={chat.id}
                chatTitle={title}
                className="mr-2 shrink-0"
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
