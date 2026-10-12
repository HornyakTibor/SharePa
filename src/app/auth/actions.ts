"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; info?: string; email?: string; name?: string };

/** Turns Supabase's technical messages into plain, friendly ones. */
function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "That email and password don't match. Check them and try again.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "There's already an account with this email. Log in instead?";
  if (m.includes("email not confirmed")) return "Please confirm your email first — the link is in your inbox.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a minute and try again.";
  if (m.includes("password") && (m.includes("6") || m.includes("short") || m.includes("weak")))
    return "Please choose a stronger password: at least 8 characters.";
  return "Something went wrong. Please try again.";
}

async function siteOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

async function client() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase;
}

function safeNext(next: FormDataEntryValue | null) {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : "/app";
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const keep = { name, email };

  if (!name) return { ...keep, error: "Please enter your full name." };
  if (password.length < 8) return { ...keep, error: "Please choose a password with at least 8 characters." };
  if (!formData.get("terms")) return { ...keep, error: "Please accept the terms and privacy policy to continue." };

  const supabase = await client();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/app`,
    },
  });
  if (error) return { ...keep, error: friendly(error.message) };

  // Supabase returns an existing, unconfirmed user without an error; it has no identities.
  if (data.user && data.user.identities?.length === 0) {
    return { ...keep, error: "There's already an account with this email. Log in instead?" };
  }
  if (data.session) redirect("/app");
  return { ...keep, info: `Almost there! We've sent a confirmation link to ${email}. Open it to finish creating your account.` };
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { email, error: "Please enter your email and password." };

  const supabase = await client();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { email, error: friendly(error.message) };
  redirect(safeNext(formData.get("next")));
}

export async function signOut() {
  const supabase = await client();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Please enter your email." };

  const supabase = await client();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/reset-password`,
  });
  if (error && friendly(error.message).startsWith("Too many")) return { email, error: friendly(error.message) };
  // Same answer whether or not the account exists, so nobody can probe for emails.
  return { email, info: `If there's a SharePa account for ${email}, a link to choose a new password is on its way.` };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "Please choose a password with at least 8 characters." };

  const supabase = await client();
  if (await isDemoUser(supabase)) return { error: "The demo account's password can't be changed." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: friendly(error.message) };
  redirect("/app");
}

type Client = NonNullable<Awaited<ReturnType<typeof createClient>>>;

/** True when the signed-in parent is one of the shared demo accounts. */
async function isDemoUser(supabase: Client) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return false;
  const { data } = await supabase.from("profiles").select("is_demo").eq("id", auth.user.id).maybeSingle();
  return Boolean(data?.is_demo);
}

/**
 * "Try the demo": signs the visitor in as Kata Molnár, the shared demo parent.
 * The credentials live only in server environment variables, never in the browser.
 */
export async function tryDemo() {
  const email = process.env.DEMO_EMAIL;
  const password = process.env.DEMO_PASSWORD;
  if (!email || !password) redirect("/login?error=demo");

  const supabase = await client();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=demo");
  redirect("/app");
}
