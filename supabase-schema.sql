-- Run this once in Supabase → SQL Editor → New query → Run.
-- It creates the tables StudySpark needs, and locks each one down
-- with Row Level Security so every user can only see and change
-- their own rows.

create extension if not exists pgcrypto;

-- FLASHCARDS ---------------------------------------------------
create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  answer text not null,
  difficult boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.flashcards enable row level security;

create policy "Users can view own flashcards"
  on public.flashcards for select
  using (auth.uid() = user_id);

create policy "Users can insert own flashcards"
  on public.flashcards for insert
  with check (auth.uid() = user_id);

create policy "Users can update own flashcards"
  on public.flashcards for update
  using (auth.uid() = user_id);

create policy "Users can delete own flashcards"
  on public.flashcards for delete
  using (auth.uid() = user_id);

-- NOTES (one saved study guide per user, overwritten on Generate) --
create table if not exists public.notes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  raw_text text,
  summary text,
  concepts jsonb,
  vocab jsonb,
  updated_at timestamptz not null default now()
);

alter table public.notes enable row level security;

create policy "Users can view own notes"
  on public.notes for select
  using (auth.uid() = user_id);

create policy "Users can insert own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notes"
  on public.notes for update
  using (auth.uid() = user_id);

-- PLANNER ITEMS --------------------------------------------------
create table if not exists public.planner_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  exam_date date not null,
  created_at timestamptz not null default now()
);

alter table public.planner_items enable row level security;

create policy "Users can view own planner items"
  on public.planner_items for select
  using (auth.uid() = user_id);

create policy "Users can insert own planner items"
  on public.planner_items for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own planner items"
  on public.planner_items for delete
  using (auth.uid() = user_id);

-- QUIZ RESULTS -----------------------------------------------------
create table if not exists public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  score int not null,
  total int not null,
  created_at timestamptz not null default now()
);

alter table public.quiz_results enable row level security;

create policy "Users can view own quiz results"
  on public.quiz_results for select
  using (auth.uid() = user_id);

create policy "Users can insert own quiz results"
  on public.quiz_results for insert
  with check (auth.uid() = user_id);
