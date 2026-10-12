"use client";

import { useFormStatus } from "react-dom";

/** Label + filled input, the SharePa modern light style. */
export function Field({
  label,
  hint,
  ...input
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-2 text-sm font-semibold text-ink-2">
      {label}
      <input
        {...input}
        className="min-h-12 rounded-2xl border-0 bg-canvas px-4 text-base font-medium text-ink outline-none ring-p500/0 transition placeholder:font-normal placeholder:text-ink-3 focus:bg-white focus:ring-4 focus:ring-p100 focus:shadow-[inset_0_0_0_2px_#5833A7]"
      />
      {hint && <span className="text-xs font-normal text-ink-3">{hint}</span>}
    </label>
  );
}

/** Primary pill button that shows a busy label while its form is submitting. */
export function SubmitButton({ children, busy }: { children: React.ReactNode; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-lift flex min-h-[52px] w-full items-center justify-center rounded-full bg-p500 px-6 text-base font-bold text-white shadow-[0_12px_28px_rgba(88,51,167,.28)] hover:bg-p600 disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? busy : children}
    </button>
  );
}

/** Error or success message shown above a form. Announced to screen readers. */
export function FormMessage({ error, info }: { error?: string; info?: string }) {
  if (!error && !info) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={`m-0 rounded-2xl px-4 py-3 text-sm font-medium ${error ? "bg-err-bg text-err" : "bg-ok-bg text-ok"}`}
    >
      {error ?? info}
    </p>
  );
}
