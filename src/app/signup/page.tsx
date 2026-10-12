import type { Metadata } from "next";
import { AuthShell } from "@/components/brand/AuthShell";
import { SignupForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Create your account – SharePa" };

export default function Signup() {
  return (
    <AuthShell title="Create your account" lead="Takes a minute. You can add kids and friends after.">
      <SignupForm />
    </AuthShell>
  );
}
