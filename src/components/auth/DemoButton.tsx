"use client";

import { useFormStatus } from "react-dom";
import { tryDemo } from "@/app/auth/actions";

function Inner({ className, children }: { className: string; children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${className} disabled:cursor-wait disabled:opacity-70`}>
      {pending ? "Opening the demo…" : children}
    </button>
  );
}

/** One click logs the visitor in as the demo parent. */
export function DemoButton({ className, children = "Try the demo" }: { className: string; children?: React.ReactNode }) {
  return (
    <form action={tryDemo} className="contents">
      <Inner className={className}>{children}</Inner>
    </form>
  );
}
