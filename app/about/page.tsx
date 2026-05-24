import { AlertTriangle, HeartPulse, ShieldCheck } from "lucide-react";
import { Footer } from "@/components/marketing/footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { safetyDisclaimer } from "@/lib/safety";

export default function AboutPage() {
  return (
    <>
      <MarketingNav />
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="font-semibold text-primary">Product mission</p>
          <h1 className="mt-3 text-4xl font-bold tracking-normal sm:text-5xl">Fitness coaching that respects real food, real budgets, and real schedules.</h1>
          <p className="mt-5 text-lg text-muted-foreground">
            NileFit AI is a free fitness platform built around personalized training, Egyptian and Middle Eastern nutrition, and conservative plan adjustments.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <Card>
            <CardHeader>
              <HeartPulse className="mb-3 h-7 w-7 text-primary" />
              <CardTitle>Practical coaching</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              Workouts adapt to equipment, time, experience, and stated limitations. Nutrition focuses on sustainable targets, not extreme restriction.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <ShieldCheck className="mb-3 h-7 w-7 text-secondary" />
              <CardTitle>Safety first</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              The app avoids unsafe calorie floors, starvation diets, and instructions to train through serious pain.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <AlertTriangle className="mb-3 h-7 w-7 text-accent" />
              <CardTitle>Clear disclaimer</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">{safetyDisclaimer}</CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
