"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { DeleteChatDialog } from "@/components/chat/delete-chat-dialog";

type PendingChat = {
  id: string;
  title: string;
};

type ChatDeleteContextValue = {
  requestDelete: (chatId: string, title: string) => void;
};

const ChatDeleteContext = createContext<ChatDeleteContextValue | null>(null);

function getActiveChatId(pathname: string | null) {
  if (!pathname) return null;
  const match = pathname.match(/^\/chat\/([^/]+)$/);
  return match?.[1] ?? null;
}

export function ChatDeleteProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pendingChat, setPendingChat] = useState<PendingChat | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const requestDelete = useCallback((chatId: string, title: string) => {
    setPendingChat({ id: chatId, title });
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!pendingChat) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/chats/${pendingChat.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete chat");
      }

      const deletedChatId = pendingChat.id;
      setPendingChat(null);

      if (getActiveChatId(pathname) === deletedChatId) {
        router.push("/");
        return;
      }

      router.refresh();
    } catch {
      // Keep the dialog open so the user can retry or cancel.
    } finally {
      setIsDeleting(false);
    }
  }, [pathname, pendingChat, router]);

  const value = useMemo(() => ({ requestDelete }), [requestDelete]);

  return (
    <ChatDeleteContext.Provider value={value}>
      {children}
      <DeleteChatDialog
        open={pendingChat != null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setPendingChat(null);
          }
        }}
        chatTitle={pendingChat?.title ?? "this chat"}
        onConfirm={handleConfirm}
        isDeleting={isDeleting}
      />
    </ChatDeleteContext.Provider>
  );
}

export function useChatDelete() {
  const context = useContext(ChatDeleteContext);

  if (!context) {
    throw new Error("useChatDelete must be used within ChatDeleteProvider");
  }

  return context;
}
