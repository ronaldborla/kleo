import { notFound } from "next/navigation";
import { ChatView } from "@/components/chat/chat-view";
import {
  getChatById,
  getDocumentsByChatId,
  getMessagesByChatId,
} from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const chat = await getChatById(id);

  if (!chat) {
    notFound();
  }

  const [documents, messages] = await Promise.all([
    getDocumentsByChatId(id),
    getMessagesByChatId(id),
  ]);

  return (
    <ChatView
      chatId={id}
      initialMessages={messages}
      initialDocuments={documents}
    />
  );
}
