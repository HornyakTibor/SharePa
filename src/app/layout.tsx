import type { Metadata } from "next";
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
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${robotoMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
