-- "Start fresh" button for demo visitors: rebuilds the demo family on request
-- (at most once a minute, so visitors can't hammer it).
create function public.reset_my_demo()
returns text language plpgsql security definer set search_path = ''
as $$
declare
  last timestamptz := (select value::timestamptz from private.settings where key = 'demo_reset_at');
begin
  if not exists (select 1 from public.profiles where id = (select auth.uid()) and is_demo) then
    raise exception 'Only the demo account can be reset.';
  end if;
  if last is not null and last > now() - interval '1 minute' then
    return 'recent';
  end if;
  insert into private.settings (key, value) values ('demo_reset_at', now()::text)
    on conflict (key) do update set value = excluded.value;
  perform public.reset_demo();
  perform private.reset_demo_extras();
  update public.notifications set read_at = now()
   where recipient_id = (select auth.uid()) and read_at is null;
  return 'done';
end;
$$;
revoke execute on function public.reset_my_demo() from public, anon;
grant execute on function public.reset_my_demo() to authenticated;
