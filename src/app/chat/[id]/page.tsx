import { notFound } from "next/navigation";
import { Conversation } from "@/components/Conversation";
import { chats } from "@/lib/data";

export function generateStaticParams() {
  return chats.map((c) => ({ id: c.id }));
}

export default async function ChatThreadPage({ params }: PageProps<"/chat/[id]">) {
  const { id } = await params;
  const chat = chats.find((c) => c.id === id);
  if (!chat) notFound();
  return <Conversation chat={chat} />;
}
