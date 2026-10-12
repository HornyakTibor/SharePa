import type { Metadata } from "next";
import { AuthShell } from "@/components/brand/AuthShell";
import { LoginForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Log in – SharePa" };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <AuthShell title="Log in" lead="Welcome back.">
      <LoginForm next={next} error={error} />
    </AuthShell>
  );
}
