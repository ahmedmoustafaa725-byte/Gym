alter table public.exercises add column if not exists secondary_muscles text[] not null default '{}';
alter table public.exercises add column if not exists training_location text not null default 'both';
alter table public.exercises add column if not exists category text;
alter table public.exercises add column if not exists movement_pattern text;
alter table public.exercises add column if not exists source_name text;
alter table public.exercises add column if not exists source_url text;
alter table public.exercises add column if not exists video_url text;
alter table public.exercises add column if not exists approximate_match boolean not null default false;

create index if not exists exercises_muscle_group_idx on public.exercises(muscle_group);
create index if not exists exercises_equipment_idx on public.exercises(equipment);
create index if not exists exercises_difficulty_idx on public.exercises(difficulty);
create index if not exists exercises_category_idx on public.exercises(category);
create index if not exists exercises_training_location_idx on public.exercises(training_location);
