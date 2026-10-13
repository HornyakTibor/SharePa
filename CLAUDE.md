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
- `notifications` (recipient, actor, kind request|seats|offer|confirmed|declined, event/date/ride, title, body, read_at): written only by DB triggers/functions; parents can read their own and set read_at. Triggers: `ride_choice_saved` (notifies ticked friends; demo friends auto-offer for the demo parent) and `ride_offered` (notifies the event owner of an offer). `public.accept_ride_offer(ride)` confirms one offer, adds the kids, declines the rest and notifies drivers. One ride per driver per occurrence (unique index).
- Home data is loaded in `src/lib/data/home.ts` with the parent's own session (RLS decides visibility). Dates are Budapest-time ISO strings (`src/lib/dates.ts`).

## Demo mode
- Demo family: Kata Molnár (`demo@sharepa.tiborhornyak.hu`) + 7 friends (`*@demo.sharepa.tiborhornyak.hu`), `profiles.is_demo = true`. `public.reset_demo()` rebuilds it; pg_cron job `reset-demo-family` runs 02:00 UTC. One-time setup script: `supabase/run-once-demo-family.sql`.
- "Try the demo" (`tryDemo` server action) signs in with `DEMO_EMAIL` / `DEMO_PASSWORD` (Vercel env, server-only). Demo accounts can't change their password.
- `/api/keep-alive` is hit daily by Vercel Cron (`vercel.json`) so the free Supabase project never pauses.

## Rides UI
- Each upcoming event occurrence shows a status chip + Manage ride menu (`src/components/app/RideControl.tsx`, `OccurrenceRide.tsx`): join (pick kids → notify friends + note), drive (seats, pick-up, time → notify + note), no ride needed. Friends whose labels match the event are pre-ticked. Open offers show as "N driving offers" + See offers dialog with Approve (`OffersButton.tsx`). Header bell (`NotificationBell.tsx`) lists notifications; offers link to `/app?view=list&offers=<event>_<date>` (auto-opens the dialog); requests have "I can drive" (`offerFromRequest`). In-app only — no push/email yet.

## Onboarding (set-up)
- `/app/setup?step=1…7` (`src/app/app/setup/`, components in `src/components/setup/`): import calendar (.ics file, sample calendar, or add manually), choose SharePa events, categorize (dialog with name-based suggestions + who goes), profile (+36 phone formatting, pick-up points), children, friends (search + invite link/QR), labels. Every step is skippable; done-checks in `src/lib/data/setup.ts`.
- New (non-demo) parents are sent to set-up until they finish or skip it (`profiles.onboarded_at`). Home shows a "Get set up" card for skipped steps, or a "Set-up guide" link when all is done.
- Schema: `profiles.onboarded_at / pickup_points (jsonb) / default_pickup / invite_code`, `children.phone`, `events.kind / source / hidden` (imported events start hidden; friends never see hidden events). `public.search_parents(q)` (name or exact email; demo only finds demo), `public.add_friend(id)` (both directions + 'friend' notification). Sign-up with `/signup?invite=<code>` makes inviter and new parent friends (in `handle_new_user`; not for demo inviters).
- Demo: extra demo parents Dávid Balogh, Nóra Farkas, Tamás Papp to find and add; `private.reset_demo_extras()` (pg_cron 02:05 UTC) tidies pick-up points.
- .ics parsing is client-side (`src/lib/ics.ts`): weekly repeating events + one-offs in the next 14 days, converted to Budapest time. Direct Google/Microsoft calendar connection is for later.
- apply_migration tip: `cron.schedule` and big mixed scripts may be cancelled — apply them as small separate migrations.

## Profile
- `/app/profile` (header avatar + "Profile" link; Log out moves there on phones): details, kids, friends + labels, calendar (SharePa events + hidden count), "Your places" map (home, pick-up points, activity places), account (set-up progress, change password via `/reset-password`, log out).
- Edit buttons open the matching set-up step with `&from=profile`; there the footer shows "Save and back to Profile" / "Back to Profile" and forms send `next=/app/profile`.

## Maps
- Leaflet (`leaflet` npm, loaded in the browser only) with CARTO Voyager tiles (OpenStreetMap data, attribution shown). Address search and "what's here" via Photon (photon.komoot.io, free, no key), biased to Budapest — `src/lib/geo.ts`.
- `src/components/map/`: `LeafletMap` (pins + dashed route line), `MapPicker` / `AddressField` (input + "Select from map" dialog; typing clears the pin), `RoutePreview` (pick-up(s) → event place, distance, "Directions ↗" to Google Maps).
- Used in: set-up profile (home address, pick-up points), manual events (place), ride dialog "Somewhere else" pick-up + route preview, Driving offers dialog (numbered pick-up pins).
- Columns: `profiles.home_lat/home_lng`, `events.place_lat/place_lng`, `rides.pickup_lat/pickup_lng`; pick-up points keep lat/lng in their JSON. Trigger `rides_fill_pickup_coords` fills "My home" (driver's home) and the demo family's usual spots. Demo coordinates are re-applied nightly by `private.reset_demo_extras()`.

## Way of working
- One feature per branch / pull request. Plan first, then build. Keep this file updated with decisions.
- `npm run build` and `npm run lint` must pass before opening a pull request.
- Build order: design-system components → database → login → onboarding (7 skippable steps) → calendar (.ics) → friends & invites → rides → maps (done) → PWA & push → demo mode polish.
