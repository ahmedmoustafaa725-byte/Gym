import { Activity, Bot, Dumbbell, Library, LineChart, Salad, Settings, Sparkles } from "lucide-react";
import { Footer } from "@/components/marketing/footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const items = [
  ["Personalized workout plans", Dumbbell, "Goal, experience, location, equipment, schedule, injuries, and time-aware programming."],
  ["Today's workout dashboard", Activity, "Automatic daily workout or recovery guidance when the plan calls for rest."],
  ["Exercise video library", Library, "Searchable exercise records with instructions, mistakes, alternatives, source, and license notes."],
  ["Egyptian meal planner", Salad, "Arabic/English searchable Middle Eastern meals with fitness versions and healthier preparation tips."],
  ["AI food chatbot", Bot, "Natural-language calorie logging in English, Arabic, and Egyptian Arabic slang."],
  ["Calorie and macro tracker", LineChart, "Daily targets, macro progress, weekly averages, repeated meals, and copy-yesterday flows."],
  ["Smart recommendations", Sparkles, "Rule-based adjustments for weight stalls, low protein, missed workouts, or training difficulty."],
  ["Admin content tools", Settings, "Manage exercises, meals, users, workout templates, and AI prompt templates."]
] as const;

export default function FeaturesPage() {
  return (
    <>
      <MarketingNav />
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="font-semibold text-primary">Free platform tools</p>
          <h1 className="mt-3 text-4xl font-bold tracking-normal sm:text-5xl">Everything inside NileFit AI is available for free.</h1>
          <p className="mt-5 text-lg text-muted-foreground">
            No pricing page, no paid plan comparison, and no feature locks. The MVP is designed as a launchable foundation for a free fitness product.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(([title, Icon, copy]) => (
            <Card key={title}>
              <CardHeader>
                <Icon className="mb-3 h-7 w-7 text-primary" />
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{copy}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
