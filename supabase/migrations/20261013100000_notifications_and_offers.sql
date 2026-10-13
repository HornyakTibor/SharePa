-- Notifications, driving offers and approving an offer.
-- Flow: a parent asks friends for a ride (ride_choices 'join') -> friends get a 'request' notification
-- -> a friend offers (rides row 'offered') -> the parent gets an 'offer' notification
-- -> the parent approves one (accept_ride_offer) -> driver gets 'confirmed', other offerers get 'declined'.
-- Demo friends answer requests from the demo parent instantly, so the demo shows the whole loop.

-- One ride per driver per event occurrence
create unique index rides_one_per_driver on public.rides (event_id, ride_date, driver_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('request', 'seats', 'offer', 'confirmed', 'declined')),
  event_id uuid references public.events (id) on delete cascade,
  ride_date date,
  ride_id uuid references public.rides (id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique (recipient_id, kind, event_id, ride_date, actor_id)
);
create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc);

alter table public.notifications enable row level security;
create policy "notifications: read own" on public.notifications
  for select to authenticated using (recipient_id = (select auth.uid()));
create policy "notifications: mark own read" on public.notifications
  for update to authenticated using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));
-- Parents may only change read_at; everything else is written by the database itself.
revoke insert, update on public.notifications from authenticated, anon;
grant update (read_at) on public.notifications to authenticated;

-- "Piano lesson · Wed 14 Oct, 17:00"
create function private.occurrence_label(p_event uuid, p_date date)
returns text language sql stable security definer set search_path = ''
as $$
  select e.title || ' · ' || to_char(p_date, 'Dy FMDD Mon') || ', ' || left(e.start_time::text, 5)
  from public.events e where e.id = p_event;
$$;

create function private.first_name(p uuid)
returns text language sql stable security definer set search_path = ''
as $$ select split_part(full_name, ' ', 1) from public.profiles where id = p; $$;

create function private.full_name(p uuid)
returns text language sql stable security definer set search_path = ''
as $$ select full_name from public.profiles where id = p; $$;

-- Create or refresh one notification (a repeat of the same kind becomes unread again).
create function private.notify(p_recipient uuid, p_actor uuid, p_kind text, p_event uuid, p_date date, p_ride uuid, p_title text, p_body text)
returns void language sql security definer set search_path = ''
as $$
  insert into public.notifications (recipient_id, actor_id, kind, event_id, ride_date, ride_id, title, body)
  values (p_recipient, p_actor, p_kind, p_event, p_date, p_ride, p_title, p_body)
  on conflict (recipient_id, kind, event_id, ride_date, actor_id)
  do update set ride_id = excluded.ride_id, title = excluded.title, body = excluded.body, created_at = now(), read_at = null;
$$;

-- Children named in a parent's ride request, e.g. "Bence and Luca"
create function private.requested_kids(p_event uuid, p_date date, p_parent uuid)
returns text language sql stable security definer set search_path = ''
as $$
  select string_agg(c.name, ' and ' order by c.name)
  from public.ride_choices rc join public.children c on c.id = any (rc.child_ids)
  where rc.event_id = p_event and rc.ride_date = p_date and rc.parent_id = p_parent;
$$;

-- A parent saved a choice: tell the friends they ticked; demo friends offer to drive at once.
create function private.on_ride_choice()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  ev public.events%rowtype;
  label text := private.occurrence_label(new.event_id, new.ride_date);
  me text := private.full_name(new.parent_id);
  kids text := coalesce(private.requested_kids(new.event_id, new.ride_date, new.parent_id), 'their child');
  mine public.rides%rowtype;
  f uuid;
  n int := 0;
