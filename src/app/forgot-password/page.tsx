import type { Metadata } from "next";
import { AuthShell } from "@/components/brand/AuthShell";
import { ForgotForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Reset your password – SharePa" };

export default function ForgotPassword() {
  return (
    <AuthShell title="Forgot your password?" lead="Enter your email and we'll send you a link to choose a new one.">
      <ForgotForm />
    </AuthShell>
  );
}
