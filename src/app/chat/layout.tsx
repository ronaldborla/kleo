import { getRecentChats } from "@/lib/db/queries";
import { ChatDeleteProvider } from "@/components/chat/chat-delete-provider";
import { ChatShell } from "@/components/chat/chat-shell";

export const dynamic = "force-dynamic";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const chats = await getRecentChats(50);

  return (
    <ChatDeleteProvider>
      <ChatShell chats={chats}>{children}</ChatShell>
    </ChatDeleteProvider>
  );
}
