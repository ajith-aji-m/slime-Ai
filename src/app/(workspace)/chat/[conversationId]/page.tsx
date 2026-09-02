import { ConversationView } from "@/components/chat/conversation-view";

export default async function ConversationPage({
  params,
}: PageProps<"/chat/[conversationId]">) {
  const { conversationId } = await params;
  return <ConversationView conversationId={conversationId} />;
}
