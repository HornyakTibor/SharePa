import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Privacy policy – SharePa" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy policy" updated="12 October 2026">
      <p>
        SharePa helps parents share rides to their children&apos;s activities. Because we handle children&apos;s
        schedules, we collect as little as possible, keep it in the European Union and never sell it.
      </p>

      <h2>Who is responsible</h2>
      <p>
        Thalassa Consulting Kft., Dózsa György út 37, 1188 Budapest, Hungary, is the data controller. Contact:{" "}
        <a href="mailto:support@thalassa-consulting.com">support@thalassa-consulting.com</a>.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>Account details: your name, email address and, if you add it, your phone number.</li>
        <li>Your children&apos;s first names and the activities you choose to coordinate.</li>
        <li>Events you import or add, and the pick-up points and addresses you save.</li>
        <li>Rides you offer, join or decline, and the friends you invite.</li>
        <li>Basic technical data needed to run the service securely, such as sign-in sessions.</li>
      </ul>

      <h2>Why we use it</h2>
      <p>
        Only to provide SharePa: to show your schedule, match rides between parents you trust, and send the reminders
        you ask for. The legal basis is the performance of our contract with you (GDPR Art. 6(1)(b)) and, for optional
        features, your consent (Art. 6(1)(a)).
      </p>

      <h2>Who can see it</h2>
      <p>
        Only parents you invite into your circle see the rides, events and pick-up points you share with them. Children
        never have their own accounts. We use two service providers to run SharePa: Vercel (website hosting) and
        Supabase (database and sign-in, stored in the EU).
      </p>

      <h2>How long we keep it</h2>
      <p>As long as your account exists. When you delete your account, we delete your data and your children&apos;s data.</p>

      <h2>Your rights</h2>
      <p>
        You can access, correct, export or delete your data at any time, object to processing, and withdraw consent. You
        can also complain to the Hungarian data protection authority (NAIH, naih.hu).
      </p>
    </LegalPage>
  );
}
