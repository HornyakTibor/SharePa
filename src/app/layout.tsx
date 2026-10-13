import type { Metadata, Viewport } from "next";
import { ServiceWorker } from "@/components/pwa/ServiceWorker";
import { Montserrat, Roboto_Mono } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "SharePa – share the school run",
  description: "Car-pool school runs and kids' activities with parents you trust.",
  applicationName: "SharePa",
  appleWebApp: { capable: true, title: "SharePa", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#5833A7" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${robotoMono.variable} font-sans antialiased`}>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
