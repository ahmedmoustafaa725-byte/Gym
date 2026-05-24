-- Admin helper
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid() and u.role = 'admin'
  );
$$;

-- Helper: create owner/admin policy only when table+column exist
create or replace function public.create_owner_admin_policy(
  p_table text,
  p_policy text,
  p_owner_column text
)
returns void
language plpgsql
as $$
begin
  if to_regclass('public.' || p_table) is null then
    return;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = p_table and column_name = p_owner_column
  ) then
    return;
  end if;

  execute format('drop policy if exists %I on public.%I', p_policy, p_table);
  execute format(
    'create policy %I on public.%I for all using (%I = auth.uid() or public.is_admin()) with check (%I = auth.uid() or public.is_admin())',
    p_policy, p_table, p_owner_column, p_owner_column
  );
end;
$$;

-- Enable RLS across app tables (only if table exists)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','profiles','onboarding_answers','calorie_targets','user_exercise_items','workout_plans','workouts',
    'scheduled_workouts','workout_sessions','exercise_logs','meal_plans','meals','food_items','user_food_items',
    'meal_food_items','food_logs','progress_entries','weekly_checkins','progress_photos','body_measurements',
    'nutrition_reference_targets','daily_nutrition_recommendations','chat_messages','ai_generated_plans','admin_settings','exercises'
  ] LOOP
    if to_regclass('public.' || t) is not null then
      EXECUTE format('alter table public.%I enable row level security', t);
    end if;
  END LOOP;
END $$;

-- users policy (special: id instead of user_id)
DO $$
BEGIN
  if to_regclass('public.users') is not null then
    execute 'drop policy if exists users_self on public.users';
    execute 'create policy users_self on public.users for all using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin())';
  end if;
END $$;

-- Standard owner policies (guarded)
select public.create_owner_admin_policy('profiles', 'profiles_private', 'user_id');
select public.create_owner_admin_policy('onboarding_answers', 'onboarding_answers_private', 'user_id');
select public.create_owner_admin_policy('calorie_targets', 'calorie_targets_private', 'user_id');
select public.create_owner_admin_policy('user_exercise_items', 'user_exercise_items_private', 'created_by');
select public.create_owner_admin_policy('workout_plans', 'workout_plans_private', 'user_id');
select public.create_owner_admin_policy('workouts', 'workouts_private', 'user_id');
select public.create_owner_admin_policy('scheduled_workouts', 'scheduled_workouts_private', 'user_id');
select public.create_owner_admin_policy('workout_sessions', 'workout_sessions_private', 'user_id');
select public.create_owner_admin_policy('exercise_logs', 'exercise_logs_private', 'user_id');
select public.create_owner_admin_policy('meal_plans', 'meal_plans_private', 'user_id');
select public.create_owner_admin_policy('meals', 'meals_private', 'user_id');
select public.create_owner_admin_policy('user_food_items', 'user_food_items_private', 'user_id');
select public.create_owner_admin_policy('food_logs', 'food_logs_private', 'user_id');
select public.create_owner_admin_policy('progress_entries', 'progress_entries_private', 'user_id');
select public.create_owner_admin_policy('weekly_checkins', 'weekly_checkins_private', 'user_id');
select public.create_owner_admin_policy('progress_photos', 'progress_photos_private', 'user_id');
select public.create_owner_admin_policy('body_measurements', 'body_measurements_private', 'user_id');
select public.create_owner_admin_policy('daily_nutrition_recommendations', 'daily_nutrition_private', 'user_id');
select public.create_owner_admin_policy('chat_messages', 'chat_messages_private', 'user_id');
select public.create_owner_admin_policy('ai_generated_plans', 'ai_generated_plans_private', 'user_id');

-- Public exercise read policy (global library)
DO $$
BEGIN
  if to_regclass('public.exercises') is not null then
    execute 'drop policy if exists exercises_global_read on public.exercises';
    execute 'create policy exercises_global_read on public.exercises for select using (auth.role() = ''authenticated'')';
  end if;
END $$;

-- meal_food_items policy (depends on meals.user_id existing)
DO $$
BEGIN
  if to_regclass('public.meal_food_items') is not null and to_regclass('public.meals') is not null
     and exists (select 1 from information_schema.columns where table_schema='public' and table_name='meal_food_items' and column_name='meal_id')
     and exists (select 1 from information_schema.columns where table_schema='public' and table_name='meals' and column_name='id')
     and exists (select 1 from information_schema.columns where table_schema='public' and table_name='meals' and column_name='user_id') then
    execute 'drop policy if exists meal_food_items_private on public.meal_food_items';
    execute 'create policy meal_food_items_private on public.meal_food_items for all using (exists (select 1 from public.meals m where m.id = meal_id and (m.user_id = auth.uid() or public.is_admin()))) with check (exists (select 1 from public.meals m where m.id = meal_id and (m.user_id = auth.uid() or public.is_admin())))';
  end if;
END $$;

-- food_items policies (global read + owner/admin write)
DO $$
BEGIN
  if to_regclass('public.food_items') is not null and exists (select 1 from information_schema.columns where table_schema='public' and table_name='food_items' and column_name='is_global') and exists (select 1 from information_schema.columns where table_schema='public' and table_name='food_items' and column_name='created_by') then
    execute 'drop policy if exists food_items_read on public.food_items';
    execute 'drop policy if exists food_items_write on public.food_items';
    execute 'create policy food_items_read on public.food_items for select using (auth.role() = ''authenticated'' and (is_global = true or created_by = auth.uid() or public.is_admin()))';
    execute 'create policy food_items_write on public.food_items for all using (created_by = auth.uid() or public.is_admin()) with check ((created_by = auth.uid() and is_global = false) or public.is_admin())';
  end if;
END $$;

-- nutrition reference policies
DO $$
BEGIN
  if to_regclass('public.nutrition_reference_targets') is not null then
    execute 'drop policy if exists nutrition_reference_read on public.nutrition_reference_targets';
    execute 'drop policy if exists nutrition_reference_write on public.nutrition_reference_targets';
    execute 'create policy nutrition_reference_read on public.nutrition_reference_targets for select using (auth.role() = ''authenticated'')';
    execute 'create policy nutrition_reference_write on public.nutrition_reference_targets for all using (public.is_admin()) with check (public.is_admin())';
  end if;
END $$;

-- admin settings admin-only policy
DO $$
BEGIN
  if to_regclass('public.admin_settings') is not null then
    execute 'drop policy if exists admin_settings_admin_only on public.admin_settings';
    execute 'create policy admin_settings_admin_only on public.admin_settings for all using (public.is_admin()) with check (public.is_admin())';
  end if;
END $$;
