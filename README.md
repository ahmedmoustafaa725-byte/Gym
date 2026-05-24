# NileFit AI Coach

NileFit AI Coach is a 100% free fitness platform built with Next.js, React, TypeScript, Tailwind CSS, Framer Motion, Supabase, and Gemini. It has no pricing page, checkout, billing, subscriptions, premium plans, or locked paid features.

This project is prepared for Netlify deployment. Local development is optional, not the main setup path.

## Netlify-First Setup

### 1. Create Supabase

1. Create a new Supabase project.
2. Open Supabase SQL Editor.
3. Paste and run these files in this exact order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_production_data_layer.sql`
   - `supabase/seed/001_seed.sql`
   - `supabase/seed/002_egyptian_food_items.sql`
4. Confirm the tables exist under Table Editor.
5. Confirm the `progress-photos` bucket exists under Storage.

The second migration creates the progress-photo Storage bucket and policies. If you create it manually, use:

- Bucket name: `progress-photos`
- Public bucket: `false`
- Folder convention: each user uploads under `{auth.uid()}/filename`

### 2. Supabase Auth Redirects

In Supabase Auth settings:

- Site URL: your Netlify site URL, for example `https://your-site.netlify.app`
- Redirect URLs:
  - `https://your-site.netlify.app`
  - `https://your-site.netlify.app/*`

For this app, email confirmation can stay off while testing if you want instant account creation.

### 3. Netlify Environment Variables

Add these in Netlify, one variable at a time:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_google_ai_studio_key
AI_PROVIDER=gemini
AI_MODEL=gemini-3.5-flash
NEXT_PUBLIC_APP_URL=https://your-site.netlify.app
NEXT_PUBLIC_USE_MOCK_AUTH=false
```

Do not put `GEMINI_API_KEY` in browser/client code. It is used only by server API routes.

### 4. Netlify Build Settings

- Framework preset: Next.js
- Build command: `npm run build`
- Publish directory: `.next`
- Node version: `22`

`netlify.toml` is included with these build settings.

## Database Structure

Core user-owned tables:

- `users`
- `profiles`
- `onboarding_answers`
- `calorie_targets`
- `workout_plans`
- `workouts`
- `scheduled_workouts`
- `workout_sessions`
- `exercise_logs`
- `meal_plans`
- `food_logs`
- `progress_entries`
- `weekly_checkins`
- `progress_photos`
- `body_measurements`
- `chat_messages`
- `ai_generated_plans`
- `daily_nutrition_recommendations`

Global/admin content tables:

- `exercises`
- `exercise_videos`
- `workout_templates`
- `meals`
- `ingredients`
- `food_items`
- `meal_food_items`
- `nutrition_reference_targets`
- `admin_settings`

User-created food is stored separately in `user_food_items`. Global Egyptian foods are stored in `food_items` with `source_type = user_provided_approximate_macro_table`.

## Supabase Security

RLS is enabled. The policies are in:

- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_production_data_layer.sql`

Rules:

- Users can read/write only their own private rows.
- Authenticated users can read global exercise, meal, food, and nutrition reference data.
- Admin users can manage global exercises, meals, foods, templates, and prompt settings.
- Progress photos are private in Supabase Storage and scoped to each user's folder.

Admin email configured in the app:

```txt
ahmeedmostafaa@hotmail.com
```

## Egyptian Food Database

The file `supabase/seed/002_egyptian_food_items.sql` was generated from:

```txt
C:/Users/Ahmee/Downloads/egyptian_meals_macros_100 (1).xlsx
```

It seeds 100 Egyptian foods with:

- Food name
- Serving size
- Calories
- Protein
- Carbs
- Fat
- Category
- Cuisine = `Egyptian`
- Source type = `user_provided_approximate_macro_table`

These are approximate fitness estimates, not medical-grade nutrition data.

The app uses this table for:

- Egyptian food search
- Add to today's calories
- Serving quantity adjustment
- Gemini diet-plan context
- Nutrition recommendations

## Gemini AI

Gemini runs through server routes:

- `app/api/ai/workout-plan/route.ts`
- `app/api/ai/meal-plan/route.ts`
- `app/api/ai/food-parser/route.ts`

Plan generation is validated before being saved:

- Workout plans must match user goal, level, training days, duration, injuries, and the exercise library.
- Diet plans must respect calories/macros, allergies, disliked foods, diet preference, and Egyptian foods when selected.
- Invalid AI output is retried once with a stricter prompt.
- If Gemini is unavailable, the app falls back to safe deterministic generation instead of saving broken plans.

## Nutrition Standards

The recommendation layer uses general baseline references:

- WHO: general energy-balance guidance
- EFSA: baseline water intake guidance
- USDA / Dietary Guidelines: macro ranges and fiber guidance
- ISSN: sports protein range for active users

The app is not medical advice and avoids extreme starvation diets or unsafe training advice.

## Workout Videos

Exercise videos and source links are managed through:

- `exercises`
- `exercise_videos`
- `services/database/exerciseVideoSource.ts`

The seed data uses public sample sources and technique links. Before making the site public, verify each video license/attribution or replace clips with owned/licensed media.

## Completed in This Production Pass

- Supabase-backed app state for real logged-in users.
- Mock/localStorage mode limited to `NEXT_PUBLIC_USE_MOCK_AUTH=true` or missing Supabase env vars.
- Empty first-time state for new real users: no fake logs, sessions, progress, or completed history.
- Onboarding saves profile answers to Supabase and triggers AI workout/diet generation.
- Progress entry modal with weight, measurements, notes, photo upload, and Supabase persistence.
- Weekly check-in modal with energy, hunger, sleep, consistency, mood, notes, photo upload, and Supabase persistence.
- Egyptian food seed SQL from the uploaded spreadsheet.
- Egyptian food search and add-to-today with serving quantity.
- 2-second meal-added macro confirmation.
- Nutrition recommendation status for daily calories/protein/carbs/fat.
- Calendar page using saved workout/session/food data.
- Workout sessions and exercise logs saved to Supabase.
- Admin pages load/save through Supabase repository functions.
- Netlify config and deployment documentation.

## Still Good Next Improvements

- Add a richer drag-and-drop custom meal-plan calendar.
- Add edit/delete UI for individual body measurement rows and progress photos.
- Add import tooling for a larger licensed exercise-video provider.
- Add Arabic UI localization beyond Arabic food search.
- Add test coverage after dependencies install cleanly in CI/Netlify.

## How to Test on Netlify

1. Deploy from GitHub to Netlify.
2. Create a brand-new account.
3. Confirm onboarding appears before dashboard.
4. Complete onboarding and generate a plan.
5. Add a meal from the Egyptian food database.
6. Open Supabase Table Editor and confirm a row appears in `food_logs`.
7. Add a progress entry with a photo.
8. Confirm rows appear in `progress_entries` and `progress_photos`.
9. Open today's workout, save a session, and confirm rows appear in `workout_sessions` and `exercise_logs`.
