import { getCachedSite } from "@/lib/site";
import { BookCard } from "@/components/book-card";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Books" };

export default async function BooksPage() {
  const site = await getCachedSite();
  const free = site.books.filter((b) => b.access === "free");
  const paid = site.books.filter((b) => b.access === "paid");
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-sm uppercase tracking-[0.16em] text-primary">The list</p>
      <h1 className="mt-1 text-4xl">Our books</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Free copies: reading in our e-book reader is free; a PDF download costs money; a printed copy is priced on its own. Paid copies: reading in the house reader is paid as well.
      </p>

      <h2 className="mt-12 text-2xl">Free to read</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {free.map((b) => (
          <BookCard key={b.id} book={b} />
        ))}
      </div>
      {free.length === 0 && <p className="mt-4 text-sm text-muted-foreground">No free titles on the list yet.</p>}

      <h2 className="mt-12 text-2xl">Paid to read</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {paid.map((b) => (
          <BookCard key={b.id} book={b} />
        ))}
      </div>
      {paid.length === 0 && <p className="mt-4 text-sm text-muted-foreground">No paid titles on the list yet.</p>}
    </div>
  );
}
