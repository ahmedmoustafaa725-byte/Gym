# NileFit AI Coach

A free, full-stack fitness web application foundation built with Next.js, React, TypeScript, Tailwind CSS, Framer Motion, shadcn-style UI primitives, Supabase-ready auth/database, and a Gemini-powered AI service layer.

The product intentionally has no pricing page, payment methods, checkout, billing logic, subscriptions, premium plans, or locked paid features.

## What Is Included

- Public landing page, features page, about/safety page, login, and register.
- Protected app shell with responsive sidebar and mobile bottom navigation.
- Supabase-ready authentication with local demo fallback.
- Coach-style onboarding that saves profile preferences and generates targets.
- Personalized workout generator for full-body, upper/lower, push/pull/legs, home, gym, fat-loss, and muscle-gain style plans.
- Today's workout with rest-day guidance, 20-minute shortened workout, completion state, weight/reps/notes, difficulty rating, and workout history.
- Exercise library with search/filter/detail pages, video player, instructions, mistakes, alternatives, and source/license notes.
- Meal planner with Arabic/English search, Egyptian/Middle Eastern food data, normal and fitness versions, healthier tips, custom meals, favorites, generated meal plan, and shopping list.
- Calorie/macro tracker with add/edit/delete, copy yesterday, save repeated meal, weekly averages, and warnings against unsafe under-eating.
- AI food chatbot with Gemini parsing for English, Arabic, and Egyptian Arabic food names plus a deterministic fallback.
- Progress page with body metrics, strength progress, consistency, check-ins, progress photo placeholders, and smart recommendations.
- Admin area for exercises, meals, users, workout templates, and AI prompts.
- Supabase migration and seed files.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- shadcn-style local UI components
- Supabase for auth/database/RLS
- Gemini API service layer with safe fallback logic
- Recharts
- Lucide React icons
- next-themes

## Project Structure

```txt
app/
components/
components/ui/
components/dashboard/
components/workouts/
components/meals/
components/chatbot/
components/progress/
components/admin/
lib/
services/
services/ai/
services/database/
services/recommendations/
types/
data/
hooks/
utils/
supabase/migrations/
supabase/seed/
```

## Setup

1. Install Node.js 22 or newer.
2. Install dependencies:

```bash
npm install
```

3. Copy environment variables:

```bash
cp .env.example .env.local
```

4. Run the app:

```bash
npm run dev
```

5. Open:

```txt
http://localhost:3000
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
AI_PROVIDER=gemini
AI_MODEL=gemini-3.5-flash
GEMINI_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_USE_MOCK_AUTH=true
```

If Supabase variables are empty, the app uses local demo auth and localStorage-backed state. Use any email/password locally. Include `admin` in the email to see admin navigation.

## Supabase Setup

1. Create a Supabase project.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`.
3. Run `supabase/migrations/001_initial_schema.sql`.
4. Run `supabase/seed/001_seed.sql`.
5. Create users through Supabase Auth.
6. Mirror user records into `public.users` and set `role` to `admin` for admins.

## Database Structure

Main tables:

- `users`
- `profiles`
- `calorie_targets`
- `workout_plans`
- `workouts`
- `workout_sessions`
- `exercises`
- `exercise_videos`
- `workout_templates`
- `meals`
- `ingredients`
- `food_logs`
- `progress_entries`
- `weekly_checkins`
- `chat_messages`
- `admin_settings`

The migration enables RLS. User-owned tables are private to the logged-in user or admins. Public content tables are readable by everyone and manageable by admins.

## Gemini Integration

AI generation runs through server-side API routes so the Gemini key stays in Netlify environment variables, not browser code:

```txt
services/ai/geminiClient.ts
app/api/ai/food-parser/route.ts
app/api/ai/workout-plan/route.ts
app/api/ai/meal-plan/route.ts
```

To enable Gemini on Netlify:

1. Add `AI_PROVIDER=gemini`.
2. Add `AI_MODEL=gemini-3.5-flash`.
3. Add `GEMINI_API_KEY` from Google AI Studio.
4. Redeploy on Netlify.

If the key is missing, invalid, or Gemini is unavailable, the app automatically falls back to the built-in workout generator and food estimator.

## Workout Videos

The seed data uses public sample video URLs from Wikimedia Commons and marks every video with license guidance. Before production launch, verify each file page, license, attribution, and reuse requirements.

Recommended video/content paths:

- Wikimedia Commons for individual free media files with page-level license review.
- YouTube embed/search links for personal technique lookup without another API key.
- wger for open-source exercise data with per-entry Creative Commons metadata.
- Admin-added owned or commissioned clips.
- A future licensed provider behind `services/database/exerciseVideoSource.ts`.

Sources reviewed while building:

- [Wikimedia Commons exercise videos](https://commons.wikimedia.org/wiki/Category:Videos_of_physical_exercises)
- [Wikimedia Commons strength-training videos](https://commons.wikimedia.org/wiki/Category:Videos_of_people_demonstrating_strength_training_exercises)
- [YouTube embedded player documentation](https://developers.google.com/youtube/player_parameters)
- [wger GitHub project](https://github.com/wger-project/wger)
- [wger documentation](https://wger.readthedocs.io/)

## Safety

The app includes guidance that this is not medical advice. It avoids unsafe starvation diets, extreme calorie targets, and training-through-serious-pain recommendations. Meals include allergy notes where relevant.

## Completed Features

- Auth UI and protected routes.
- Supabase schema, seed data, and RLS policies.
- Onboarding and profile settings.
- Gemini-backed workout generation, today view, workout logging, and history.
- Exercise library, video source abstraction, playable Commons clips, and extra YouTube technique links.
- Egyptian/Middle Eastern meal database and Arabic/English search.
- Meal planner, custom meals, shopping list, calorie tracker.
- Gemini food chatbot and confirmation-to-log flow.
- Progress tracking, weekly check-ins, smart recommendations.
- Admin panel and resource managers.
- Dark/light mode, responsive UI, Framer Motion interactions, loading/empty states.

## Mocked Or Placeholder Features

- Supabase reads/writes are scaffolded but most UI currently uses localStorage fallback state.
- AI generation falls back to deterministic mock logic when Gemini is not configured.
- Progress photo uploads are placeholders for Supabase Storage.
- Exercise videos are seed examples and must be license-verified before production.
- Admin managers use local editable state; wire them to Supabase CRUD next.

## Roadmap

1. Replace localStorage state with Supabase repository calls.
2. Add server actions/API routes for authenticated writes.
3. Add Supabase Auth email confirmation and password reset flows.
4. Move Gemini prompt templates into `admin_settings`.
5. Build a verified workout video import pipeline with attribution fields.
6. Add Supabase Storage progress-photo uploads.
7. Add tests for workout generation, meal parsing, recommendations, and RLS.
8. Add wearable import support for steps, sleep, and body weight.
9. Add Arabic UI localization.
10. Add production observability, error tracking, and analytics that respect privacy.
