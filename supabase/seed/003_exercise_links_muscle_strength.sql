-- Curated Muscle & Strength links for common exercises.
-- Uses approximate_match=true only when exact page name is unavailable.

update public.exercises set
  source_name = 'Muscle & Strength',
  source_url = 'https://www.muscleandstrength.com/exercises/barbell-bench-press-medium-grip',
  video_url = coalesce(nullif(video_url, ''), 'https://www.muscleandstrength.com/exercises/barbell-bench-press-medium-grip'),
  approximate_match = false
where lower(name) in ('barbell bench press', 'bench press');

update public.exercises set
  source_name = 'Muscle & Strength',
  source_url = 'https://www.muscleandstrength.com/exercises/pullups',
  video_url = coalesce(nullif(video_url, ''), 'https://www.muscleandstrength.com/exercises/pullups'),
  approximate_match = false
where lower(name) in ('pull-up', 'pull up', 'pullups');

update public.exercises set
  source_name = 'Muscle & Strength',
  source_url = 'https://www.muscleandstrength.com/exercises/barbell-squat',
  video_url = coalesce(nullif(video_url, ''), 'https://www.muscleandstrength.com/exercises/barbell-squat'),
  approximate_match = false
where lower(name) in ('back squat', 'barbell squat', 'squat');

update public.exercises set
  source_name = 'Muscle & Strength',
  source_url = 'https://www.muscleandstrength.com/exercises/barbell-deadlift',
  video_url = coalesce(nullif(video_url, ''), 'https://www.muscleandstrength.com/exercises/barbell-deadlift'),
  approximate_match = false
where lower(name) in ('deadlift', 'barbell deadlift');

update public.exercises set
  source_name = 'Muscle & Strength',
  source_url = 'https://www.muscleandstrength.com/exercises/barbell-overhead-shoulder-press',
  video_url = coalesce(nullif(video_url, ''), 'https://www.muscleandstrength.com/exercises/barbell-overhead-shoulder-press'),
  approximate_match = false
where lower(name) in ('overhead press', 'barbell overhead press', 'shoulder press');

update public.exercises set
  source_name = 'Muscle & Strength',
  source_url = 'https://www.muscleandstrength.com/exercises/plank',
  video_url = coalesce(nullif(video_url, ''), 'https://www.muscleandstrength.com/exercises/plank'),
  approximate_match = false
where lower(name) in ('plank', 'front plank');

update public.exercises set
  source_name = 'Muscle & Strength',
  source_url = 'https://www.muscleandstrength.com/exercises/elliptical-trainer',
  video_url = coalesce(nullif(video_url, ''), 'https://www.muscleandstrength.com/exercises/elliptical-trainer'),
  approximate_match = true
where lower(name) in ('elliptical', 'cross trainer');
