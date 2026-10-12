"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, signIn, signUp, updatePassword, type FormState } from "@/app/auth/actions";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";

const link = "font-semibold text-p500 hover:text-p600";

export function LoginForm({ next, error }: { next?: string; error?: string }) {
  const [state, action] = useActionState<FormState, FormData>(signIn, {
    error:
      error === "link"
        ? "That link has expired or was already used. Please log in, or request a new link."
        : error === "demo"
          ? "The demo couldn't open right now. Please try again in a minute."
          : undefined,
  });
  return (
    <form action={action} className="flex flex-col gap-4">
      <FormMessage error={state.error} />
      <input type="hidden" name="next" value={next ?? "/app"} />
      <Field label="Email" name="email" type="email" autoComplete="email" required defaultValue={state.email} />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required />
      <SubmitButton busy="Logging in…">Log in</SubmitButton>
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <Link href="/forgot-password" className={link}>Forgot password?</Link>
        <Link href="/signup" className={link}>Create an account</Link>
      </div>
    </form>
  );
}

export function SignupForm() {
  const [state, action] = useActionState<FormState, FormData>(signUp, {});
  if (state.info) {
    return (
      <div className="flex flex-col gap-4">
        <FormMessage info={state.info} />
        <p className="m-0 text-center text-sm text-ink-3">
          Wrong address? <Link href="/signup" className={link}>Start again</Link>
        </p>
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-4">
      <FormMessage error={state.error} />
      <Field label="Full name" name="name" autoComplete="name" required defaultValue={state.name} />
      <Field label="Email" name="email" type="email" autoComplete="email" required defaultValue={state.email} />
      <Field label="Password" name="password" type="password" autoComplete="new-password" minLength={8} required hint="At least 8 characters." />
      <label className="flex items-start gap-3 text-sm text-ink-2">
        <input type="checkbox" name="terms" required className="mt-0.5 h-[18px] w-[18px] accent-p500" />
        <span>
          I accept the <Link href="/terms" className={link} target="_blank">terms</Link> and{" "}
          <Link href="/privacy" className={link} target="_blank">privacy policy</Link>
        </span>
      </label>
      <SubmitButton busy="Creating your account…">Create account</SubmitButton>
      <p className="m-0 text-center text-sm text-ink-3">
        Already have an account? <Link href="/login" className={link}>Log in</Link>
      </p>
    </form>
  );
}

export function ForgotForm() {
  const [state, action] = useActionState<FormState, FormData>(requestPasswordReset, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <FormMessage error={state.error} info={state.info} />
      {!state.info && (
        <>
          <Field label="Email" name="email" type="email" autoComplete="email" required defaultValue={state.email} />
          <SubmitButton busy="Sending…">Send reset link</SubmitButton>
        </>
      )}
      <p className="m-0 text-center text-sm"><Link href="/login" className={link}>Back to log in</Link></p>
    </form>
  );
}

export function ResetForm() {
  const [state, action] = useActionState<FormState, FormData>(updatePassword, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <FormMessage error={state.error} />
      <Field label="New password" name="password" type="password" autoComplete="new-password" minLength={8} required hint="At least 8 characters." />
      <SubmitButton busy="Saving…">Save new password</SubmitButton>
    </form>
  );
}
