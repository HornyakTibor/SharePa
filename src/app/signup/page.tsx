import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/brand/AuthShell";

export const metadata: Metadata = { title: "Create your account – SharePa" };

export default function Signup() {
  return (
    <AuthShell title="Create your account">
      <p className="m-0">Accounts are opening very soon. We&apos;re building sign-up right now.</p>
      <Link href="/login" className="text-sm font-semibold text-p500">Already have an account? Log in</Link>
    </AuthShell>
  );
}
