-- Core schema for Gym app (Supabase SQL Editor friendly)
create extension if not exists "pgcrypto";

-- Shared enums
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Utility timestamp function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Canonical users mirror from auth.users
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  age int check (age between 13 and 100),
  gender text,
  height_cm numeric check (height_cm between 80 and 260),
  weight_kg numeric check (weight_kg between 25 and 350),
  target_weight_kg numeric check (target_weight_kg between 25 and 350),
  activity_level text,
  goal text,
  experience text,
  training_location text,
  equipment text[] not null default '{}',
  diet_preference text,
  meals_per_day int check (meals_per_day between 1 and 8),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.onboarding_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  answers jsonb not null,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.calorie_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  starts_on date not null default current_date,
  calories int not null check (calories >= 1000),
  protein int not null check (protein >= 0),
  carbs int not null check (carbs >= 0),
  fat int not null check (fat >= 0),
  fiber int,
  water_ml int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, starts_on)
);

-- Exercise catalogue (global + user-created)
create table if not exists public.exercise_library (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.users(id) on delete cascade,
  is_global boolean not null default true,
  name text not null,
  muscle_group text,
  equipment text,
  difficulty text,
  instructions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercise_library_owner_scope check ((is_global and owner_user_id is null) or (not is_global and owner_user_id is not null))
);

create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  goal text,
  split text,
  days_per_week int check (days_per_week between 1 and 7),
  plan jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  workout_plan_id uuid not null references public.workout_plans(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  focus text,
  day_index int check (day_index between 0 and 6),
  estimated_minutes int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scheduled_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  workout_plan_id uuid references public.workout_plans(id) on delete set null,
  workout_id uuid references public.workouts(id) on delete set null,
  scheduled_date date not null,
  status text not null default 'scheduled' check (status in ('scheduled','completed','missed','rest')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, workout_id, scheduled_date)
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  scheduled_workout_id uuid references public.scheduled_workouts(id) on delete set null,
  workout_id uuid references public.workouts(id) on delete set null,
  session_date date not null default current_date,
  duration_minutes int,
  difficulty_rating int check (difficulty_rating between 1 and 5),
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  workout_session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_library_id uuid references public.exercise_library(id) on delete set null,
  exercise_name text not null,
  set_index int,
  reps int,
  weight_kg numeric,
  duration_seconds int,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  plan_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid references public.meal_plans(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  meal_name text not null,
  meal_type text,
  eaten_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Food catalogue (global + user-created split)
create table if not exists public.food_items (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.users(id) on delete cascade,
  is_global boolean not null default true,
  food_name text not null,
  serving_size text not null,
  calories int not null check (calories >= 0),
  protein_g numeric not null default 0 check (protein_g >= 0),
  carbs_g numeric not null default 0 check (carbs_g >= 0),
  fat_g numeric not null default 0 check (fat_g >= 0),
  fiber_g numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint food_items_owner_scope check ((is_global and owner_user_id is null) or (not is_global and owner_user_id is not null))
);

create table if not exists public.user_food_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  food_item_id uuid not null references public.food_items(id) on delete cascade,
  custom_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, food_item_id)
);

create table if not exists public.meal_food_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  food_item_id uuid not null references public.food_items(id) on delete restrict,
  quantity numeric not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  meal_id uuid references public.meals(id) on delete set null,
  food_item_id uuid references public.food_items(id) on delete set null,
  log_date date not null default current_date,
  meal_name text not null,
  quantity numeric not null default 1 check (quantity > 0),
  calories int not null,
  protein int not null,
  carbs int not null,
  fat int not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.progress_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  entry_date date not null default current_date,
  weight_kg numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, entry_date)
);

create table if not exists public.weekly_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  week_start date not null,
  mood int check (mood between 1 and 10),
  energy int check (energy between 1 and 10),
  hunger int check (hunger between 1 and 10),
  sleep_quality int check (sleep_quality between 1 and 10),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, week_start)
);

create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  progress_entry_id uuid references public.progress_entries(id) on delete set null,
  weekly_checkin_id uuid references public.weekly_checkins(id) on delete set null,
  storage_path text not null,
  photo_url text,
  caption text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  measured_at date not null default current_date,
  waist_cm numeric,
  hips_cm numeric,
  chest_cm numeric,
  neck_cm numeric,
  arm_cm numeric,
  thigh_cm numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nutrition_reference_targets (
  id uuid primary key default gen_random_uuid(),
  nutrient text not null,
  population text not null,
  min_value numeric,
  max_value numeric,
  unit text not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_nutrition_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  target_date date not null default current_date,
  calories_status text,
  protein_status text,
  carbs_status text,
  fat_status text,
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, target_date)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  meta jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_generated_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_type text not null,
  provider text not null,
  model text,
  prompt text,
  response jsonb not null,
  validation_status text,
  validation_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text not null,
  category text,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
