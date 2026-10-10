-- One row per Journey aggregate; the full document lives in `data`.
create table if not exists public.journeys (
  id          uuid primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  topic       text not null check (char_length(topic) <= 200),
  title       text not null,
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists journeys_user_updated_idx
  on public.journeys (user_id, updated_at desc);

alter table public.journeys enable row level security;

create policy "Users read their own journeys"
  on public.journeys for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users create their own journeys"
  on public.journeys for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users update their own journeys"
  on public.journeys for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users delete their own journeys"
  on public.journeys for delete
  to authenticated
  using ((select auth.uid()) = user_id);
