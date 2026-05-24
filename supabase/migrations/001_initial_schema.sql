create extension if not exists "pgcrypto";

do $$ begin
  create type public.app_role as enum ('user', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.training_goal as enum ('fat_loss', 'muscle_gain', 'maintenance', 'endurance', 'general_fitness');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.training_experience as enum ('beginner', 'intermediate', 'advanced');
exception when duplicate_object then null;
end $$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  role public.app_role not null default 'user',
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name, role, onboarding_complete)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email, 'Athlete'), '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'user'),
    coalesce((new.raw_user_meta_data->>'onboardingComplete')::boolean, false)
  )
  on conflict (id) do update
  set email = excluded.email,
      name = excluded.name,
      updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create table if not exists public.profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  age int check (age between 13 and 100),
  gender text,
  height_cm numeric check (height_cm between 80 and 260),
  weight_kg numeric check (weight_kg between 25 and 350),
  goal public.training_goal not null default 'general_fitness',
  experience public.training_experience not null default 'beginner',
  training_location text not null default 'both',
  equipment text[] not null default '{}',
  days_per_week int not null default 3 check (days_per_week between 1 and 7),
  minutes_per_workout int not null default 45 check (minutes_per_workout between 10 and 180),
  injuries text,
  preferred_training_style text,
  food_allergies text,
  disliked_foods text,
  favorite_meals text,
  preferred_cuisine text,
  budget_level text not null default 'medium',
  cooking_time text not null default 'moderate',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.calorie_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  calories int not null check (calories >= 1200),
  protein int not null,
  carbs int not null,
  fat int not null,
  starts_on date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.exercises (
  id text primary key,
  name text not null,
  arabic_name text,
  muscle_group text not null,
  equipment text not null,
  difficulty public.training_experience not null,
  instructions text[] not null default '{}',
  common_mistakes text[] not null default '{}',
  alternatives text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exercise_videos (
  id uuid primary key default gen_random_uuid(),
  exercise_id text not null references public.exercises(id) on delete cascade,
  video_url text not null,
  thumbnail text,
  source text not null,
  license_note text not null,
  attribution text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  goal public.training_goal not null,
  experience public.training_experience not null,
  days_per_week int not null,
  location text not null,
  template jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  goal public.training_goal not null,
  days_per_week int not null,
  split text not null,
  plan jsonb not null,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  workout_plan_id uuid not null references public.workout_plans(id) on delete cascade,
  title text not null,
  focus text not null,
  day_index int not null check (day_index between 0 and 6),
  estimated_minutes int not null,
  exercises jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  workout_id uuid,
  workout_day_id text,
  session_date date not null default current_date,
  difficulty_rating int check (difficulty_rating between 1 and 5),
  notes text,
  sets jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.meals (
  id text primary key,
  name text not null,
  arabic_name text,
  aliases text[] not null default '{}',
  cuisine text not null,
  tags text[] not null default '{}',
  portion_size text not null,
  calories int not null,
  protein int not null,
  carbs int not null,
  fat int not null,
  normal_calories text,
  fitness_calories text,
  instructions text[] not null default '{}',
  healthier_tips text[] not null default '{}',
  allergy_notes text,
  budget_level text not null default 'medium',
  cooking_time_minutes int not null default 0,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  meal_id text references public.meals(id) on delete cascade,
  name text not null,
  amount text not null,
  calories int,
  created_at timestamptz not null default now()
);

create table if not exists public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  meal_id text references public.meals(id) on delete set null,
  log_date date not null default current_date,
  meal_name text not null,
  source text not null default 'manual',
  calories int not null,
  protein int not null,
  carbs int not null,
  fat int not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.progress_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  entry_date date not null default current_date,
  weight_kg numeric not null,
  waist_cm numeric,
  calories_average int,
  protein_average int,
  workout_consistency int check (workout_consistency between 0 and 100),
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.weekly_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  week_start date not null,
  mood int not null check (mood between 1 and 5),
  energy int not null check (energy between 1 and 5),
  hunger int not null check (hunger between 1 and 5),
  sleep_hours numeric not null,
  training_difficulty int not null check (training_difficulty between 1 and 5),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  parsed_food_log jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text not null,
  category text not null,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid()
    and role = 'admin'
  );
$$;

alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.calorie_targets enable row level security;
alter table public.workout_plans enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.food_logs enable row level security;
alter table public.progress_entries enable row level security;
alter table public.weekly_checkins enable row level security;
alter table public.chat_messages enable row level security;
alter table public.meals enable row level security;
alter table public.ingredients enable row level security;
alter table public.exercises enable row level security;
alter table public.exercise_videos enable row level security;
alter table public.workout_templates enable row level security;
alter table public.admin_settings enable row level security;

create policy "Users can view own user row" on public.users for select using (id = auth.uid() or public.is_admin());
create policy "Users can update own user row" on public.users for update using (id = auth.uid()) with check (id = auth.uid());
create policy "Admins manage user rows" on public.users for all using (public.is_admin()) with check (public.is_admin());

create policy "Profiles are private" on public.profiles for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "Targets are private" on public.calorie_targets for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "Workout plans are private" on public.workout_plans for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "Workout sessions are private" on public.workout_sessions for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "Food logs are private" on public.food_logs for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "Progress entries are private" on public.progress_entries for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "Weekly checkins are private" on public.weekly_checkins for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "Chat messages are private" on public.chat_messages for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

create policy "Exercises are readable" on public.exercises for select using (true);
create policy "Exercise videos are readable" on public.exercise_videos for select using (true);
create policy "Meals are readable" on public.meals for select using (true);
create policy "Ingredients are readable" on public.ingredients for select using (true);
create policy "Templates are readable" on public.workout_templates for select using (true);

create policy "Admins manage exercises" on public.exercises for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage videos" on public.exercise_videos for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage meals" on public.meals for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage ingredients" on public.ingredients for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage templates" on public.workout_templates for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage settings" on public.admin_settings for all using (public.is_admin()) with check (public.is_admin());
