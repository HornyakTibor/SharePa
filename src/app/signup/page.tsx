import type { Metadata } from "next";
import { AuthShell } from "@/components/brand/AuthShell";
import { SignupForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Create your account – SharePa" };

export default async function Signup({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  const { invite } = await searchParams;
  const code = /^[a-f0-9]{10}$/.test(invite ?? "") ? invite : undefined;
  return (
    <AuthShell
      title="Create your account"
      lead={code ? "A friend invited you to share rides. Once you’re in, you’ll be friends on SharePa." : "Takes a minute. You can add kids and friends after."}
    >
      <SignupForm invite={code} />
    </AuthShell>
  );
}
