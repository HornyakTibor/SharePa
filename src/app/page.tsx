import type { Metadata } from "next";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { HeroCarousel } from "@/components/site/HeroCarousel";
import { CtaBand } from "@/components/site/CtaBand";
import { DemoButton } from "@/components/auth/DemoButton";
import { Arrow, Check, Download, Globe, People, Shield } from "@/components/site/icons";

import illOneApp from "../../public/images/site/ill-one-app.png";
import illCalendar from "../../public/images/site/ill-calendar.png";
import illPickup from "../../public/images/site/ill-pickup.png";
import illWeek from "../../public/images/site/ill-week.png";
import illTrust from "../../public/images/site/ill-trust.png";
import illReminders from "../../public/images/site/ill-reminders.png";
import illCtaAfternoon from "../../public/images/site/ill-cta-afternoon.png";
import illCtaJoin from "../../public/images/site/ill-cta-join.png";
import illKids from "../../public/images/site/ill-kids.png";
import patrik from "../../public/images/team/patrik-talasi.jpg";
import arpad from "../../public/images/team/arpad-talasi.jpg";
import ivett from "../../public/images/team/ivett-foldi.jpg";
import gabriella from "../../public/images/team/gabriella-hornyak-zay.jpg";
import tibor from "../../public/images/team/tibor-hornyak.jpg";

export const metadata: Metadata = {
  title: "SharePa – share the ride to every activity",
  description:
    "SharePa connects parents whose kids go to the same trainings, lessons and clubs, so one car can take everyone — and you only drive when it's your turn.",
};

const ADVANTAGES: { img: StaticImageData; motion: string; title: string; text: string; big?: boolean }[] = [
  { img: illOneApp, motion: "float", big: true, title: "One app instead of fifty messages", text: "No more Facebook threads, group chats and email chains to sort out who drives on Tuesday. Every ride, seat and pick-up lives in one place — everyone sees the same plan, instantly." },
  { img: illCalendar, motion: "breathe", title: "Your calendar, imported in a minute", text: "Connect Google, Apple or Microsoft — or add events yourself. Pick the trainings and lessons SharePa should coordinate; everything else stays private." },
  { img: illPickup, motion: "drift", title: "Pick-up points that make sense", text: "Save your home and favourite pick-up spots, or simply drop a pin on the map. Drivers always know exactly where to stop." },
  { img: illWeek, motion: "tick", title: "The whole week at a glance", text: "Day, week and month views with every activity colour-coded — sport, music, art, dance, languages — so nobody is late and no child is forgotten." },
  { img: illTrust, motion: "sway", title: "Only people you trust", text: "Invite the parents you know and label them by activity. Rides are only shared within your own circle — never with strangers." },
  { img: illReminders, motion: "ring", title: "Reminders that matter", text: "Get notified when a seat opens up, a ride changes or an event still needs a driver — and nothing else." },
];

const TRUST = [
  { icon: <Globe />, bg: "#E3DEF7", title: "Data stays in the EU", text: "Everything is stored on EU servers and handled under GDPR." },
  { icon: <People />, bg: "#F3E4EB", title: "Invite-only circles", text: "Only parents you invite can see your rides, your children or your pick-up points." },
  { icon: <Download />, bg: "#F7F3C7", title: "Your data, your call", text: "Export or delete your account and your children's data at any time." },
  { icon: <Shield />, bg: "#E3DEF7", title: "Secure sign-in", text: "Log in with Google, Apple or Microsoft — no new password to remember." },
];

