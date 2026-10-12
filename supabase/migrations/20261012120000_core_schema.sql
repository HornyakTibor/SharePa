-- SharePa core schema: parents, children, friends, weekly events and rides.
-- Row-level security: a parent sees their own data, plus what their friends share with them.

-- ---------- profiles (one per parent, created automatically on sign-up) ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text,
  address text,
  emergency_name text,
  emergency_phone text,
  is_demo boolean not null default false,
  demo_key text unique,            -- stable handle for demo seed data, e.g. 'kata'
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- children (never have their own accounts) ----------
create table public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index children_parent_idx on public.children (parent_id);

-- ---------- friendships (one row per direction, labels are the owner's own) ----------
create table public.friendships (
  user_id uuid not null references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  labels text[] not null default '{}',
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);
create index friendships_friend_idx on public.friendships (friend_id);

-- ---------- weekly events (0 = Monday … 6 = Sunday) ----------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  place text,
  category text,                   -- e.g. 'Sport'
  activity text,                   -- e.g. 'Swimming'
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  needs_ride boolean not null default true,
  created_at timestamptz not null default now()
);
create index events_owner_idx on public.events (owner_id);

create table public.event_children (
  event_id uuid not null references public.events (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  primary key (event_id, child_id)
);
create index event_children_child_idx on public.event_children (child_id);

-- ---------- rides (one per event occurrence and driver) ----------
create table public.rides (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  ride_date date not null,
  driver_id uuid not null references public.profiles (id) on delete cascade,
  seats smallint not null default 1 check (seats between 0 and 8),
  pickup text,
  pickup_time time,
  status text not null default 'offered' check (status in ('offered', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);
create index rides_event_idx on public.rides (event_id);
create index rides_driver_idx on public.rides (driver_id);

create table public.ride_passengers (
  ride_id uuid not null references public.rides (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  primary key (ride_id, child_id)
);
create index ride_passengers_child_idx on public.ride_passengers (child_id);

-- ---------- helpers used by the access rules ----------
create function public.is_friend(other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.friendships f
    where f.user_id = (select auth.uid()) and f.friend_id = other
  );
$$;

create function public.can_see_event(ev uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.events e
    where e.id = ev
      and (e.owner_id = (select auth.uid()) or public.is_friend(e.owner_id))
  );
$$;

create function public.can_see_ride(r uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.rides x
    where x.id = r
      and (x.driver_id = (select auth.uid()) or public.is_friend(x.driver_id) or public.can_see_event(x.event_id))
  );
$$;

revoke execute on function public.is_friend(uuid), public.can_see_event(uuid), public.can_see_ride(uuid) from public, anon;
grant execute on function public.is_friend(uuid), public.can_see_event(uuid), public.can_see_ride(uuid) to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------- row-level security ----------
alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.friendships enable row level security;
alter table public.events enable row level security;
alter table public.event_children enable row level security;
alter table public.rides enable row level security;
alter table public.ride_passengers enable row level security;

-- profiles: me and my friends; I edit only myself
create policy "profiles: read self and friends" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or public.is_friend(id));
create policy "profiles: update self" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- children: mine and my friends'; I manage only mine
create policy "children: read own and friends'" on public.children
  for select to authenticated using (parent_id = (select auth.uid()) or public.is_friend(parent_id));
create policy "children: manage own" on public.children
  for all to authenticated using (parent_id = (select auth.uid())) with check (parent_id = (select auth.uid()));

-- friendships: only my own list
create policy "friendships: manage own" on public.friendships
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- events: mine and my friends'; I manage only mine
create policy "events: read own and friends'" on public.events
  for select to authenticated using (owner_id = (select auth.uid()) or public.is_friend(owner_id));
create policy "events: manage own" on public.events
  for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

-- which children go to an event: visible with the event; managed by the event owner
create policy "event_children: read with event" on public.event_children
  for select to authenticated using (public.can_see_event(event_id));
create policy "event_children: manage own events" on public.event_children
  for all to authenticated
  using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));

-- rides: visible to the driver, the driver's friends and anyone who can see the event; the driver manages them
create policy "rides: read" on public.rides
  for select to authenticated
  using (driver_id = (select auth.uid()) or public.is_friend(driver_id) or public.can_see_event(event_id));
create policy "rides: drivers manage" on public.rides
  for all to authenticated using (driver_id = (select auth.uid())) with check (driver_id = (select auth.uid()));

-- passengers: visible with the ride; the driver or the child's parent can add / remove
create policy "ride_passengers: read with ride" on public.ride_passengers
  for select to authenticated using (public.can_see_ride(ride_id));
create policy "ride_passengers: driver or parent manage" on public.ride_passengers
  for all to authenticated
  using (
    exists (select 1 from public.rides r where r.id = ride_id and r.driver_id = (select auth.uid()))
    or exists (select 1 from public.children c where c.id = child_id and c.parent_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from public.rides r where r.id = ride_id and r.driver_id = (select auth.uid()))
    or exists (select 1 from public.children c where c.id = child_id and c.parent_id = (select auth.uid()))
  );
