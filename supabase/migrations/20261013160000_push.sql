-- Push notifications: each parent's browsers/phones, and a trigger that sends every new
-- in-app notification as a push message through the app's /api/push route.

create extension if not exists pg_net;

-- Server-side settings (not reachable through the API). Values are set outside the repository:
--   push_url    = 'https://sharepa.tiborhornyak.hu/api/push'
--   push_secret = shared secret, also set as PUSH_WEBHOOK_SECRET in Vercel
create table if not exists private.settings (
  key text primary key,
  value text not null
);
revoke all on private.settings from public, anon, authenticated;

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  revoked_at timestamptz            -- switched off / gone; kept instead of deleted
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
create policy "push_subscriptions: read own" on public.push_subscriptions
  for select to authenticated using (user_id = (select auth.uid()));
-- Writes go through the functions below.

-- Hand a message to /api/push (asynchronously, via pg_net) for all of a parent's active browsers.
create function private.push(p_user uuid, p_title text, p_body text, p_url text, p_tag text default null)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  subs jsonb;
  url text := (select value from private.settings where key = 'push_url');
  secret text := (select value from private.settings where key = 'push_secret');
begin
  if url is null or secret is null then return; end if;
  select jsonb_agg(jsonb_build_object('endpoint', endpoint, 'p256dh', p256dh, 'auth', auth))
    into subs from public.push_subscriptions where user_id = p_user and revoked_at is null;
  if subs is null then return; end if;
  perform net.http_post(
    url := url,
    body := jsonb_build_object('title', p_title, 'body', p_body, 'url', p_url, 'tag', p_tag, 'subscriptions', subs),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', secret),
    timeout_milliseconds := 5000
  );
end;
$$;

-- Every new (or repeated) in-app notification also goes out as a push message.
create function private.on_notification_push()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  perform private.push(
    new.recipient_id,
    new.title,
    new.body,
    case when new.kind = 'offer' and new.event_id is not null and new.ride_date is not null
         then '/app?view=list&offers=' || new.event_id || '_' || new.ride_date
         else '/app' end,
    new.kind || ':' || coalesce(new.event_id::text, '') || ':' || coalesce(new.ride_date::text, '')
  );
  return new;
end;
$$;

create trigger notification_push
  after insert or update of created_at on public.notifications
  for each row execute function private.on_notification_push();

-- "Send a test notification" on the Profile page.
create function public.send_test_push()
returns int language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  n int;
begin
  select count(*) into n from public.push_subscriptions where user_id = me and revoked_at is null;
  if n > 0 then
    perform private.push(me, 'SharePa notifications are on', 'You’ll hear about ride requests, offers and confirmations here.', '/app/profile', 'test');
  end if;
  return n;
end;
$$;

-- Save this browser for the signed-in parent. A browser belongs to one parent at a time,
-- and the shared demo account keeps only the newest browser, so visitors don't get each other's pushes.
create function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text, p_user_agent text default null)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then raise exception 'Please log in again.'; end if;
  if p_endpoint !~ '^https://' or length(p_endpoint) > 1000 or coalesce(p_p256dh, '') = '' or coalesce(p_auth, '') = '' then
    raise exception 'This browser sent an invalid push subscription.';
  end if;
  if exists (select 1 from public.profiles where id = me and is_demo) then
    update public.push_subscriptions set revoked_at = now() where user_id = me and endpoint <> p_endpoint and revoked_at is null;
  end if;
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
  values (me, p_endpoint, p_p256dh, p_auth, left(p_user_agent, 300))
  on conflict (endpoint) do update
    set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth,
        user_agent = excluded.user_agent, created_at = now(), revoked_at = null;
end;
$$;

create function public.remove_push_subscription(p_endpoint text)
returns void language sql security definer set search_path = ''
as $$
  update public.push_subscriptions set revoked_at = now() where endpoint = p_endpoint and user_id = (select auth.uid());
$$;

-- /api/push reports browsers that unsubscribed (HTTP 404/410) so they are switched off.
create function public.push_gone(p_secret text, p_endpoints text[])
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if p_secret is distinct from (select value from private.settings where key = 'push_secret') then
    raise exception 'not allowed';
  end if;
  update public.push_subscriptions set revoked_at = now() where endpoint = any (p_endpoints);
end;
$$;

revoke execute on function private.push(uuid, text, text, text, text), private.on_notification_push() from public, anon, authenticated;
revoke execute on function public.save_push_subscription(text, text, text, text), public.remove_push_subscription(text), public.send_test_push() from public, anon;
grant execute on function public.save_push_subscription(text, text, text, text), public.remove_push_subscription(text), public.send_test_push() to authenticated;
revoke execute on function public.push_gone(text, text[]) from public, authenticated;
grant execute on function public.push_gone(text, text[]) to anon;
