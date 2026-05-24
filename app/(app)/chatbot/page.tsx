import { FoodChatbot } from "@/components/chatbot/food-chatbot";
import { PageShell } from "@/components/ui/page-shell";

export default function ChatbotPage() {
  return (
    <PageShell title="AI Food Chatbot" description="Log meals by chatting naturally in English, Arabic, or Egyptian Arabic.">
      <FoodChatbot />
    </PageShell>
  );
}
