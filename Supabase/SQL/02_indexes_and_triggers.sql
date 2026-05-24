-- Indexes for common app queries (guarded for mixed existing schemas)
DO $$
BEGIN
  if to_regclass('public.profiles') is not null and exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='user_id') then
    execute 'create index if not exists idx_profiles_user_id on public.profiles(user_id)';
  end if;

  if to_regclass('public.onboarding_answers') is not null and exists (select 1 from information_schema.columns where table_schema='public' and table_name='onboarding_answers' and column_name='user_id') then
    execute 'create index if not exists idx_onboarding_answers_user_id on public.onboarding_answers(user_id)';
  end if;

  if to_regclass('public.calorie_targets') is not null and exists (select 1 from information_schema.columns where table_schema='public' and table_name='calorie_targets' and column_name='user_id') and exists (select 1 from information_schema.columns where table_schema='public' and table_name='calorie_targets' and column_name='starts_on') then
    execute 'create index if not exists idx_calorie_targets_user_date on public.calorie_targets(user_id, starts_on desc)';
  end if;

  if to_regclass('public.exercises') is not null and exists (select 1 from information_schema.columns where table_schema='public' and table_name='exercises' and column_name='muscle_group') and exists (select 1 from information_schema.columns where table_schema='public' and table_name='exercises' and column_name='difficulty') then
    execute 'create index if not exists idx_exercises_lookup on public.exercises(muscle_group, difficulty)';
  end if;

  if to_regclass('public.user_exercise_items') is not null and exists (select 1 from information_schema.columns where table_schema='public' and table_name='user_exercise_items' and column_name='created_by') then
    execute 'create index if not exists idx_user_exercise_items_owner on public.user_exercise_items(created_by)';
  end if;

  if to_regclass('public.workout_plans') is not null and exists (select 1 from information_schema.columns where table_schema='public' and table_name='workout_plans' and column_name='user_id') then
    execute 'create index if not exists idx_workout_plans_user on public.workout_plans(user_id)';
  end if;

  if to_regclass('public.workouts') is not null and exists (select 1 from information_schema.columns where table_schema='public' and table_name='workouts' and column_name='workout_plan_id') then
    execute 'create index if not exists idx_workouts_plan on public.workouts(workout_plan_id)';
  end if;

  if to_regclass('public.scheduled_workouts') is not null and exists (select 1 from information_schema.columns where table_schema='public' and table_name='scheduled_workouts' and column_name='user_id') and exists (select 1 from information_schema.columns where table_schema='public' and table_name='scheduled_workouts' and column_name='scheduled_date') then
    execute 'create index if not exists idx_scheduled_workouts_user_date on public.scheduled_workouts(user_id, scheduled_date)';
  end if;

  if to_regclass('public.workout_sessions') is not null and exists (select 1 from information_schema.columns where table_schema='public' and table_name='workout_sessions' and column_name='user_id') and exists (select 1 from information_schema.columns where table_schema='public' and table_name='workout_sessions' and column_name='session_date') then
    execute 'create index if not exists idx_workout_sessions_user_date on public.workout_sessions(user_id, session_date desc)';
  end if;

  if to_regclass('public.exercise_logs') is not null and exists (select 1 from information_schema.columns where table_schema='public' and table_name='exercise_logs' and column_name='workout_session_id') then
    execute 'create index if not exists idx_exercise_logs_session on public.exercise_logs(workout_session_id)';
  end if;

  if to_regclass('public.meal_plans') is not null and exists (select 1 from information_schema.columns where table_schema='public' and table_name='meal_plans' and column_name='user_id') then
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name='meal_plans' and column_name='plan_date') then
      execute 'create index if not exists idx_meal_plans_user_date on public.meal_plans(user_id, plan_date desc)';
    elsif exists (select 1 from information_schema.columns where table_schema='public' and table_name='meal_plans' and column_name='created_at') then
      execute 'create index if not exists idx_meal_plans_user_created on public.meal_plans(user_id, created_at desc)';
    else
      execute 'create index if not exists idx_meal_plans_user on public.meal_plans(user_id)';
    end if;
  end if;

  if to_regclass('public.meals') is not null and exists (select 1 from information_schema.columns where table_schema='public' and table_name='meals' and column_name='user_id') then
    execute 'create index if not exists idx_meals_user on public.meals(user_id)';
  end if;

  if to_regclass('public.food_items') is not null and exists (select 1 from information_schema.columns where table_schema='public' and table_name='food_items' and column_name='is_global') then
    execute 'create index if not exists idx_food_items_global on public.food_items(is_global)';
  end if;
  if to_regclass('public.food_items') is not null and exists (select 1 from information_schema.columns where table_schema='public' and table_name='food_items' and column_name='created_by') then
    execute 'create index if not exists idx_food_items_owner on public.food_items(created_by)';
  end if;

  if to_regclass('public.user_food_items') is not null and exists (select 1 from information_schema.columns where table_schema='public' and table_name='user_food_items' and column_name='user_id') then
    execute 'create index if not exists idx_user_food_items_user on public.user_food_items(user_id)';
  end if;
END $$;

-- updated_at automation
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','profiles','onboarding_answers','calorie_targets','user_exercise_items','workout_plans','workouts',
    'scheduled_workouts','workout_sessions','exercise_logs','meal_plans','meals','food_items','user_food_items',
    'meal_food_items','food_logs','progress_entries','weekly_checkins','progress_photos','body_measurements',
    'nutrition_reference_targets','daily_nutrition_recommendations','chat_messages','ai_generated_plans','admin_settings'
  ]
  LOOP
    if to_regclass('public.' || t) is not null then
      EXECUTE format('drop trigger if exists trg_%s_updated_at on public.%s;', t, t);
      EXECUTE format('create trigger trg_%s_updated_at before update on public.%s for each row execute function public.set_updated_at();', t, t);
    end if;
  END LOOP;
END $$;
