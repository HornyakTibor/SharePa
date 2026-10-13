-- Keep the access-rule helpers out of the public API: policies still use them, nobody can call them directly.
create schema if not exists private;
grant usage on schema private to authenticated;
alter function public.is_friend(uuid) set schema private;
alter function public.can_see_event(uuid) set schema private;
alter function public.can_see_ride(uuid) set schema private;

create or replace function private.can_see_event(ev uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.events e where e.id = ev and (e.owner_id = (select auth.uid()) or private.is_friend(e.owner_id)));
$$;

create or replace function private.can_see_ride(r uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.rides x where x.id = r and (x.driver_id = (select auth.uid()) or private.is_friend(x.driver_id) or private.can_see_event(x.event_id)));
$$;

revoke execute on function private.is_friend(uuid), private.can_see_event(uuid), private.can_see_ride(uuid) from public, anon;
grant execute on function private.is_friend(uuid), private.can_see_event(uuid), private.can_see_ride(uuid) to authenticated;
