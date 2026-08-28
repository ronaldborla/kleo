import { redirect } from "next/navigation";
import { createChat } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const chat = await createChat();
  redirect(`/chat/${chat.id}`);
}
