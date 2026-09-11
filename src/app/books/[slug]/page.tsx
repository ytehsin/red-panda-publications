import Image from "next/image";
import { notFound } from "next/navigation";
import { getCachedSite } from "@/lib/site";
import { BookActions } from "@/components/book-actions";
import { Badge } from "@/components/ui/badge";
import { formatIsbn13 } from "@/lib/isbn";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = await getCachedSite();
  const book = site.books.find((b) => b.slug === slug);
  return { title: book?.title || "Book" };
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getCachedSite();
  const book = site.books.find((b) => b.slug === slug);
  if (!book) notFound();
  const free = book.access === "free";
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[280px_1fr]">
      <div className="relative mx-auto aspect-[3/4] w-full max-w-[280px] overflow-hidden rounded-2xl bg-muted ring-1 ring-foreground/10">
        <Image src={book.cover} alt="" fill className="object-cover" sizes="280px" />
      </div>
      <div>
        <div className="flex flex-wrap gap-2">
          <Badge>{free ? "Free to read" : "Paid to read"}</Badge>
          <Badge variant="outline">{book.genre}</Badge>
          <Badge variant="outline">{book.language}</Badge>
        </div>
        <h1 className="mt-3 text-4xl">{book.title}</h1>
        <p className="mt-1 text-lg text-muted-foreground">{book.author}</p>
        <p className="mt-4 max-w-2xl">{book.description}</p>
        <dl className="mt-6 grid max-w-lg grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">ISBN</dt>
            <dd>{formatIsbn13(book.isbn)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Pages</dt>
            <dd>{book.pages}</dd>
          </div>
        </dl>
        <div className="mt-8 rounded-2xl border bg-card p-5">
          <h2 className="text-lg">Licences</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>
              {free
                ? "Reading in our e-book reader is free."
                : "Reading in our e-book reader is paid."}
            </li>
            <li>Downloading a PDF always costs a separate fee — including on free titles.</li>
            <li>A printed paper copy is a third price, because paper, ink, and postage are not a file.</li>
          </ul>
          <div className="mt-5">
            <BookActions book={book} />
          </div>
        </div>
      </div>
    </div>
  );
}
