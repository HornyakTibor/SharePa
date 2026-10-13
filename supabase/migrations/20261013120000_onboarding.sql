-- Onboarding: the 7 set-up steps (calendar, events, categories, profile, children, friends, labels).

-- ---------- profiles: set-up progress, pick-up points, personal invite code ----------
alter table public.profiles
  add column onboarded_at timestamptz,
  add column pickup_points jsonb not null default '[]'::jsonb,   -- [{id, name, address}]
  add column default_pickup text not null default 'home',        -- 'home' or a pickup_points id
  add column invite_code text unique default substr(md5(gen_random_uuid()::text), 1, 10);

update public.profiles set invite_code = substr(md5(gen_random_uuid()::text), 1, 10) where invite_code is null;
alter table public.profiles alter column invite_code set not null;

-- Everyone who already has an account has seen the app: don't send them to set-up.
update public.profiles set onboarded_at = now() where onboarded_at is null;

-- ---------- children: optional mobile number ----------
alter table public.children add column phone text;

-- ---------- events: where they came from, what kind, and whether SharePa uses them ----------
alter table public.events
  add column kind text not null default 'child' check (kind in ('child', 'family', 'personal')),
  add column source text not null default 'manual',              -- 'manual', 'ics', 'sample'
  add column hidden boolean not null default false;              -- imported but not selected for SharePa

-- Hidden events stay private: friends only see the events a parent chose for SharePa.
alter policy "events: read own and friends'" on public.events
  using (owner_id = (select auth.uid()) or (not hidden and private.is_friend(owner_id)));

create or replace function private.can_see_event(ev uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.events e
    where e.id = ev and (e.owner_id = (select auth.uid()) or (not e.hidden and private.is_friend(e.owner_id)))
  );
$$;

-- ---------- notifications: a new friend ----------
alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('request', 'seats', 'offer', 'confirmed', 'declined', 'friend'));

-- ---------- finding parents already on SharePa ----------
-- Search by name (2+ letters) or exact email. Demo accounts only find demo accounts, and the other way round.
create function public.search_parents(q text)
returns table (id uuid, full_name text, is_friend boolean)
language sql stable security definer set search_path = ''
as $$
  with me as (select p.id, p.is_demo from public.profiles p where p.id = (select auth.uid()))
  select p.id, p.full_name, exists (select 1 from public.friendships f where f.user_id = me.id and f.friend_id = p.id)
  from public.profiles p
  join me on p.id <> me.id and p.is_demo = me.is_demo
  left join auth.users u on u.id = p.id
  where length(trim(q)) >= 2
    and p.full_name <> ''
    and (p.full_name ilike '%' || trim(q) || '%' or lower(u.email) = lower(trim(q)))
  order by p.full_name
  limit 12;
$$;

-- Add a friend (both directions) and let them know.
create function public.add_friend(other uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null or other is null or other = me then
    raise exception 'You can''t add this parent.';
  end if;
  if not exists (
    select 1 from public.profiles o join public.profiles m on m.id = me
    where o.id = other and o.is_demo = m.is_demo
  ) then
    raise exception 'We couldn''t find this parent.';
  end if;
  if exists (select 1 from public.friendships where user_id = me and friend_id = other) then
    return;
  end if;
  insert into public.friendships (user_id, friend_id) values (me, other), (other, me)
    on conflict do nothing;
  perform private.notify(other, me, 'friend', null, null, null,
    private.full_name(me) || ' added you as a friend',
    'You can now share rides with each other.');
end;
$$;

revoke execute on function public.search_parents(text), public.add_friend(uuid) from public, anon;
grant execute on function public.search_parents(text), public.add_friend(uuid) to authenticated;

-- ---------- sign-up through a friend's invite link ----------
-- The invite code travels in the sign-up metadata; the new parent and the inviter become friends.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  inviter uuid;
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));

  select p.id into inviter from public.profiles p
  where p.invite_code = nullif(new.raw_user_meta_data ->> 'invite', '') and not p.is_demo;
  if inviter is not null then
    insert into public.friendships (user_id, friend_id) values (inviter, new.id), (new.id, inviter)
      on conflict do nothing;
    perform private.notify(inviter, new.id, 'friend', null, null, null,
      coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'A parent') || ' joined from your invite',
      'You are now friends on SharePa and can share rides.');
  end if;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------- demo: three more parents Kata can find and add ----------
select public.ensure_demo_user('david', 'david.balogh@demo.sharepa.tiborhornyak.hu', 'Dávid Balogh');
select public.ensure_demo_user('nora',  'nora.farkas@demo.sharepa.tiborhornyak.hu',  'Nóra Farkas');
select public.ensure_demo_user('tamas', 'tamas.papp@demo.sharepa.tiborhornyak.hu',   'Tamás Papp');

-- Nightly tidy-up of what visitors change during onboarding (runs right after reset_demo).
create function private.reset_demo_extras()
returns void language sql security definer set search_path = ''
as $$
  update public.profiles
     set pickup_points = '[]'::jsonb, default_pickup = 'home', onboarded_at = coalesce(onboarded_at, now())
   where is_demo;
$$;
revoke execute on function private.reset_demo_extras() from public, anon, authenticated;
select private.reset_demo_extras();
select cron.schedule('reset-demo-extras', '5 2 * * *', 'select private.reset_demo_extras()');
