import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { Arrow } from "./icons";

export function CtaBand({ image, text, id, padTop = false }: { image: StaticImageData; text: string; id?: string; padTop?: boolean }) {
  return (
    <section id={id} className={`mx-auto max-w-[1200px] px-6 pb-24 ${padTop ? "pt-24" : ""}`}>
      <div className="grid items-center gap-8 overflow-hidden rounded-[32px] bg-[linear-gradient(95deg,#150830_0%,#341C67_50%,#5833A7_100%)] p-8 text-white min-[880px]:grid-cols-[minmax(0,1fr)_auto] min-[880px]:pr-12">
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
