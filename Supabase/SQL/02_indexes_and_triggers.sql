-- Indexes for common app queries
create index if not exists idx_profiles_user_id on public.profiles(user_id);
create index if not exists idx_onboarding_answers_user_id on public.onboarding_answers(user_id);
create index if not exists idx_calorie_targets_user_date on public.calorie_targets(user_id, starts_on desc);
create index if not exists idx_exercise_library_global on public.exercise_library(is_global);
create index if not exists idx_exercise_library_owner on public.exercise_library(owner_user_id);
create index if not exists idx_workout_plans_user on public.workout_plans(user_id);
create index if not exists idx_workouts_plan on public.workouts(workout_plan_id);
create index if not exists idx_scheduled_workouts_user_date on public.scheduled_workouts(user_id, scheduled_date);
create index if not exists idx_workout_sessions_user_date on public.workout_sessions(user_id, session_date desc);
create index if not exists idx_exercise_logs_session on public.exercise_logs(workout_session_id);
create index if not exists idx_meal_plans_user_date on public.meal_plans(user_id, plan_date desc);
create index if not exists idx_meals_user on public.meals(user_id);
create index if not exists idx_food_items_global on public.food_items(is_global);
create index if not exists idx_food_items_owner on public.food_items(owner_user_id);
create index if not exists idx_food_items_search on public.food_items using gin(to_tsvector('simple', food_name || ' ' || serving_size));
create index if not exists idx_user_food_items_user on public.user_food_items(user_id);
create index if not exists idx_meal_food_items_meal on public.meal_food_items(meal_id);
create index if not exists idx_food_logs_user_date on public.food_logs(user_id, log_date desc);
create index if not exists idx_progress_entries_user_date on public.progress_entries(user_id, entry_date desc);
create index if not exists idx_weekly_checkins_user_week on public.weekly_checkins(user_id, week_start desc);
create index if not exists idx_progress_photos_user on public.progress_photos(user_id);
create index if not exists idx_body_measurements_user_date on public.body_measurements(user_id, measured_at desc);
create index if not exists idx_daily_nutrition_user_date on public.daily_nutrition_recommendations(user_id, target_date desc);
create index if not exists idx_chat_messages_user_created on public.chat_messages(user_id, created_at desc);
create index if not exists idx_ai_generated_plans_user_type on public.ai_generated_plans(user_id, plan_type, created_at desc);

-- updated_at automation
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','profiles','onboarding_answers','calorie_targets','exercise_library','workout_plans','workouts',
    'scheduled_workouts','workout_sessions','exercise_logs','meal_plans','meals','food_items','user_food_items',
    'meal_food_items','food_logs','progress_entries','weekly_checkins','progress_photos','body_measurements',
    'nutrition_reference_targets','daily_nutrition_recommendations','chat_messages','ai_generated_plans','admin_settings'
  ]
  LOOP
    EXECUTE format('drop trigger if exists trg_%s_updated_at on public.%s;', t, t);
    EXECUTE format('create trigger trg_%s_updated_at before update on public.%s for each row execute function public.set_updated_at();', t, t);
  END LOOP;
END $$;
