"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/books", label: "Books" },
  { href: "/tools", label: "Free tools" },
  { href: "/hire", label: "Hire us" },
  { href: "/publish", label: "Publish with us" },
  { href: "/blog", label: "Blog" },
];

export function SiteHeader({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <header data-site-header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 rounded-full pr-2 hover:bg-muted" aria-label={`${name} home`}>
          <Image src="/logo.png" alt="" width={40} height={40} className="rounded-full bg-white" priority />
          <span className="truncate text-[15px] font-semibold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            {name}
          </span>
        </Link>
        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm",
                  active ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-muted hover:text-foreground"
                )}
              >
                {l.label}
              </Link>
            );
          })}
          <Link href="/contact" className={cn(buttonVariants({ size: "sm" }), "ml-2")}>
            Contact
          </Link>
        </nav>
        <Button className="md:hidden" variant="outline" size="icon" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((v) => !v)}>
          {open ? <X /> : <Menu />}
        </Button>
      </div>
      {open && (
        <nav className="border-t bg-background md:hidden" aria-label="Mobile">
          <div className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            <Link href="/" className="rounded-lg px-3 py-2.5 font-medium hover:bg-muted" onClick={() => setOpen(false)}>
              Home
            </Link>
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2.5 hover:bg-muted" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <Link href="/contact" className="rounded-lg px-3 py-2.5 hover:bg-muted" onClick={() => setOpen(false)}>
              Contact
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
