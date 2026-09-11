import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Chatbot } from "@/components/chatbot";
import { Toaster } from "@/components/ui/sonner";
import { getCachedSite } from "@/lib/site";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Red Panda Publications",
    template: "%s · Red Panda Publications",
  },
  description:
    "An independent house for manuscripts, e-books, and printed editions. Cream pages, terracotta spines, and a red panda on the imprint.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const site = await getCachedSite();
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${fraunces.variable} antialiased min-h-screen flex flex-col`}>
        <SiteHeader name={site.house.name} />
        <main className="flex-1">{children}</main>
        <SiteFooter house={site.house} />
        <Chatbot faqs={site.faqs} />
        <Toaster />
      </body>
    </html>
  );
}
