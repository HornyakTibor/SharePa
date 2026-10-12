"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useState } from "react";
import { Check, Gift, Music, Soccer } from "./icons";
import soccer from "../../../public/images/site/hero-soccer.jpg";
import music from "../../../public/images/site/hero-music.jpg";
import party from "../../../public/images/site/hero-party.jpg";

type Slide = {
  src: StaticImageData;
  pos: string;
  alt: string;
  event: string;
  time: string;
  seats: string;
  summary: string;
  icon: React.ReactNode;
  iconBg: string;
  /** Where the two floating cards sit for this photo. */
  aPos: string;
  bPos: string;
};

const SLIDES: Slide[] = [
  {
    src: soccer, pos: "50% 30%",
    alt: "A mother driving her two sons, in football kits with a ball, to practice",
    event: "Soccer practice", time: "Tue · 16:30", seats: "2 seats", summary: "2 kids · 1 car · 0 stress",
    icon: <Soccer />, iconBg: "#5833A7",
    aPos: "left-3 min-[880px]:-left-7 top-16", bPos: "right-3 min-[880px]:-right-5 bottom-28",
  },
  {
    src: music, pos: "50% 40%",
    alt: "A father driving three children with a guitar, a violin and a clarinet to music lessons",
    event: "Music school", time: "Thu · 17:00", seats: "1 seat", summary: "3 kids · 1 car · 0 stress",
    icon: <Music />, iconBg: "#B77692",
    aPos: "right-3 min-[880px]:-right-7 top-10", bPos: "left-3 min-[880px]:-left-5 bottom-28",
  },
  {
    src: party, pos: "50% 40%",
    alt: "A mother driving two children with presents and balloons to a birthday party",
    event: "Birthday party", time: "Sat · 15:00", seats: "1 seat", summary: "2 kids · 1 car · 0 stress",
    icon: <Gift />, iconBg: "#1A3453",
    aPos: "left-3 min-[880px]:-left-7 bottom-28", bPos: "left-3 min-[880px]:-left-5 top-10",
  },
];

const fade = "transition-[opacity,transform] duration-[1600ms] ease-in-out";

export function HeroCarousel() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 8000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative py-6">
      <div className="absolute inset-y-0 -right-3 left-10 rounded-[40px] bg-lilac-2" />
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="SharePa families on the way"
        className="relative aspect-[4/4.4] w-full overflow-hidden rounded-[32px] bg-lilac-2 shadow-[0_30px_60px_rgba(21,8,48,.22)]"
      >
        {SLIDES.map((s, i) => (
          <Image
            key={s.event}
            src={s.src}
            alt={s.alt}
            aria-hidden={i !== idx}
            priority={i === 0}
            placeholder="blur"
            sizes="(max-width: 880px) 100vw, 560px"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1600ms] ease-in-out ${i === idx ? "opacity-100" : "opacity-0"}`}
            style={{ objectPosition: s.pos }}
          />
        ))}
      </div>

      {SLIDES.map((s, i) => {
        const on = i === idx;
        const state = on ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2.5";
        return (
          <div key={s.event} aria-hidden={!on}>
            <div className={`pointer-events-none absolute flex min-w-[220px] items-center gap-3 rounded-[20px] bg-white px-4 py-3.5 shadow-[0_16px_36px_rgba(21,8,48,.16)] ${s.aPos} ${fade} ${state}`}>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px]" style={{ background: s.iconBg }}>
                {s.icon}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-bold text-navy">{s.event}</span>
                <span className="font-mono text-xs text-body">{s.time}</span>
              </span>
              <span className="ml-auto rounded-full bg-cream px-2.5 py-1 text-xs font-bold text-olive">{s.seats}</span>
            </div>
            <div className={`pointer-events-none absolute flex items-center gap-3 rounded-[20px] bg-white px-[18px] py-3.5 shadow-[0_16px_36px_rgba(21,8,48,.16)] delay-200 ${s.bPos} ${fade} ${state}`}>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e8f6ee]">
                <Check className="h-5 w-5" color="#1E7A46" width={2.6} />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-bold text-navy">Ride confirmed</span>
                <span className="text-xs text-body">{s.summary}</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
