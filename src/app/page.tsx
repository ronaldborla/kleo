import { HomeView } from "@/components/home/home-view";
import { getRecentChats } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const recentChats = await getRecentChats(10);

  return <HomeView recentChats={recentChats} />;
}
