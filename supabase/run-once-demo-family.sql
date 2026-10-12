-- SharePa demo family: run this ONCE in Supabase → SQL Editor.
-- It creates the reset function, fills in the demo family now, and schedules a nightly reset (02:00 UTC).
-- It only ever removes data that belongs to the demo accounts (is_demo = true).

create or replace function public.reset_demo()
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
revoke execute on function public.reset_demo() from public, anon, authenticated;

select public.reset_demo();

-- Rebuild the demo family every night at 02:00 UTC.
select cron.schedule('reset-demo-family', '0 2 * * *', 'select public.reset_demo()');
