import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Terms of use – SharePa" };

export default function Terms() {
  return (
    <LegalPage title="Terms of use" updated="12 October 2026">
      <p>
        These terms apply to SharePa, operated by Thalassa Consulting Kft., Dózsa György út 37, 1188 Budapest, Hungary.
      </p>

      <h2>What SharePa is</h2>
      <p>
        SharePa is a tool that helps parents coordinate shared rides to their children&apos;s activities. SharePa is
        not a transport provider: rides are arranged privately between parents, and each driver is responsible for their
        car, their insurance and driving safely.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>You must be at least 18 years old to create an account.</li>
        <li>Keep your sign-in details safe and only invite people you know and trust.</li>
        <li>Only add children you are a parent or legal guardian of.</li>
      </ul>

      <h2>Fair use</h2>
      <p>Don&apos;t use SharePa for commercial transport, to contact people who haven&apos;t invited you, or to share false information.</p>

      <h2>Demonstration version</h2>
      <p>
        SharePa is currently a demonstration version, provided free of charge and as is. Data in demo accounts may be
        reset at any time.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms: <a href="mailto:support@thalassa-consulting.com">support@thalassa-consulting.com</a>.
      </p>
    </LegalPage>
  );
}
