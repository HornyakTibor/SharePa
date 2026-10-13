import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { signOut } from "@/app/auth/actions";
import { Avatar } from "./Avatar";
import { NotificationBell } from "./NotificationBell";
import type { Notification } from "@/lib/data/home";

/** No menu (design rule): logo → Home, the bell, and Profile. */
export function AppHeader({ name, notifications = [], active }: { name: string; notifications?: Notification[]; active?: "profile" }) {
  const on = active === "profile";
  return (
    <header className="sticky top-0 z-10 border-b border-black/5 bg-white/75 backdrop-blur">
      <div className="mx-auto flex max-w-[1232px] items-center gap-2 px-4 py-3 sm:gap-3">
        <div className="mr-auto"><Logo tone="light" href="/app" /></div>
        <NotificationBell notifications={notifications} />
        <Link
          href="/app/profile"
          aria-current={on ? "page" : undefined}
          aria-label={`Profile – ${name}`}
          className={`flex items-center gap-2.5 rounded-full py-1 pr-1 pl-1 text-sm font-semibold no-underline transition-colors sm:pr-4 ${on ? "bg-p100 text-p600" : "text-ink-2 hover:bg-p100"}`}
        >
          <Avatar name={name} size={36} />
          <span className="hidden sm:inline">Profile</span>
        </Link>
        <form action={signOut} className="hidden sm:block">
          <button className="cursor-pointer rounded-full border-0 bg-transparent px-4 py-2 text-sm font-semibold text-p500 hover:bg-p100">Log out</button>
        </form>
      </div>
    </header>
  );
}
