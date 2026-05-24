"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, Bot, CheckCircle2, Dumbbell, Library, LineChart, Salad, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { Footer } from "@/components/marketing/footer";

const features = [
  { icon: Dumbbell, title: "AI workout plans", copy: "Strength, fat-loss, home, gym, and short-day versions generated from your coach intake." },
  { icon: Salad, title: "Egyptian meals", copy: "Ful, hawawshi, koshari, molokhia, taameya, and everyday foods with realistic macro estimates." },
  { icon: Bot, title: "Chat calorie logging", copy: "Write what you ate in English, Arabic, or Egyptian slang and confirm before saving." },
  { icon: Library, title: "Video library", copy: "A clean exercise database with source/license notes and a path for verified public videos." },
  { icon: LineChart, title: "Progress tracking", copy: "Body weight, calories, protein, check-ins, consistency, and smart plan adjustments." },
  { icon: Sparkles, title: "Free features", copy: "No pricing page, no checkout, no premium locks. Every tool is available for free." }
];

const faqs = [
  ["Is this website free?", "Yes. The product is designed with no payments, subscriptions, checkout, or premium locked tools."],
  ["Does it support Egyptian food?", "Yes. The MVP includes Arabic and English meal aliases plus normal and fitness versions for common Egyptian meals."],
  ["Do I need OpenAI right away?", "No. The app includes a mock AI service layer and can be connected to OpenAI later with an API key."]
];

export default function LandingPage() {
  return (
    <>
      <MarketingNav />
      <main>
        <section className="relative min-h-[92vh] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "linear-gradient(90deg, hsl(222 39% 5% / 0.96), hsl(222 39% 5% / 0.62), hsl(222 39% 5% / 0.2)), url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1800&q=85')"
            }}
          />
          <div className="hero-grid absolute inset-0 opacity-40" />
          <div className="relative mx-auto flex min-h-[92vh] max-w-7xl items-center px-4 pb-24 pt-16 sm:px-6 lg:px-8">
            <motion.div
              className="max-w-3xl text-white"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <Badge className="mb-5 border-white/20 bg-white/10 text-white">100% free fitness platform</Badge>
              <h1 className="text-5xl font-bold tracking-normal sm:text-6xl lg:text-7xl">Your AI Fitness Coach for Real Food and Real Life</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">
                Personalized workouts, Egyptian meal planning, calorie tracking through chat, and smart progress adjustments.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/register">Start free</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/25 bg-white/10 text-white hover:bg-white/15">
                  <Link href="/features">Explore features</Link>
                </Button>
              </div>
              <div className="mt-8 grid max-w-xl grid-cols-3 gap-3 text-sm text-white/75">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> No billing
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Arabic food
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Smart coaching
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-4 py-20 sm:px-6 md:grid-cols-2 lg:grid-cols-3 lg:px-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <feature.icon className="mb-3 h-7 w-7 text-primary" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">{feature.copy}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>

        <section className="border-y bg-card/40">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <Badge>Free Features</Badge>
              <h2 className="mt-4 text-3xl font-bold tracking-normal">Premium product feel. Free access for every user.</h2>
              <p className="mt-4 text-muted-foreground">
                Personalized workouts, Egyptian meal planning, calorie tracking, AI food chat, progress tracking, video library, and smart recommendations are all available without payment logic.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {["Personalized workouts", "Egyptian meal planning", "Calorie tracking", "AI food chatbot", "Progress tracking", "Workout video library", "Smart recommendations", "Admin-managed content"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-lg border bg-background/60 p-4">
                  <Activity className="h-5 w-5 text-accent" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-normal">FAQ</h2>
          <div className="mt-6 grid gap-4">
            {faqs.map(([question, answer]) => (
              <Card key={question}>
                <CardHeader>
                  <CardTitle>{question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
