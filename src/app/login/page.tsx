import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/brand/AuthShell";

export const metadata: Metadata = { title: "Log in – SharePa" };

export default function Login() {
  return (
    <AuthShell title="Log in">
      <p className="m-0">Sign-in is opening very soon. We&apos;re building it right now.</p>
      <Link href="/signup" className="text-sm font-semibold text-p500">New to SharePa? Create an account</Link>
    </AuthShell>
  );
}
