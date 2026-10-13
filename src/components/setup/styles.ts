// Shared class names for the set-up screens (plain module, usable from server and client components).
export const btn = {
  base: "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border-0 px-5 text-sm font-bold no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-50",
  pri: "bg-p500 text-white shadow-[0_10px_24px_rgba(88,51,167,.24)] hover:bg-p600",
  sec: "bg-p100 text-p600 hover:bg-[#d8cff5]",
  ghost: "bg-transparent text-p500 hover:bg-p100",
  sm: "min-h-9 px-4 text-[13px]",
};
export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export const inputCls =
  "min-h-12 w-full rounded-2xl border-0 bg-canvas px-4 text-base font-medium text-ink outline-none transition placeholder:font-normal placeholder:text-ink-3 focus:bg-white focus:shadow-[inset_0_0_0_2px_#5833A7] focus:ring-4 focus:ring-p100";

