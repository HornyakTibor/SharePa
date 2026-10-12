# SharePa – product and design notes

SharePa is a car-pool app for parents: share school runs and kids' activity rides (sport, music, art, dance, private teacher, languages) with friends you trust.

## Goal of this build
A working demo app for job interviews and business partners. Hosted on Vercel (free Hobby plan) at sharepa.tiborhornyak.hu, data in Supabase (free plan, EU region). Must include a one-click "Try the demo" login with a pre-filled sample family that resets nightly, and a daily keep-alive ping so the free Supabase project never pauses.

## Stack
Next.js (App Router) + TypeScript + Tailwind, Supabase (Postgres, Auth, Realtime) via @supabase/ssr, Vercel. Later: Resend email, PWA web push, .ics calendar import, Mapbox.

## Flow
- Login / Register (email + password, Google, Microsoft; Apple later) → Onboarding (7 steps, each skippable) → Home dashboard.
- Onboarding order:
  1. Import calendar (provider buttons; "Or add events yourself": Event, Place / Day (next 14 days), Time)
  2. Set up SharePa events (weekly calendar of personal / family / kids events; click to select, only selected events are kept; CTA "Apply for SharePa")
  3. Categorize events (click an event → modal: category, then activity, e.g. Sport · Soccer; suggestions from event name)
  4. Complete profile (name, email, phone, home address, emergency contact name + phone, default pick-up point with "+ Add new pick-up point")
  5. Add children (Edit / Remove per child)
  6. Add / Search / Invite friends (link or QR)
  7. Label friends (per friend "+ Add event label")
- Skipped steps stay in the Home "Get set up" panel (same order); its buttons reopen onboarding at that step.
- Ride wizard: which event → who needs to get there → which parents are at this event → what kind of ride → who drives. Plus Driving offers, ride notifications, Calendar (Day / Week / Month), Profile, Friend list.

## Design system
- Colours: primary #5833A7 (scale #E3DEF7 → #150830), pink #B77692, yellow #DCCE40, tertiary purple scale, headings #1A3453, neutrals #FAFAF8 → #0A0F1C.
- Brand gradient: linear, 95°, #150830 → #341C67 → #5833A7.
- Type: Montserrat, base 16, scale 1.25; Roboto Mono for times.
- Modern light UI: soft grey canvas #f3f3f5, borderless white cards (radius 24–28) with airy shadows, glassy sticky header, pill buttons, pill segmented Day/Week/Month, pill stepper and chips, filled borderless inputs with focus ring, list rows as soft grey tiles, event cards with coloured left bar, modals radius 28 with blurred scrim. Light only, no dark mode.
- Activity colours: Sport = primary, Music = pink, Art = yellow, Dance = tertiary, Private teacher = navy, Languages = light pink.
- Sign-in buttons use real Google, Apple, Microsoft logos on neutral white buttons.

## Behaviour rules
- No menu: logo → Home, Profile in header.
- Phone numbers auto-format (+36 20 565 6589; 06… → +36).
- Address fields have a map button opening a map; drop a pin to get a street address.
- Event and Place are searchable combo boxes (pick or add new).
- Calendar: past events greyed with "Past" tag; upcoming events have a "Manage ride" menu (join a ride / driving with a free seat / don't need a ride).

## Privacy
Children's data: EU storage only, parents can export and delete everything, children never get their own accounts.

The full clickable prototype is sharepa-prototype.html in this folder; treat it as the visual and behavioural spec.
