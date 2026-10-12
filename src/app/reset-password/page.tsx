import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/brand/AuthShell";
import { ResetForm } from "@/components/auth/forms";
import { createClient } from "@/lib/supabase/server";

// Always render per request: the page depends on who is logged in.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Choose a new password – SharePa" };

export default async function ResetPassword() {
  // Reached from the email link, which signs the parent in first.
  const supabase = await createClient();
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!data.user) redirect("/forgot-password");
  return (
    <AuthShell title="Choose a new password" lead="You'll stay logged in on this device.">
      <ResetForm />
    </AuthShell>
  );
}
