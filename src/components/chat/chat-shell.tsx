"use client";

import { PanelLeft } from "lucide-react";
import {
  useCallback,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import type { ChatListEntry } from "@/components/chat/chat-list";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const SIDEBAR_STORAGE_KEY = "kleo-sidebar-collapsed";
const SIDEBAR_CHANGE_EVENT = "kleo-sidebar-change";

function getSidebarCollapsed() {
  return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
}

function subscribeToSidebar(onStoreChange: () => void) {
  const handleChange = () => onStoreChange();
  window.addEventListener(SIDEBAR_CHANGE_EVENT, handleChange);
  window.addEventListener("storage", handleChange);

  return () => {
    window.removeEventListener(SIDEBAR_CHANGE_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}

function setSidebarCollapsed(value: boolean) {
  window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(value));
  window.dispatchEvent(new Event(SIDEBAR_CHANGE_EVENT));
}

function useSidebarCollapsed() {
  return useSyncExternalStore(
    subscribeToSidebar,
    getSidebarCollapsed,
    () => false,
  );
}

type ChatShellProps = {
  chats: ChatListEntry[];
  children: ReactNode;
};

const SIDEBAR_WIDTH_CLASS = "w-90";

export function ChatShell({ chats, children }: ChatShellProps) {
  const isCollapsed = useSidebarCollapsed();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleDesktopSidebar = useCallback(() => {
    setSidebarCollapsed(!getSidebarCollapsed());
  }, []);

  return (
    <div className="flex h-svh min-h-0 overflow-hidden">
      <aside
        className={cn(
          "hidden shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-200 md:block",
          isCollapsed ? "w-0 overflow-hidden" : SIDEBAR_WIDTH_CLASS,
        )}
      >
        <div className={cn("h-full", SIDEBAR_WIDTH_CLASS)}>
          <ChatSidebar chats={chats} />
        </div>
      </aside>

      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="w-90 p-0" showCloseButton>
          <SheetTitle className="sr-only">Chat history</SheetTitle>
          <ChatSidebar
            chats={chats}
            onNavigate={() => setIsMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex items-center border-b px-3 py-2 md:px-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              if (window.matchMedia("(min-width: 768px)").matches) {
                toggleDesktopSidebar();
              } else {
                setIsMobileOpen(true);
              }
            }}
            aria-label="Toggle chat history"
          >
            <PanelLeft className="size-4" />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
