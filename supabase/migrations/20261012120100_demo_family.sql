-- Demo mode: Kata Molnár (the prototype persona), her two children, seven parent friends,
-- a week of activities and some rides. public.reset_demo() rebuilds it; pg_cron runs it nightly.
-- The demo accounts get random passwords here. The password visitors use (through the
-- "Try the demo" button) is set separately and kept out of the repository.

create extension if not exists pg_cron;

-- Creates (or keeps) a confirmed email user for demo data; returns its id.
create function public.ensure_demo_user(p_key text, p_email text, p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid;
begin
  select id into uid from auth.users where email = p_email;
  if uid is null then
    uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', p_email,
      extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', p_name), now(), now(),
      '', '', '', ''
    );
    insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), uid::text, uid,
            jsonb_build_object('sub', uid::text, 'email', p_email, 'email_verified', true),
            'email', now(), now(), now());
  end if;
  update public.profiles
     set full_name = p_name, is_demo = true, demo_key = p_key
   where id = uid;
  return uid;
end;
$$;

-- Date of the next occurrence (today included) of a weekday, 0 = Monday.
create function public.next_weekday(wd int, from_date date default current_date)
returns date
language sql
stable
set search_path = ''
as $$
  select from_date + ((wd - (extract(isodow from from_date)::int - 1) + 7) % 7);
$$;

create function public.reset_demo()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  kata uuid; anna uuid; peter uuid; eszter uuid; gabor uuid; julia uuid; zoltan uuid; reka uuid;
  bence uuid; luca uuid;
  e_judo uuid; e_swim uuid; e_piano uuid; e_art uuid; e_maths uuid; e_foot uuid;
  r uuid;
  d text := '@demo.sharepa.tiborhornyak.hu';
begin
  kata   := public.ensure_demo_user('kata',   'demo@sharepa.tiborhornyak.hu', 'Kata Molnár');
  anna   := public.ensure_demo_user('anna',   'anna.kovacs' || d,   'Anna Kovács');
  peter  := public.ensure_demo_user('peter',  'peter.nagy' || d,    'Péter Nagy');
  eszter := public.ensure_demo_user('eszter', 'eszter.szabo' || d,  'Eszter Szabó');
  gabor  := public.ensure_demo_user('gabor',  'gabor.toth' || d,    'Gábor Tóth');
  julia  := public.ensure_demo_user('julia',  'julia.horvath' || d, 'Júlia Horváth');
  zoltan := public.ensure_demo_user('zoltan', 'zoltan.varga' || d,  'Zoltán Varga');
  reka   := public.ensure_demo_user('reka',   'reka.kiss' || d,     'Réka Kiss');

  -- Wipe everything the demo accounts own (cascades to rides, passengers, event children).
  delete from public.events      where owner_id in (select id from public.profiles where is_demo);
  delete from public.rides       where driver_id in (select id from public.profiles where is_demo);
  delete from public.children    where parent_id in (select id from public.profiles where is_demo);
  delete from public.friendships where user_id in (select id from public.profiles where is_demo);

  update public.profiles set
    phone = '+36 20 565 6589',
    address = 'Fehérvári út 41, 1117 Budapest',
    emergency_name = 'Gergő Molnár',
    emergency_phone = '+36 30 412 7788'
  where id = kata;

  -- Kata's children, and one child for each friend
  insert into public.children (parent_id, name) values (kata, 'Bence') returning id into bence;
  insert into public.children (parent_id, name) values (kata, 'Luca') returning id into luca;
  insert into public.children (parent_id, name) values
    (anna, 'Lili'), (peter, 'Máté'), (eszter, 'Dóra'), (gabor, 'Ádám'),
    (julia, 'Zsófi'), (zoltan, 'Bálint'), (reka, 'Noémi');

  -- Friends, both directions; labels are how Kata groups them
  insert into public.friendships (user_id, friend_id, labels) values
    (kata, anna,   '{Swimming,"Class 3B"}'),
    (kata, peter,  '{Football,Neighbours}'),
    (kata, eszter, '{"Art school"}'),
    (kata, gabor,  '{Football}'),
    (kata, julia,  '{Swimming}'),
    (kata, zoltan, '{Judo}'),
    (kata, reka,   '{"Class 3B",Neighbours}');
  insert into public.friendships (user_id, friend_id)
    select f.friend_id, kata from public.friendships f where f.user_id = kata;

  -- Kata's weekly calendar
  insert into public.events (owner_id, title, place, category, activity, weekday, start_time, needs_ride)
    values (kata, 'Dentist (me)', 'Dr. Kerekes, Bartók Béla út', null, null, 0, '08:00', false);
  insert into public.events (owner_id, title, place, category, activity, weekday, start_time)
    values (kata, 'Judo', 'MOM Sport', 'Sport', 'Judo', 0, '16:30') returning id into e_judo;
  insert into public.events (owner_id, title, place, category, activity, weekday, start_time)
    values (kata, 'Swimming practice', 'Komjádi pool', 'Sport', 'Swimming', 1, '16:30') returning id into e_swim;
  insert into public.events (owner_id, title, place, category, activity, weekday, start_time)
    values (kata, 'Piano lesson', 'Music school, Villányi út', 'Music', 'Piano', 2, '17:00') returning id into e_piano;
  insert into public.events (owner_id, title, place, category, activity, weekday, start_time)
    values (kata, 'Art school', 'Kisrajzolók studio', 'Art', 'Drawing', 3, '15:30') returning id into e_art;
  insert into public.events (owner_id, title, place, category, activity, weekday, start_time)
    values (kata, 'Maths tutor', 'Mrs. Fehér, Etele út', 'Private teacher', 'Maths', 4, '16:00') returning id into e_maths;
  insert into public.events (owner_id, title, place, category, activity, weekday, start_time)
    values (kata, 'Football match', 'BVSC field', 'Sport', 'Soccer', 5, '09:00') returning id into e_foot;

  insert into public.event_children (event_id, child_id) values
    (e_judo, bence), (e_swim, luca), (e_piano, bence), (e_art, luca), (e_maths, bence), (e_foot, bence);

  -- Rides around today, so the demo always looks current
  insert into public.rides (event_id, ride_date, driver_id, seats, pickup, pickup_time, status)
    values (e_swim, public.next_weekday(1), anna, 2, 'School gate', '16:00', 'confirmed') returning id into r;
  insert into public.ride_passengers values (r, luca);

  insert into public.rides (event_id, ride_date, driver_id, seats, pickup, pickup_time, status)
    values (e_art, public.next_weekday(3), eszter, 1, 'Kelenföld Primary, main gate', '15:00', 'confirmed') returning id into r;
  insert into public.ride_passengers values (r, luca);

  insert into public.rides (event_id, ride_date, driver_id, seats, pickup, pickup_time, status)
    values (e_foot, public.next_weekday(5), kata, 2, 'My home', '08:30', 'offered');

  insert into public.rides (event_id, ride_date, driver_id, seats, pickup, pickup_time, status)
    values (e_foot, public.next_weekday(5) + 7, peter, 3, 'My home', '08:30', 'confirmed') returning id into r;
  insert into public.ride_passengers values (r, bence);
end;
$$;

-- Only the database itself (pg_cron) and admins may run these.
revoke execute on function public.ensure_demo_user(text, text, text) from public, anon, authenticated;
revoke execute on function public.reset_demo() from public, anon, authenticated;

select public.reset_demo();

-- Rebuild the demo family every night at 02:00 UTC.
select cron.schedule('reset-demo-family', '0 2 * * *', 'select public.reset_demo()');
