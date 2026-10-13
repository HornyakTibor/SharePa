# SharePa – instructions for Claude

SharePa is a car-pool web app for parents: share school runs and kids' activity rides with friends you trust.
This build is a **portfolio demo** for job interviews and business partners, owned by Tibor Hornyák (product designer, not a developer — explain changes in plain language).

## Specs to follow
- `docs/sharepa-prototype.html` — the full clickable prototype. It is the visual and behavioural spec: match its screens, copy, flow and modern light UI.
- `docs/sharepa-notes.md` — product notes, flow, design tokens and rules.

## Stack and hosting
- Next.js 15 (App Router, `src/`), TypeScript, Tailwind CSS v4 (tokens in `src/app/globals.css` `@theme`).
- Supabase (project `ykcdrrxmorirgwrjqool`, region eu-west-1): Postgres, Auth, Realtime. Use `@supabase/ssr` clients in `src/lib/supabase/`.
- Hosted on Vercel Hobby (free) at https://sharepa.tiborhornyak.hu. Supabase free plan.
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Never commit keys; never use the secret/service_role key in client code.

## Demo requirements
- One-click "Try the demo" login as a sample parent with a pre-filled week, children, friends and rides; demo data resets nightly.
- A daily keep-alive ping so the free Supabase project never pauses.
- Skip for now: Apple sign-in, Google/Outlook calendar API (use .ics import + seed data), paid services.

## Design rules (summary)
- Montserrat (base 16, scale 1.25), Roboto Mono for times. Primary #5833A7, headings #1A3453, canvas #f3f3f5.
- Brand gradient: linear 95°, #150830 → #341C67 → #5833A7.
- White borderless cards radius 24–28 with soft shadows; pill buttons, chips and segmented controls; filled inputs with focus ring. Light mode only.
- No menu: logo → Home, Profile in the header.

## Data model (to build)
users (parents), children, events (category + activity), places / pick-up points, friendships + friend labels, invites, rides (driver, free seats, status), ride passengers, notifications. Row-level security on every table: parents see only their own data and events friends share with them. Children never get accounts.

## Site structure
- `/` marketing website (built from the SharePa one-pager design; components in `src/components/site/`). Log in → `/login`, Try it for free → `/signup`.
- `/privacy`, `/terms`, `/imprint` — draft legal pages (operator: Thalassa Consulting Kft.), pending Legal Lead review; placeholders in [BRACKETS].
- Auth (Supabase email + password): `/login`, `/signup`, `/forgot-password`, `/reset-password`; email links land on `/auth/callback`. Server actions in `src/app/auth/actions.ts`; forms in `src/components/auth/`.
- `src/middleware.ts` refreshes the session, sends logged-out visitors from `/app/*` to `/login?next=…`, and logged-in ones from `/login`/`/signup` to `/app`.
- The app lives under `/app` (logged in only). Google / Microsoft sign-in to add later.

## Database (Supabase)
- Migrations in `supabase/migrations/` (applied to the live project). Tables: profiles (auto-created on sign-up), children, friendships (one row per direction, owner's labels), events (weekly: weekday 0=Mon + start_time), event_children, rides (per event date + driver), ride_passengers. RLS on all; helpers `private.is_friend`, `private.can_see_event`, `private.can_see_ride` (private schema, not callable via the API).
- `ride_choices` (event_id + ride_date + parent_id): mode join | drive | none, child_ids, notified_ids, note. Owner manages; notified friends can read. "drive" also creates/updates the parent's row in `rides`; other choices cancel it. Saved by `saveRideChoice` in `src/app/app/actions.ts` (server-side checks: own event, not past, own kids, own friends).
- Home data is loaded in `src/lib/data/home.ts` with the parent's own session (RLS decides visibility). Dates are Budapest-time ISO strings (`src/lib/dates.ts`).

## Demo mode
- Demo family: Kata Molnár (`demo@sharepa.tiborhornyak.hu`) + 7 friends (`*@demo.sharepa.tiborhornyak.hu`), `profiles.is_demo = true`. `public.reset_demo()` rebuilds it; pg_cron job `reset-demo-family` runs 02:00 UTC. One-time setup script: `supabase/run-once-demo-family.sql`.
- "Try the demo" (`tryDemo` server action) signs in with `DEMO_EMAIL` / `DEMO_PASSWORD` (Vercel env, server-only). Demo accounts can't change their password.
- `/api/keep-alive` is hit daily by Vercel Cron (`vercel.json`) so the free Supabase project never pauses.

## Rides UI
- Each upcoming event occurrence shows a status chip + Manage ride menu (`src/components/app/RideControl.tsx`, `OccurrenceRide.tsx`): join (pick kids → notify friends + note), drive (seats, pick-up, time → notify + note), no ride needed. Friends whose labels match the event are pre-ticked. Notes are stored; real notifications come later.

## Way of working
- One feature per branch / pull request. Plan first, then build. Keep this file updated with decisions.
- `npm run build` and `npm run lint` must pass before opening a pull request.
- Build order: design-system components → database → login → onboarding (7 skippable steps) → calendar (.ics) → friends & invites → rides → maps → PWA & push → demo mode polish.
