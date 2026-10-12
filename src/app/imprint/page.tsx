import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Imprint – SharePa" };

export default function Imprint() {
  return (
    <LegalPage title="Imprint" updated="12 October 2026">
      <h2>Operator</h2>
      <p>
        Thalassa Consulting Kft.<br />
        Dózsa György út 37<br />
        1188 Budapest, Hungary
      </p>
      <p>
        Company registration number: [COMPANY REGISTRATION NUMBER]<br />
        Tax number: [TAX NUMBER]<br />
        Represented by: [MANAGING DIRECTOR]
      </p>
      <h2>Contact</h2>
      <p>
        Email: <a href="mailto:support@thalassa-consulting.com">support@thalassa-consulting.com</a>
      </p>
      <h2>Hosting</h2>
      <p>
        This website is hosted by Vercel Inc. (vercel.com). Application data is stored by Supabase Inc. (supabase.com) on
        servers in the European Union.
      </p>
      <h2>About this version</h2>
      <p>
        SharePa is currently a demonstration version. Features, prices and availability shown on this website may change
        before launch.
      </p>
    </LegalPage>
  );
}
