create extension if not exists "pgcrypto";

alter type public.training_goal add value if not exists 'strength';

alter table public.profiles add column if not exists activity_level text not null default 'moderate';
alter table public.profiles add column if not exists diet_preference text not null default 'normal';
alter table public.profiles add column if not exists meals_per_day int not null default 3 check (meals_per_day between 1 and 8);
alter table public.profiles add column if not exists target_weight_kg numeric check (target_weight_kg between 25 and 350);

alter table public.calorie_targets add column if not exists fiber int;
alter table public.calorie_targets add column if not exists water_ml int;

create table if not exists public.onboarding_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  answers jsonb not null,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.food_items (
  id uuid primary key default gen_random_uuid(),
  food_name text not null,
  serving_size text not null,
  calories int not null check (calories >= 0),
  protein_g numeric not null default 0 check (protein_g >= 0),
  carbs_g numeric not null default 0 check (carbs_g >= 0),
  fat_g numeric not null default 0 check (fat_g >= 0),
  fiber_g numeric check (fiber_g >= 0),
  category text,
  cuisine text not null default 'Egyptian',
  aliases text[] not null default '{}',
  source_type text not null default 'seed',
  is_global boolean not null default true,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint food_items_unique_source unique (food_name, serving_size, source_type)
);

create table if not exists public.user_food_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  food_name text not null,
  serving_size text not null,
  calories int not null check (calories >= 0),
  protein_g numeric not null default 0 check (protein_g >= 0),
  carbs_g numeric not null default 0 check (carbs_g >= 0),
  fat_g numeric not null default 0 check (fat_g >= 0),
  fiber_g numeric check (fiber_g >= 0),
  cuisine text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.food_logs add column if not exists food_item_id uuid references public.food_items(id) on delete set null;
alter table public.food_logs add column if not exists meal_time text;
alter table public.food_logs add column if not exists serving_size text;
alter table public.food_logs add column if not exists quantity numeric not null default 1 check (quantity > 0);
alter table public.food_logs add column if not exists fiber int;

create table if not exists public.meal_food_items (
  id uuid primary key default gen_random_uuid(),
  meal_id text not null references public.meals(id) on delete cascade,
  food_item_id uuid references public.food_items(id) on delete set null,
  user_food_item_id uuid references public.user_food_items(id) on delete set null,
  quantity numeric not null default 1 check (quantity > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  plan_date date,
  meals jsonb not null default '[]'::jsonb,
  shopping_list text[] not null default '{}',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scheduled_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  workout_plan_id uuid references public.workout_plans(id) on delete cascade,
  workout_day_id text not null,
  scheduled_date date not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'missed', 'rest')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, workout_day_id, scheduled_date)
);

create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  goal text not null,
  days_per_week int not null check (days_per_week between 1 and 7),
  split text not null,
  template jsonb not null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workout_sessions add column if not exists scheduled_workout_id uuid references public.scheduled_workouts(id) on delete set null;
alter table public.workout_sessions add column if not exists completed_at timestamptz;

create table if not exists public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  workout_session_id uuid references public.workout_sessions(id) on delete cascade,
  exercise_id text references public.exercises(id) on delete set null,
  exercise_name text not null,
  planned_sets int,
  planned_reps text,
  actual_sets int,
  actual_reps int,
  weight_kg numeric,
  notes text,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.exercise_logs drop constraint if exists exercise_logs_exercise_id_fkey;

alter table public.progress_entries add column if not exists notes text;
alter table public.progress_entries add column if not exists hips_cm numeric;
alter table public.progress_entries add column if not exists chest_cm numeric;
alter table public.progress_entries add column if not exists underbust_cm numeric;
alter table public.progress_entries add column if not exists neck_cm numeric;
alter table public.progress_entries add column if not exists shoulders_cm numeric;
alter table public.progress_entries add column if not exists arm_cm numeric;
alter table public.progress_entries add column if not exists left_arm_cm numeric;
alter table public.progress_entries add column if not exists right_arm_cm numeric;
alter table public.progress_entries add column if not exists thigh_cm numeric;
alter table public.progress_entries add column if not exists left_thigh_cm numeric;
alter table public.progress_entries add column if not exists right_thigh_cm numeric;
alter table public.progress_entries add column if not exists glutes_cm numeric;
alter table public.progress_entries add column if not exists calves_cm numeric;
alter table public.progress_entries add column if not exists photo_path text;
alter table public.progress_entries add column if not exists photo_url text;

create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  progress_entry_id uuid references public.progress_entries(id) on delete cascade,
  weekly_checkin_id uuid references public.weekly_checkins(id) on delete cascade,
  storage_path text not null,
  photo_url text,
  label text,
  created_at timestamptz not null default now()
);

create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  progress_entry_id uuid references public.progress_entries(id) on delete cascade,
  measured_at date not null default current_date,
  waist_cm numeric,
  hips_cm numeric,
  chest_cm numeric,
  underbust_cm numeric,
  neck_cm numeric,
  shoulders_cm numeric,
  left_arm_cm numeric,
  right_arm_cm numeric,
  left_thigh_cm numeric,
  right_thigh_cm numeric,
  glutes_cm numeric,
  calves_cm numeric,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.weekly_checkins drop constraint if exists weekly_checkins_energy_check;
