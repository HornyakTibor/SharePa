-- A parent's choice for one event occurrence: join a ride, drive (offer seats) or no ride needed.
-- "drive" also creates / updates the parent's row in public.rides.
create table public.ride_choices (
  event_id uuid not null references public.events (id) on delete cascade,
  ride_date date not null,
  parent_id uuid not null references public.profiles (id) on delete cascade,
  mode text not null check (mode in ('join', 'drive', 'none')),
  child_ids uuid[] not null default '{}',      -- children who need the ride (join)
  notified_ids uuid[] not null default '{}',   -- friends who were sent the note
  note text check (char_length(note) <= 1000),
  updated_at timestamptz not null default now(),
  primary key (event_id, ride_date, parent_id)
);
create index ride_choices_parent_idx on public.ride_choices (parent_id);

alter table public.ride_choices enable row level security;

-- The parent manages their own choices; friends they notified can read them.
create policy "ride_choices: manage own" on public.ride_choices
  for all to authenticated
  using (parent_id = (select auth.uid()))
  with check (parent_id = (select auth.uid()));
create policy "ride_choices: notified friends read" on public.ride_choices
  for select to authenticated
  using ((select auth.uid()) = any (notified_ids));
