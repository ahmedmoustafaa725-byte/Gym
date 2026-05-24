insert into public.exercises (id, name, muscle_group, equipment, difficulty, instructions, common_mistakes, alternatives)
values
  ('bench-press', 'Bench Press', 'Chest', 'Barbell', 'intermediate', array['Set eyes under the bar', 'Lower to mid-chest', 'Press with feet planted'], array['Bouncing the bar', 'Flaring elbows'], array['Dumbbell press', 'Push-up']),
  ('goblet-squat', 'Goblet Squat', 'Legs', 'Dumbbell', 'beginner', array['Hold weight close', 'Sit between hips', 'Drive through whole foot'], array['Heels lifting', 'Knees collapsing'], array['Bodyweight squat', 'Leg press']),
  ('burpee', 'Burpee', 'Full body', 'Bodyweight', 'intermediate', array['Hands to floor', 'Step or jump back', 'Stand tall'], array['Sagging back', 'Rushed reps'], array['Squat thrust', 'Incline burpee'])
on conflict (id) do nothing;

insert into public.exercise_videos (exercise_id, video_url, thumbnail, source, license_note, attribution, is_verified)
values
  ('burpee', 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Burpee.webm', 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?auto=format&fit=crop&w=900&q=80', 'Wikimedia Commons', 'Check page-level license and attribution before production use.', 'Wikimedia Commons file page', false),
  ('bench-press', 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Half_rack_resistance_exercise_workout.webm', 'https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?auto=format&fit=crop&w=900&q=80', 'Wikimedia Commons', 'Check page-level license and attribution before production use.', 'Wikimedia Commons file page', false)
on conflict do nothing;

insert into public.meals (id, name, arabic_name, aliases, cuisine, tags, portion_size, calories, protein, carbs, fat, normal_calories, fitness_calories, instructions, healthier_tips, allergy_notes, budget_level, cooking_time_minutes)
values
  ('hawawshi', 'Hawawshi', 'حواوشي', array['hawawshi','حواوشي','رغيف حواوشي'], 'Egyptian', array['Egyptian','High protein','Air fryer'], '1 medium loaf', 520, 32, 52, 20, '700-900 kcal', '450-600 kcal', array['Mix lean meat with vegetables', 'Fill bread lightly', 'Air fry or bake'], array['Use lean meat','Reduce oil','Add salad','Use half bread if cutting'], 'Contains gluten', 'medium', 30),
  ('ful-medames', 'Ful Medames', 'فول', array['ful','foul','فول','فول مدمس'], 'Egyptian', array['Egyptian','Budget','Vegetarian'], '1 bowl, 250 g', 330, 18, 48, 8, '350-550 kcal', '280-380 kcal', array['Warm beans','Mash with lemon and cumin'], array['Measure oil','Add vegetables','Pair with eggs'], null, 'low', 10),
  ('koshari', 'Koshari', 'كشرى', array['koshari','koshary','كشرى','كشري'], 'Egyptian', array['Egyptian','Budget','Vegetarian'], '1 fitness bowl', 560, 21, 96, 10, '800-1200 kcal', '500-650 kcal', array['Use smaller rice and pasta portions','Add extra lentils'], array['Double lentils','Reduce fried onions'], null, 'low', 40)
on conflict (id) do nothing;

insert into public.ingredients (meal_id, name, amount)
values
  ('hawawshi', 'Lean minced beef', '120 g'),
  ('hawawshi', 'Baladi bread', '1 small loaf'),
  ('ful-medames', 'Fava beans', '250 g'),
  ('koshari', 'Lentils', '120 g cooked')
on conflict do nothing;

insert into public.admin_settings (key, value, category)
values
  ('food_parser_system', 'Parse English, Arabic, and Egyptian Arabic food descriptions into portions, calories, and macros. Ask clarifying questions when needed.', 'ai_prompt'),
  ('workout_generator_system', 'Create safe progressive plans based on goal, equipment, injuries, schedule, and time.', 'ai_prompt'),
  ('safety_disclaimer', 'This is not medical advice. Avoid extreme diets and do not train through serious pain.', 'safety')
on conflict (key) do nothing;