alter table public.weekly_checkins drop constraint if exists weekly_checkins_hunger_check;
alter table public.weekly_checkins add constraint weekly_checkins_energy_check check (energy between 1 and 10);
alter table public.weekly_checkins add constraint weekly_checkins_hunger_check check (hunger between 1 and 10);
alter table public.weekly_checkins add column if not exists current_weight_kg numeric;
alter table public.weekly_checkins add column if not exists mood_text text;
alter table public.weekly_checkins add column if not exists sleep_quality int check (sleep_quality between 1 and 10);
alter table public.weekly_checkins add column if not exists training_consistency int check (training_consistency between 0 and 14);
alter table public.weekly_checkins add column if not exists diet_consistency int check (diet_consistency between 1 and 10);
alter table public.weekly_checkins add column if not exists photo_path text;
alter table public.weekly_checkins add column if not exists photo_url text;

create table if not exists public.nutrition_reference_targets (
  id uuid primary key default gen_random_uuid(),
  nutrient text not null check (nutrient in ('calories', 'protein', 'carbs', 'fat', 'fiber', 'water')),
  reference_body text not null,
  population text not null,
  min_value numeric,
  max_value numeric,
  unit text not null,
  note text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_nutrition_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  target_date date not null default current_date,
  calories_status text not null check (calories_status in ('below', 'within', 'above')),
  protein_status text not null check (protein_status in ('below', 'within', 'above')),
  carbs_status text not null check (carbs_status in ('below', 'within', 'above')),
  fat_status text not null check (fat_status in ('below', 'within', 'above')),
  message text not null,
  created_at timestamptz not null default now(),
  unique (user_id, target_date)
);

create table if not exists public.ai_generated_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_type text not null check (plan_type in ('workout', 'diet', 'nutrition', 'checkin')),
  provider text not null default 'gemini',
  model text not null,
  prompt text not null,
  response jsonb not null,
  validation_status text not null check (validation_status in ('passed', 'failed')),
  validation_notes text,
  created_at timestamptz not null default now()
);

create or replace view public.exercise_library as
select
  e.id,
  e.name,
  e.arabic_name,
  e.muscle_group,
  e.equipment,
  e.difficulty,
  e.instructions,
  e.common_mistakes,
  e.alternatives,
  v.video_url,
  v.thumbnail,
  v.source,
  v.license_note,
  v.attribution,
  v.is_verified
from public.exercises e
left join lateral (
  select *
  from public.exercise_videos ev
  where ev.exercise_id = e.id
  order by ev.is_verified desc, ev.created_at desc
  limit 1
) v on true;

create index if not exists onboarding_answers_user_idx on public.onboarding_answers(user_id);
create index if not exists food_items_search_idx on public.food_items using gin (to_tsvector('simple', food_name || ' ' || serving_size || ' ' || coalesce(cuisine, '')));
create index if not exists food_items_cuisine_idx on public.food_items(cuisine);
create index if not exists user_food_items_user_idx on public.user_food_items(user_id);
create index if not exists food_logs_user_date_idx on public.food_logs(user_id, log_date desc);
create index if not exists meal_plans_user_date_idx on public.meal_plans(user_id, plan_date desc);
create index if not exists scheduled_workouts_user_date_idx on public.scheduled_workouts(user_id, scheduled_date);
create index if not exists workout_templates_goal_idx on public.workout_templates(goal, days_per_week);
create index if not exists exercise_logs_user_session_idx on public.exercise_logs(user_id, workout_session_id);
create index if not exists progress_entries_user_date_idx on public.progress_entries(user_id, entry_date);
create index if not exists body_measurements_user_date_idx on public.body_measurements(user_id, measured_at);
create index if not exists ai_generated_plans_user_type_idx on public.ai_generated_plans(user_id, plan_type, created_at desc);

alter table public.onboarding_answers enable row level security;
alter table public.food_items enable row level security;
alter table public.user_food_items enable row level security;
alter table public.meal_food_items enable row level security;
alter table public.meal_plans enable row level security;
alter table public.scheduled_workouts enable row level security;
alter table public.workout_templates enable row level security;
alter table public.exercise_logs enable row level security;
alter table public.progress_photos enable row level security;
alter table public.body_measurements enable row level security;
alter table public.nutrition_reference_targets enable row level security;
alter table public.daily_nutrition_recommendations enable row level security;
alter table public.ai_generated_plans enable row level security;

drop policy if exists "Users can insert own user row" on public.users;
create policy "Users can insert own user row" on public.users for insert with check (id = auth.uid());

