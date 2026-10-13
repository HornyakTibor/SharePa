import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { Arrow } from "./icons";

/** Full-width call-to-action lane ("Alternative – full-width CTA lanes" in the SharePa Website design). */
export function CtaBand({ image, text, id, gapAbove = false }: { image: StaticImageData; text: string; id?: string; gapAbove?: boolean }) {
  return (
    <section id={id} className={`bg-[linear-gradient(95deg,#2C2145_0%,#483376_50%,#6947B0_100%)] text-white ${gapAbove ? "mt-24" : ""}`}>
      <div className="mx-auto grid max-w-[1200px] items-center gap-8 px-6 py-8 min-[880px]:grid-cols-[minmax(0,1fr)_auto] min-[880px]:pr-[72px] min-[880px]:pl-14">
        <div className="flex flex-wrap items-center gap-8">
          <div className="flex h-40 w-[200px] shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-lilac">
            <Image src={image} alt="" className="h-[150px] w-auto" />
          </div>
          <p className="m-0 max-w-[560px] text-[26px] leading-tight font-bold tracking-[-0.5px] sm:text-[31px]">{text}</p>
        </div>
        <Link
          href="/signup"
          className="btn-lift inline-flex min-h-14 items-center gap-2.5 justify-self-start whitespace-nowrap rounded-full bg-white px-[30px] text-[17px] font-bold text-p600 no-underline hover:bg-p100 hover:text-p700"
        >
          Try it for free <Arrow />
        </Link>
      </div>
    </section>
  );
}
