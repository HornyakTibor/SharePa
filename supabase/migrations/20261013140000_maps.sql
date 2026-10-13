-- Maps: coordinates for home addresses, event places and ride pick-up points.
-- (Pick-up points in profiles.pickup_points carry their own lat/lng in the JSON.)

alter table public.profiles
  add column home_lat double precision,
  add column home_lng double precision;

alter table public.events
  add column place_lat double precision,
  add column place_lng double precision;

alter table public.rides
  add column pickup_lat double precision,
  add column pickup_lng double precision;

-- Demo coordinates. reset_demo() rebuilds the demo family without them, so the nightly
-- tidy-up (02:05 UTC, right after the rebuild) puts them back.
create or replace function private.reset_demo_extras()
returns void language sql security definer set search_path = ''
as $$
  update public.profiles
     set pickup_points = '[]'::jsonb, default_pickup = 'home', onboarded_at = coalesce(onboarded_at, now())
   where is_demo;

  update public.profiles set home_lat = 47.4745, home_lng = 19.0475 where demo_key = 'kata';
  update public.profiles set home_lat = 47.4712, home_lng = 19.0398 where demo_key = 'peter';

  update public.events e set place_lat = v.lat, place_lng = v.lng
  from (values
    ('Dentist (me)', 47.4760, 19.0430),
    ('Judo', 47.4935, 19.0215),
    ('Swimming practice', 47.5256, 19.0378),
    ('Piano lesson', 47.4802, 19.0350),
    ('Art school', 47.4660, 19.0280),
    ('Maths tutor', 47.4630, 19.0210),
    ('Football match', 47.5263, 19.1003)
  ) as v(title, lat, lng)
  join public.profiles p on p.demo_key = 'kata'
  where e.owner_id = p.id and e.title = v.title and e.place_lat is null;

  update public.rides r set pickup_lat = v.lat, pickup_lng = v.lng
  from (values
    ('School gate', 47.4655, 19.0300),
    ('Kelenföld Primary, main gate', 47.4655, 19.0300)
  ) as v(pickup, lat, lng)
  where r.pickup = v.pickup and r.pickup_lat is null;

  update public.rides r set pickup_lat = p.home_lat, pickup_lng = p.home_lng
  from public.profiles p
  where r.driver_id = p.id and p.is_demo and r.pickup = 'My home' and r.pickup_lat is null;
$$;
revoke execute on function private.reset_demo_extras() from public, anon, authenticated;
select private.reset_demo_extras();

-- Fill in pick-up coordinates the app didn't send: "My home" uses the driver's home,
-- and the demo family's usual pick-up spots have fixed points.
create function private.fill_pickup_coords()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  d record;
begin
  if new.pickup_lat is not null or new.pickup is null then
    return new;
  end if;
  select address, home_lat, home_lng, is_demo into d from public.profiles where id = new.driver_id;
  if d.home_lat is not null and (new.pickup in ('My home', 'At my home') or new.pickup = d.address) then
    new.pickup_lat := d.home_lat;
    new.pickup_lng := d.home_lng;
  elsif d.is_demo and new.pickup in ('School gate', 'Kelenföld Primary, main gate') then
    new.pickup_lat := 47.4655; new.pickup_lng := 19.0300;
  elsif d.is_demo and new.pickup = 'Bikás park, bus stop' then
    new.pickup_lat := 47.4625; new.pickup_lng := 19.0335;
  end if;
  return new;
end;
$$;
revoke execute on function private.fill_pickup_coords() from public, anon, authenticated;

create trigger rides_fill_pickup_coords
  before insert or update of pickup, pickup_lat on public.rides
  for each row execute function private.fill_pickup_coords();

update public.rides set pickup_lat = null where pickup_lat is null; -- fills existing rows through the trigger