drop policy if exists "Onboarding answers are private" on public.onboarding_answers;
create policy "Onboarding answers are private" on public.onboarding_answers for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Global food items readable" on public.food_items;
create policy "Global food items readable" on public.food_items for select using (is_global = true or created_by = auth.uid() or public.is_admin());
drop policy if exists "Admins manage global food items" on public.food_items;
create policy "Admins manage global food items" on public.food_items for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "User food items are private" on public.user_food_items;
create policy "User food items are private" on public.user_food_items for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Meal food items readable" on public.meal_food_items;
create policy "Meal food items readable" on public.meal_food_items for select using (true);
drop policy if exists "Admins manage meal food items" on public.meal_food_items;
create policy "Admins manage meal food items" on public.meal_food_items for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users create own meals" on public.meals;
create policy "Users create own meals" on public.meals for insert with check (created_by = auth.uid() or public.is_admin());
drop policy if exists "Users update own meals" on public.meals;
create policy "Users update own meals" on public.meals for update using (created_by = auth.uid() or public.is_admin()) with check (created_by = auth.uid() or public.is_admin());
drop policy if exists "Users delete own meals" on public.meals;
create policy "Users delete own meals" on public.meals for delete using (created_by = auth.uid() or public.is_admin());

drop policy if exists "Users manage own meal ingredients" on public.ingredients;
create policy "Users manage own meal ingredients" on public.ingredients for all
using (
  public.is_admin()
  or exists (select 1 from public.meals m where m.id = ingredients.meal_id and m.created_by = auth.uid())
)
with check (
  public.is_admin()
  or exists (select 1 from public.meals m where m.id = ingredients.meal_id and m.created_by = auth.uid())
);

drop policy if exists "Workouts follow private plans" on public.workouts;
create policy "Workouts follow private plans" on public.workouts for all
using (
  public.is_admin()
  or exists (select 1 from public.workout_plans wp where wp.id = workouts.workout_plan_id and wp.user_id = auth.uid())
)
with check (
  public.is_admin()
  or exists (select 1 from public.workout_plans wp where wp.id = workouts.workout_plan_id and wp.user_id = auth.uid())
);

drop policy if exists "Meal plans are private" on public.meal_plans;
create policy "Meal plans are private" on public.meal_plans for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "Scheduled workouts are private" on public.scheduled_workouts;
create policy "Scheduled workouts are private" on public.scheduled_workouts for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "Workout templates readable" on public.workout_templates;
create policy "Workout templates readable" on public.workout_templates for select to authenticated using (true);
drop policy if exists "Admins manage workout templates" on public.workout_templates;
create policy "Admins manage workout templates" on public.workout_templates for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Exercise logs are private" on public.exercise_logs;
create policy "Exercise logs are private" on public.exercise_logs for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "Progress photos are private" on public.progress_photos;
create policy "Progress photos are private" on public.progress_photos for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "Body measurements are private" on public.body_measurements;
create policy "Body measurements are private" on public.body_measurements for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "Nutrition reference readable" on public.nutrition_reference_targets;
create policy "Nutrition reference readable" on public.nutrition_reference_targets for select using (true);
drop policy if exists "Admins manage nutrition reference" on public.nutrition_reference_targets;
create policy "Admins manage nutrition reference" on public.nutrition_reference_targets for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Daily nutrition recommendations private" on public.daily_nutrition_recommendations;
create policy "Daily nutrition recommendations private" on public.daily_nutrition_recommendations for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "AI generated plans private" on public.ai_generated_plans;
create policy "AI generated plans private" on public.ai_generated_plans for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

insert into public.nutrition_reference_targets (nutrient, reference_body, population, min_value, max_value, unit, note)
values
  ('protein', 'ISSN', 'Active adults', 1.4, 2.2, 'g/kg/day', 'Sports nutrition range commonly used for active people seeking muscle retention or gain.'),
  ('carbs', 'Dietary Guidelines', 'General adults', 45, 65, '% calories', 'General acceptable macronutrient range; individual needs vary by training and goal.'),
  ('fat', 'Dietary Guidelines', 'General adults', 20, 35, '% calories', 'General acceptable macronutrient range.'),
  ('fiber', 'USDA', 'General adults', 14, null, 'g per 1000 kcal', 'General dietary fiber guideline based on energy intake.'),
  ('water', 'EFSA', 'General adults', 2000, 2500, 'ml/day', 'Baseline total water intake varies with heat, body size, activity, and diet.'),
  ('calories', 'WHO', 'General adults', null, null, 'kcal/day', 'Energy needs should be personalized; avoid extreme low-calorie targets without medical supervision.')
on conflict do nothing;

insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do update set public = false;

drop policy if exists "Users read own progress photo files" on storage.objects;
create policy "Users read own progress photo files" on storage.objects
for select to authenticated
using (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users upload own progress photo files" on storage.objects;
create policy "Users upload own progress photo files" on storage.objects
for insert to authenticated
with check (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users update own progress photo files" on storage.objects;
create policy "Users update own progress photo files" on storage.objects
for update to authenticated
using (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users delete own progress photo files" on storage.objects;
create policy "Users delete own progress photo files" on storage.objects
for delete to authenticated
using (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);
