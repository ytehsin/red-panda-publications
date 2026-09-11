import Image from "next/image";
import Link from "next/link";
import { getCachedSite } from "@/lib/site";
import { BookCard } from "@/components/book-card";
import { ToolsShowcase } from "@/components/tools-showcase";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

export default async function HomePage() {
  const site = await getCachedSite();
  const banner = site.banners.find((b) => b.active) || site.banners[0];
  const books = site.books.filter((b) => b.featured).length ? site.books.filter((b) => b.featured) : site.books;

  return (
    <div>
      {banner && (
        <section className="relative overflow-hidden bg-[oklch(0.96_0.03_70)]">
          <div className="absolute inset-0 hidden sm:block">
            <Image
              src={banner.image}
              alt=""
              fill
              className="object-cover object-center"
              priority
              quality={60}
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/30" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">{banner.eyebrow}</p>
            <h1 className="mt-3 max-w-xl text-4xl leading-tight md:text-5xl">{banner.title}</h1>
            <p className="mt-4 max-w-lg text-lg text-foreground/80">{banner.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={banner.ctaHref} className={buttonVariants({ size: "lg" })}>
                {banner.ctaLabel}
              </Link>
              <Link href="/publish" className={buttonVariants({ size: "lg", variant: "outline" })}>
                Publish with us
              </Link>
            </div>
          </div>
        </section>
      )}

      <section id="books" className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.16em] text-primary">Our books</p>
            <h2 className="mt-1 text-3xl">The current list</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Free titles may be read in the e-book reader at no cost. A PDF download is always paid. A printed copy is a third price. Paid titles charge for reading as well.
            </p>
          </div>
          <Link href="/books" className={cn(buttonVariants({ variant: "outline" }))}>
            All books
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      <ToolsShowcase compact />

      <section className="border-y bg-card py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-2">
          <div className="rounded-3xl bg-[oklch(0.95_0.03_42)] p-8">
            <Users className="text-primary" />
            <h2 className="mt-3 text-3xl">Hire us?</h2>
            <p className="mt-2 text-muted-foreground">
              Manuscript to printed book — editing, design, translation, print.
            </p>
            <Link href="/hire" className={cn(buttonVariants(), "mt-5 inline-flex")}>
              See services
            </Link>
          </div>
          <div className="rounded-3xl bg-[oklch(0.96_0.03_70)] p-8">
            <h2 className="text-3xl">Publish with us?</h2>
            <p className="mt-2 text-muted-foreground">
              Title, rights, and a number. We will not ask for the whole manuscript in the first note.
            </p>
            <Link href="/publish" className={cn(buttonVariants({ variant: "secondary" }), "mt-5 inline-flex")}>
              Send details
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
