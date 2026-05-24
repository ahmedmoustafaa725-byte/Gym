import {
  Activity,
  Bot,
  CalendarDays,
  Dumbbell,
  Flame,
  Home,
  LayoutDashboard,
  Library,
  LineChart,
  Salad,
  Settings,
  Shield,
  User,
  Users
} from "lucide-react";

export const appNavigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/today", label: "Today", icon: Flame },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/workout-plan", label: "Plan", icon: Dumbbell },
  { href: "/exercise-library", label: "Library", icon: Library },
  { href: "/meal-planner", label: "Meals", icon: Salad },
  { href: "/chatbot", label: "AI Chat", icon: Bot },
  { href: "/calorie-tracker", label: "Calories", icon: Activity },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/profile", label: "Profile", icon: User }
] as const;

export const adminNavigation = [
  { href: "/admin", label: "Admin", icon: Shield },
  { href: "/admin/exercises", label: "Exercises", icon: Dumbbell },
  { href: "/admin/meals", label: "Meals", icon: Salad },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/workout-templates", label: "Templates", icon: Home },
  { href: "/admin/ai-prompts", label: "AI Prompts", icon: Settings }
] as const;
