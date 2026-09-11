import Image from "next/image";
import Link from "next/link";
import type { Book } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { money } from "@/lib/money";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BookCard({ book }: { book: Book }) {
  const freeRead = book.access === "free";
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
      <Link href={`/books/${book.slug}`} className="relative aspect-[3/4] bg-muted">
        <Image src={book.cover} alt="" fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap gap-1">
          <Badge variant={freeRead ? "secondary" : "default"}>
            {freeRead ? "Free to read" : "Paid to read"}
          </Badge>
          <Badge variant="outline">{book.genre}</Badge>
        </div>
        <h3 className="font-heading text-lg leading-snug" style={{ fontFamily: "var(--font-heading)" }}>
          <Link href={`/books/${book.slug}`}>{book.title}</Link>
        </h3>
        <p className="text-sm text-muted-foreground">{book.author}</p>
        <p className="line-clamp-3 text-sm">{book.description}</p>
        <dl className="mt-auto grid grid-cols-3 gap-1 pt-3 text-[11px] text-muted-foreground">
          <div>
            <dt>Reader</dt>
            <dd className="font-medium text-foreground">{freeRead ? "Free" : money(book.readerPrice)}</dd>
          </div>
          <div>
            <dt>PDF</dt>
            <dd className="font-medium text-foreground">{money(book.pdfPrice)}</dd>
          </div>
          <div>
            <dt>Print</dt>
            <dd className="font-medium text-foreground">{money(book.printPrice)}</dd>
          </div>
        </dl>
        <Link href={`/books/${book.slug}`} className={cn(buttonVariants({ size: "sm" }), "mt-2 w-full")}>
          View book
        </Link>
      </div>
    </article>
  );
}