const TEAM = [
  { img: patrik, name: "Patrik Talasi", role: "CEO & Founder", text: "Industrial engineer and entrepreneur — responsible for product vision, the business model and the bridge between customer needs and engineering." },
  { img: arpad, name: "Arpad Talasi", role: "Commercial Advisor", text: "Master of Science in Engineering. Around 30 years of C-level leadership experience in multinational companies." },
  { img: ivett, name: "Dr. Ivett Földi", role: "Legal Lead", text: "Fully qualified lawyer (Volljuristin, both German state examinations) and qualified psychologist (Diplom). LL.M. from the University of Tübingen, plus tax-advisory expertise." },
  { img: gabriella, name: "Gabriella Hornyák-Zay", role: "Marketing Lead", text: "Around 20 years in enterprise IT, paired with the clear positioning of digital products." },
  { img: tibor, name: "Tibor Hornyák", role: "Product Design Director", text: "More than 20 years of UX and UI experience from large international, mostly US enterprise projects." },
];

const eyebrow = "text-[13px] font-bold uppercase tracking-[1.6px] text-p500";
const h2 = "m-0 text-[32px] min-[880px]:text-[49px] leading-[1.12] font-extrabold tracking-[-1px]";
const lead = "m-0 text-lg leading-relaxed text-body";

function SectionIntro({ kicker, title, text, maxW = "max-w-[640px]" }: { kicker: string; title: string; text: string; maxW?: string }) {
  return (
    <div className="mb-14 flex flex-col items-center gap-4 text-center">
      <span className={eyebrow}>{kicker}</span>
      <h2 className={`${h2} max-w-[760px]`}>{title}</h2>
      <p className={`${lead} ${maxW}`}>{text}</p>
    </div>
  );
}

