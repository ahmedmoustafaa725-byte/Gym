"use client";

import { FormEvent, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, CheckCircle2, Send, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAppState } from "@/lib/app-state";
import { todayISO } from "@/lib/date";
import { parseFoodMessage } from "@/services/ai/foodParser";
import { saveChatMessage } from "@/services/database/repository";
import type { ChatMessage, FoodLog } from "@/types";

const starterPrompts = [
  "I ate 1 boiled egg, 1/4 baladi bread, and iced coffee with milk.",
  "اكلت رغيف حواوشي وكوباية صوبيا",
  "ضيفلي بيضة مسلوقة وربع رغيف",
  "same breakfast as yesterday"
];

function makeAssistantContent(parsed: Omit<FoodLog, "id" | "userId" | "date" | "source"> & { breakdown: string[]; needsClarification: boolean }) {
  if (parsed.needsClarification) {
    return "I need one more detail before estimating confidently. Please tell me the portion size, count, or approximate serving.";
  }

  return [
    "Estimated meal:",
    ...parsed.breakdown.map((item) => `- ${item}`),
    "",
    `Total: ${parsed.calories} kcal`,
    `Macros: Protein ${parsed.protein}g, Carbs ${parsed.carbs}g, Fat ${parsed.fat}g`,
    "",
    "Do you want me to add this to today's intake?"
  ].join("\n");
}

export function FoodChatbot() {
  const { addFoodLog, foodLogs, targets, profile } = useAppState();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      createdAt: new Date().toISOString(),
      content:
        "Tell me what you ate in English, Arabic, or Egyptian Arabic. I will estimate calories/macros and ask before saving."
    }
  ]);
  const [pendingLog, setPendingLog] = useState<Omit<FoodLog, "id" | "userId" | "date" | "source"> | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const todayTotals = useMemo(() => {
    const today = todayISO();
    return foodLogs
      .filter((log) => log.date === today)
      .reduce((sum, log) => ({ calories: sum.calories + log.calories, protein: sum.protein + log.protein }), { calories: 0, protein: 0 });
  }, [foodLogs]);

  async function parseWithGemini(text: string) {
    try {
      const response = await fetch("/api/ai/food-parser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: text })
      });

      if (!response.ok) {
        throw new Error("Food parser failed");
      }

      return (await response.json()) as Awaited<ReturnType<typeof parseFoodMessage>>;
    } catch {
      return parseFoodMessage(text);
    }
  }

  async function sendMessage(text = input) {
    const trimmed = text.trim();
    if (!trimmed || isThinking) return;
    setInput("");
    setIsThinking(true);

    const userMessage: ChatMessage = {
      id: `msg-${crypto.randomUUID()}`,
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString()
    };

    setMessages((current) => [...current, userMessage]);
    void saveChatMessage(profile.userId, userMessage);
    const parsed = await parseWithGemini(trimmed);
    const assistantMessage: ChatMessage = {
      id: `msg-${crypto.randomUUID()}`,
      role: "assistant",
      content: makeAssistantContent(parsed),
      createdAt: new Date().toISOString(),
      parsedFoodLog: parsed.needsClarification
        ? undefined
        : {
            mealName: parsed.mealName,
            calories: parsed.calories,
            protein: parsed.protein,
            carbs: parsed.carbs,
            fat: parsed.fat,
            notes: parsed.notes
          }
    };
    setPendingLog(assistantMessage.parsedFoodLog ?? null);
    setMessages((current) => [...current, assistantMessage]);
    void saveChatMessage(profile.userId, assistantMessage);
    setIsThinking(false);
  }

  async function confirmPendingLog() {
    if (!pendingLog) return;
    await addFoodLog({
      ...pendingLog,
      source: "chatbot"
    });
    const savedMessage: ChatMessage = {
      id: `msg-${crypto.randomUUID()}`,
      role: "assistant",
      content: "Added to today's intake. Your dashboard and calorie tracker are updated.",
      createdAt: new Date().toISOString()
    };
    setMessages((current) => [
      ...current,
      savedMessage
    ]);
    void saveChatMessage(profile.userId, savedMessage);
    setPendingLog(null);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <Card className="min-h-[650px]">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>AI Food Chatbot</CardTitle>
              <CardDescription>Gemini-powered parser with built-in fallback if the AI key is missing.</CardDescription>
            </div>
            <Badge className="border-secondary/20 bg-secondary/10 text-secondary">English + عربي + slang</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex h-[560px] flex-col gap-4">
          <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto rounded-lg border bg-background/50 p-4">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" ? (
                    <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                      <Bot className="h-4 w-4" />
                    </span>
                  ) : null}
                  <div
                    className={`max-w-[82%] whitespace-pre-line rounded-lg p-3 text-sm leading-6 ${
                      message.role === "user" ? "bg-primary text-primary-foreground" : "border bg-card"
                    }`}
                  >
                    {message.content}
                  </div>
                  {message.role === "user" ? (
                    <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-secondary/10 text-secondary">
                      <UserRound className="h-4 w-4" />
                    </span>
                  ) : null}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {pendingLog ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3 rounded-lg border border-primary/25 bg-primary/10 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm">
                <p className="font-semibold">Ready to add: {pendingLog.mealName}</p>
                <p className="text-muted-foreground">
                  {pendingLog.calories} kcal - P {pendingLog.protein}g - C {pendingLog.carbs}g - F {pendingLog.fat}g
                </p>
              </div>
              <Button onClick={confirmPendingLog}>
                <CheckCircle2 className="h-4 w-4" />
                Add to today
              </Button>
            </motion.div>
          ) : null}

          <form className="flex gap-2" onSubmit={submit}>
            <Input value={input} onChange={(event) => setInput(event.target.value)} placeholder="اكتب أكلت إيه... or type what you ate" disabled={isThinking} />
            <Button size="icon" aria-label="Send food message" disabled={isThinking}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-primary/20">
          <CardHeader>
            <Sparkles className="mb-3 h-7 w-7 text-primary" />
            <CardTitle>Today after chat</CardTitle>
            <CardDescription>Your confirmed chat logs flow into calories.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border bg-background/60 p-3">
              <p className="text-sm text-muted-foreground">Calories</p>
              <p className="text-2xl font-bold">
                {todayTotals.calories} / {targets.calories}
              </p>
            </div>
            <div className="rounded-md border bg-background/60 p-3">
              <p className="text-sm text-muted-foreground">Protein</p>
              <p className="text-2xl font-bold">
                {todayTotals.protein}g / {targets.protein}g
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Try examples</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {starterPrompts.map((prompt) => (
              <Button key={prompt} variant="outline" className="h-auto justify-start whitespace-normal py-3 text-left" onClick={() => sendMessage(prompt)}>
                {prompt}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coach notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>When portions are unclear, the coach will ask instead of saving a guess.</p>
            <p>Sweet drinks like sobia are logged as treat calories, so the rest of the day can stay balanced.</p>
            <p>Confirmed meals update the same food log used by the dashboard and tracker.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
