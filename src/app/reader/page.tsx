import { Suspense } from "react";
import { getCachedSite } from "@/lib/site";
import { ReaderClient } from "@/components/reader-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "E-book reader" };

export default async function ReaderPage() {
  const site = await getCachedSite();
  const books = site.books.map((b) => ({
    id: b.id,
    slug: b.slug,
    title: b.title,
    author: b.author,
    cover: b.cover,
    access: b.access,
    epubUrl: b.epubUrl,
  }));
  return (
    <Suspense fallback={<div className="px-4 py-12">Opening the reader…</div>}>
      <ReaderClient books={books} />
    </Suspense>
  );
}