function PlanItem({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <li className="flex gap-2.5">
      <Check className="h-5 w-5 shrink-0" color={light ? "#DCCE40" : "#5833A7"} />
      {children}
    </li>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-canvas text-navy">
      <SiteHeader />

      <main>
        {/* HERO */}
        <section id="top" className="bg-[linear-gradient(180deg,#E3DEF7_0%,#ECE9F6_45%,#f3f3f5_100%)] px-6">
          <div className="mx-auto grid max-w-[1200px] items-center gap-14 pt-6 pb-[88px] min-[880px]:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] min-[880px]:pt-16">
            <div className="flex flex-col gap-7">
              <span className="inline-flex items-center gap-2 self-start rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-p500 shadow-[0_2px_10px_rgba(26,52,83,.06)]">
                <span className="h-2 w-2 rounded-full bg-yellow" />
                Car pooling for kids&apos; activities
              </span>
              <h1 className="m-0 text-[40px] leading-[1.06] font-extrabold tracking-[-1.6px] min-[880px]:text-[61px]">
                Share the ride.
                <br />
                <span className="text-p500">Get your afternoons back.</span>
              </h1>
              <p className="m-0 max-w-[520px] text-xl leading-relaxed text-body">
                SharePa connects parents whose kids go to the same trainings, lessons and clubs, so one car can take
                everyone to soccer, music or art — and you only drive when it&apos;s your turn.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/signup"
                  className="btn-lift inline-flex min-h-14 items-center gap-2.5 rounded-full bg-p500 px-[30px] text-[17px] font-bold text-white no-underline shadow-[0_12px_28px_rgba(88,51,167,.32)] hover:bg-p600"
                >
                  Try it for free <Arrow />
                </Link>
                <DemoButton className="btn-lift inline-flex min-h-14 cursor-pointer items-center rounded-full border-0 bg-white px-[26px] text-[17px] font-semibold text-navy hover:bg-p100 hover:text-p600">
                  Try the demo
                </DemoButton>
              </div>
              <ul className="m-0 flex list-none flex-wrap gap-5 p-0 text-sm font-medium text-body">
                {["Free for the first 100 users", "No credit card needed", "Data stored in the EU"].map((t) => (
                  <li key={t} className="inline-flex items-center gap-2"><Check />{t}</li>
                ))}
              </ul>
            </div>
            <HeroCarousel />
          </div>
        </section>

        {/* ADVANTAGES */}
        <section id="advantages" className="mx-auto max-w-[1200px] px-6 pt-[72px] pb-24">
          <SectionIntro
            kicker="Advantages"
            title="Less driving, more living — for the whole family"
            text="From the calendar you already use to the friends you already trust, SharePa turns every weekly activity into a shared ride."
          />
          <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
            {ADVANTAGES.map((a) => (
              <article key={a.title} className="flex flex-col gap-5 rounded-[28px] bg-white px-4 pt-4 pb-7 shadow-[0_10px_30px_rgba(26,52,83,.06)]">
                <div className="flex h-[200px] items-center justify-center overflow-hidden rounded-[20px] bg-lilac">
                  <Image
                    src={a.img}
                    alt=""
                    data-motion={a.motion}
                    className={`ill ${a.motion === "ring" ? "ill-ring" : ""} w-auto ${a.big ? "h-[200px]" : "h-[180px]"}`}
                  />
                </div>
                <div className="flex flex-col gap-2.5 px-3">
                  <h3 className="m-0 text-[22px] font-bold">{a.title}</h3>
                  <p className="m-0 text-base leading-relaxed text-body">{a.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <CtaBand image={illCtaAfternoon} text="Your next free afternoon is just one shared ride away." />

        {/* PRICING */}
        <section id="pricing" className="bg-white px-6 py-24">
          <div className="mx-auto max-w-[1200px]">
            <SectionIntro kicker="Pricing" title="Simple plans, no surprises" text="Start free, upgrade when SharePa has become part of your week." maxW="max-w-[600px]" />
            <div className="grid items-stretch gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
              <div className="flex flex-col gap-6 rounded-[28px] bg-canvas px-8 py-9">
                <div className="flex flex-col gap-2.5">
                  <span className="self-start rounded-full bg-cream px-3 py-1.5 text-xs font-bold text-olive">First 100 users only</span>
                  <h3 className="m-0 text-[25px] font-bold">Early Bird</h3>
                  <p className="m-0 text-[15px] leading-normal text-body">For founding families who want to try SharePa first.</p>
                </div>
                <div className="flex items-baseline gap-2"><span className="text-[49px] font-extrabold tracking-[-1px]">€0</span><span className="text-base text-body">for 50 rides</span></div>
                <ul className="m-0 flex list-none flex-col gap-3 p-0 text-[15px]">
                  <PlanItem>50 shared rides included</PlanItem>
                  <PlanItem>Calendar import</PlanItem>
                  <PlanItem>Unlimited children and friends</PlanItem>
                </ul>
                <Link href="/signup" className="btn-lift mt-auto flex min-h-[52px] items-center justify-center rounded-full bg-white text-base font-bold text-p500 no-underline shadow-[inset_0_0_0_2px_#5833A7] hover:bg-p100 hover:text-p600">
                  Try it for free
                </Link>
              </div>

              <div className="relative flex flex-col gap-6 rounded-[28px] bg-[linear-gradient(160deg,#341C67_0%,#5833A7_100%)] px-8 py-9 text-white shadow-[0_24px_48px_rgba(88,51,167,.32)]">
                <div className="flex flex-col gap-2.5">
                  <span className="self-start rounded-full bg-yellow px-3 py-1.5 text-xs font-bold text-p700">Most popular</span>
                  <h3 className="m-0 text-[25px] font-bold">Family</h3>
                  <p className="m-0 text-[15px] leading-normal text-p100">For families who share rides every week.</p>
                </div>
                <div className="flex items-baseline gap-2"><span className="text-[49px] font-extrabold tracking-[-1px]">€3</span><span className="text-base text-p100">per month</span></div>
                <ul className="m-0 flex list-none flex-col gap-3 p-0 text-[15px]">
                  <PlanItem light>First 20 rides free</PlanItem>
                  <PlanItem light>Calendar import and ride matching</PlanItem>
                  <PlanItem light>Saved pick-up points and reminders</PlanItem>
                  <PlanItem light>Cancel anytime</PlanItem>
                </ul>
                <Link href="/signup" className="btn-lift mt-auto flex min-h-[52px] items-center justify-center rounded-full bg-white text-base font-bold text-p600 no-underline hover:bg-p100 hover:text-p700">
                  Try it for free
                </Link>
              </div>

              <div className="flex flex-col gap-6 rounded-[28px] bg-canvas px-8 py-9">
                <div className="flex flex-col gap-2.5">
                  <span className="self-start rounded-full bg-p100 px-3 py-1.5 text-xs font-bold text-p600">Schools · Clubs · Teams</span>
                  <h3 className="m-0 text-[25px] font-bold">Organisations</h3>
                  <p className="m-0 text-[15px] leading-normal text-body">For sports clubs, schools and studios that want to help their families travel together.</p>
                </div>
                <div className="flex items-baseline gap-2"><span className="text-[49px] font-extrabold tracking-[-1px]">Custom</span></div>
                <ul className="m-0 flex list-none flex-col gap-3 p-0 text-[15px]">
                  <PlanItem>All Family features for every member</PlanItem>
                  <PlanItem>Shared schedules for your groups</PlanItem>
                  <PlanItem>Personal onboarding</PlanItem>
                </ul>
                <a href="mailto:support@thalassa-consulting.com?subject=SharePa%20for%20organisations" className="btn-lift mt-auto flex min-h-[52px] items-center justify-center rounded-full bg-white text-base font-bold text-navy no-underline shadow-[inset_0_0_0_2px_#1A3453] hover:bg-p100 hover:text-p600">
                  Contact us
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST */}
        <section id="trust" className="mx-auto max-w-[1200px] px-6 py-24">
          <div className="grid items-center gap-12 [grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))]">
            <div className="flex flex-col gap-5">
              <span className={eyebrow}>Trust &amp; safety</span>
              <h2 className={h2}>Built for the people you care about most</h2>
              <p className={lead}>
                We handle children&apos;s schedules, so privacy isn&apos;t a feature — it&apos;s the foundation. SharePa is designed
                with GDPR in mind from day one.
              </p>
              <div className="mt-2 flex h-60 items-center justify-center">
                <Image src={illKids} alt="Illustration of children doing music, soccer and basketball" className="h-[220px] w-auto max-w-full object-contain" />
              </div>
            </div>
            <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))]">
              {TRUST.map((t) => (
                <div key={t.title} className="flex flex-col gap-3.5 rounded-3xl bg-white p-7 shadow-[0_10px_30px_rgba(26,52,83,.06)]">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: t.bg }}>{t.icon}</span>
                  <h3 className="m-0 text-[19px] font-bold">{t.title}</h3>
                  <p className="m-0 text-[15px] leading-relaxed text-body">{t.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TEAM */}
        <section id="team" className="bg-white px-6 py-24">
          <div className="mx-auto max-w-[1200px]">
            <SectionIntro kicker="The team" title="The people behind SharePa" text="Parents, engineers, designers and legal experts who know the afternoon rush first-hand." maxW="max-w-[620px]" />
            <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr))]">
              {TEAM.map((p) => (
                <article key={p.name} className="flex flex-col gap-4 rounded-3xl bg-canvas px-3 pt-3 pb-6">
                  <Image src={p.img} alt={`Portrait of ${p.name}`} placeholder="blur" className="block aspect-square w-full rounded-[18px] object-cover" />
                  <div className="flex flex-col gap-2 px-2">
                    <h3 className="m-0 text-lg font-bold">{p.name}</h3>
                    <span className="text-[13px] font-bold text-p500">{p.role}</span>
                    <p className="m-0 text-sm leading-relaxed text-body">{p.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <CtaBand padTop image={illCtaJoin} text="Join the first 100 families and share your first 50 rides for free." />
      </main>

      <SiteFooter />
    </div>
  );
}
