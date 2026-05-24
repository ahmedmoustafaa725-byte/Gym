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

-- Enable RLS across all app tables
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','profiles','onboarding_answers','calorie_targets','exercise_library','workout_plans','workouts',
    'scheduled_workouts','workout_sessions','exercise_logs','meal_plans','meals','food_items','user_food_items',
    'meal_food_items','food_logs','progress_entries','weekly_checkins','progress_photos','body_measurements',
    'nutrition_reference_targets','daily_nutrition_recommendations','chat_messages','ai_generated_plans','admin_settings'
  ] LOOP
    EXECUTE format('alter table public.%s enable row level security;', t);
  END LOOP;
END $$;

-- Generic private-data policy helper pattern: user owns row or admin.
create policy users_self on public.users for all
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy profiles_private on public.profiles for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy onboarding_answers_private on public.onboarding_answers for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy calorie_targets_private on public.calorie_targets for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- Public/global exercise items can be read by authenticated users.
create policy exercise_library_read on public.exercise_library for select
  using (auth.role() = 'authenticated' and (is_global = true or owner_user_id = auth.uid() or public.is_admin()));
create policy exercise_library_write on public.exercise_library for all
  using (owner_user_id = auth.uid() or public.is_admin())
  with check ((owner_user_id = auth.uid() and is_global = false) or public.is_admin());

create policy workout_plans_private on public.workout_plans for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
create policy workouts_private on public.workouts for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
create policy scheduled_workouts_private on public.scheduled_workouts for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
create policy workout_sessions_private on public.workout_sessions for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
create policy exercise_logs_private on public.exercise_logs for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy meal_plans_private on public.meal_plans for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
create policy meals_private on public.meals for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
create policy meal_food_items_private on public.meal_food_items for all
  using (exists (select 1 from public.meals m where m.id = meal_id and (m.user_id = auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.meals m where m.id = meal_id and (m.user_id = auth.uid() or public.is_admin())));

-- Public/global food items readable; user-created foods isolated.
create policy food_items_read on public.food_items for select
  using (auth.role() = 'authenticated' and (is_global = true or owner_user_id = auth.uid() or public.is_admin()));
create policy food_items_write on public.food_items for all
  using (owner_user_id = auth.uid() or public.is_admin())
  with check ((owner_user_id = auth.uid() and is_global = false) or public.is_admin());

create policy user_food_items_private on public.user_food_items for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy food_logs_private on public.food_logs for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy progress_entries_private on public.progress_entries for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
create policy weekly_checkins_private on public.weekly_checkins for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
create policy progress_photos_private on public.progress_photos for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
create policy body_measurements_private on public.body_measurements for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- Global nutrition references are readable by authenticated users, admin-write only.
create policy nutrition_reference_read on public.nutrition_reference_targets for select
  using (auth.role() = 'authenticated');
create policy nutrition_reference_write on public.nutrition_reference_targets for all
  using (public.is_admin())
  with check (public.is_admin());

create policy daily_nutrition_private on public.daily_nutrition_recommendations for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy chat_messages_private on public.chat_messages for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy ai_generated_plans_private on public.ai_generated_plans for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- Admin-only configuration data.
create policy admin_settings_admin_only on public.admin_settings for all
  using (public.is_admin())
  with check (public.is_admin());
