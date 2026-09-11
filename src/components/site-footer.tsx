import Link from "next/link";
import type { SiteData } from "@/lib/types";

export function SiteFooter({ house }: { house: SiteData["house"] }) {
  return (
    <footer className="mt-16 border-t bg-[oklch(0.97_0.02_85)]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-heading text-lg" style={{ fontFamily: "var(--font-heading)" }}>
            {house.name}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{house.tagline}</p>
        </div>
        <div>
          <p className="text-sm font-medium">The house</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li><Link href="/books" className="hover:underline">Books</Link></li>
            <li><Link href="/tools" className="hover:underline">Free tools</Link></li>
            <li><Link href="/reader" className="hover:underline">E-book reader</Link></li>
            <li><Link href="/blog" className="hover:underline">Blog</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium">Work with us</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li><Link href="/hire" className="hover:underline">Hire us</Link></li>
            <li><Link href="/publish" className="hover:underline">Publish with us</Link></li>
            <li><Link href="/contact" className="hover:underline">Contact</Link></li>
            <li><Link href="/admin" className="hover:underline text-muted-foreground">Dashboard</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-medium">Visit</p>
          <p className="mt-2 text-muted-foreground">{house.address}</p>
          <p className="mt-1">{house.email}</p>
          <p>{house.phone}</p>
        </div>
      </div>
    </footer>
  );
}
