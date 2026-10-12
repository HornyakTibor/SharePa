import { Logo } from "@/components/brand/Logo";
import { signOut } from "@/app/auth/actions";
import { Avatar } from "./ui";

export function AppHeader({ name }: { name: string }) {
  return (
    <header className="sticky top-0 z-10 border-b border-black/5 bg-white/75 backdrop-blur">
      <div className="mx-auto flex max-w-[1232px] items-center gap-3 px-4 py-3">
        <div className="mr-auto"><Logo tone="light" href="/app" /></div>
        <span className="flex items-center gap-2.5 py-1 pr-2 text-sm font-semibold text-ink-2">
          <Avatar name={name} size={36} />
          <span className="hidden sm:inline">{name}</span>
        </span>
        <form action={signOut}>
          <button className="cursor-pointer rounded-full border-0 bg-transparent px-4 py-2 text-sm font-semibold text-p500 hover:bg-p100">Log out</button>
        </form>
      </div>
    </header>
  );
}
