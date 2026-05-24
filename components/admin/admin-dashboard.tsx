"use client";

import Link from "next/link";
import { Bot, Dumbbell, Salad, Settings, Users } from "lucide-react";
import { AdminGuard } from "@/components/admin/admin-guard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const adminCards = [
  { href: "/admin/exercises", title: "Manage Exercises", description: "Exercise metadata, instructions, mistakes, alternatives, and videos.", icon: Dumbbell },
  { href: "/admin/meals", title: "Manage Meals", description: "Egyptian and Middle Eastern meals, macros, aliases, and prep tips.", icon: Salad },
  { href: "/admin/users", title: "Manage Users", description: "User role and account overview for support and moderation.", icon: Users },
  { href: "/admin/workout-templates", title: "Workout Templates", description: "Reusable plan templates for goals and experience levels.", icon: Settings },
  { href: "/admin/ai-prompts", title: "AI Prompts", description: "Food parser, workout generator, and check-in prompt templates.", icon: Bot }
];

export function AdminDashboard() {
  return (
    <AdminGuard>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {adminCards.map((card) => (
          <Card key={card.href}>
            <CardHeader>
              <card.icon className="mb-3 h-7 w-7 text-primary" />
              <CardTitle>{card.title}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href={card.href}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminGuard>
  );
}