begin
  if new.mode = 'none' then return new; end if;
  select * into ev from public.events where id = new.event_id;

  if new.mode = 'drive' then
    select * into mine from public.rides where event_id = new.event_id and ride_date = new.ride_date and driver_id = new.parent_id;
  end if;

  foreach f in array new.notified_ids loop
    if new.mode = 'join' then
      perform private.notify(f, new.parent_id, 'request', new.event_id, new.ride_date, null,
        'Ride request', me || ' needs a ride for ' || kids || ' to ' || label || '.');
    else
      perform private.notify(f, new.parent_id, 'seats', new.event_id, new.ride_date, mine.id,
        'Free seats', me || ' is driving to ' || label || ' with ' || coalesce(mine.seats, 1) || ' free seat'
        || case when coalesce(mine.seats, 1) = 1 then '' else 's' end
        || coalesce('. Pick-up ' || left(mine.pickup_time::text, 5) || ' · ' || mine.pickup, '') || '.');
    end if;
  end loop;

  -- Demo: up to two ticked demo friends answer with a driving offer straight away.
  if new.mode = 'join' and exists (select 1 from public.profiles where id = new.parent_id and is_demo) then
    for f in
      select p.id from public.profiles p
      where p.id = any (new.notified_ids) and p.is_demo
      order by p.full_name limit 2
    loop
      n := n + 1;
      insert into public.rides (event_id, ride_date, driver_id, seats, pickup, pickup_time, status)
      values (new.event_id, new.ride_date, f,
              case n when 1 then 3 else 2 end,
              case n when 1 then 'School gate' else 'Bikás park, bus stop' end,
              ev.start_time - make_interval(mins => case n when 1 then 20 else 15 end),
              'offered')
      on conflict (event_id, ride_date, driver_id)
      do update set status = 'offered', seats = excluded.seats, pickup = excluded.pickup, pickup_time = excluded.pickup_time
      where public.rides.status = 'cancelled';
    end loop;
  end if;
  return new;
end;
$$;

create trigger ride_choice_saved
  after insert or update on public.ride_choices
  for each row execute function private.on_ride_choice();

-- Someone offered to drive to another parent's event: tell the event owner.
create function private.on_ride_offer()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  owner uuid;
  kids text;
begin
  select owner_id into owner from public.events where id = new.event_id;
  if new.status <> 'offered' or owner = new.driver_id then return new; end if;
  if tg_op = 'UPDATE' and old.status = 'offered' then return new; end if;
  kids := coalesce(private.requested_kids(new.event_id, new.ride_date, owner), 'your child');
  perform private.notify(owner, new.driver_id, 'offer', new.event_id, new.ride_date, new.id,
    'Driving offer',
    private.full_name(new.driver_id) || ' can take ' || kids || ' to ' || private.occurrence_label(new.event_id, new.ride_date)
    || '. ' || new.seats || ' free seat' || case when new.seats = 1 then '' else 's' end
    || coalesce(' · pick-up ' || left(new.pickup_time::text, 5) || ' · ' || new.pickup, '') || '.');
  return new;
end;
$$;

create trigger ride_offered
  after insert or update of status on public.rides
  for each row execute function private.on_ride_offer();

-- The event owner approves one offer: confirm it, add the children, decline the other offers.
create function public.accept_ride_offer(p_ride uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  r public.rides%rowtype;
  owner uuid;
  kids uuid[];
  other record;
  label text;
begin
  select * into r from public.rides where id = p_ride;
  select owner_id into owner from public.events where id = r.event_id;
  if r.id is null or owner is distinct from me then raise exception 'You can only approve offers for your own events.'; end if;
  if r.status <> 'offered' then raise exception 'This offer is no longer open.'; end if;
  if r.ride_date < (now() at time zone 'Europe/Budapest')::date then raise exception 'This event is already over.'; end if;

  label := private.occurrence_label(r.event_id, r.ride_date);
  select child_ids into kids from public.ride_choices where event_id = r.event_id and ride_date = r.ride_date and parent_id = me;

  update public.rides set status = 'confirmed' where id = p_ride;
  insert into public.ride_passengers (ride_id, child_id) select p_ride, unnest(coalesce(kids, '{}')) on conflict do nothing;

  perform private.notify(r.driver_id, me, 'confirmed', r.event_id, r.ride_date, p_ride,
    'Ride confirmed', private.full_name(me) || ' approved your offer: you’re taking '
    || coalesce(private.requested_kids(r.event_id, r.ride_date, me), 'their child') || ' to ' || label || '.');

  for other in
    select id, driver_id from public.rides
    where event_id = r.event_id and ride_date = r.ride_date and id <> p_ride and status = 'offered' and driver_id <> me
  loop
    update public.rides set status = 'cancelled' where id = other.id;
    perform private.notify(other.driver_id, me, 'declined', r.event_id, r.ride_date, other.id,
      'Ride found', private.full_name(me) || ' found a ride for ' || label || '. Thanks for offering!');
  end loop;

  return private.full_name(r.driver_id);
end;
$$;

revoke execute on function public.accept_ride_offer(uuid) from public, anon;
grant execute on function public.accept_ride_offer(uuid) to authenticated;
revoke execute on function private.occurrence_label(uuid, date), private.first_name(uuid), private.full_name(uuid),
  private.notify(uuid, uuid, text, uuid, date, uuid, text, text), private.requested_kids(uuid, date, uuid),
  private.on_ride_choice(), private.on_ride_offer() from public, anon, authenticated;
