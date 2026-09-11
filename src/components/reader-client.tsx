"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { hasEntitlement, readingCfiKey } from "@/lib/entitlements";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Upload, X } from "lucide-react";

type ShelfBook = {
  id: string;
  slug: string;
  title: string;
  author: string;
  cover: string;
  access: "free" | "paid";
  epubUrl: string;
};

export function ReaderClient({ books }: { books: ShelfBook[] }) {
  const params = useSearchParams();
  const slug = params.get("book");
  const fileParam = params.get("file");
  const host = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<{ display: (t?: string) => Promise<unknown>; prev: () => void; next: () => void; destroy: () => void } | null>(null);
  const [active, setActive] = useState<ShelfBook | null>(null);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [locked, setLocked] = useState(false);
  const [status, setStatus] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (fileParam) {
      setLocalUrl(fileParam);
      setReading(true);
      return;
    }
    if (slug) {
      const book = books.find((b) => b.slug === slug);
      if (book) {
        setActive(book);
        setReading(true);
      }
    }
  }, [slug, fileParam, books]);

  useEffect(() => {
    if (!reading) {
      document.documentElement.classList.remove("reading-mode");
      return;
    }
    document.documentElement.classList.add("reading-mode");
    return () => document.documentElement.classList.remove("reading-mode");
  }, [reading]);

  useEffect(() => {
    if (!reading || !active) {
      setLocked(false);
      return;
    }
    if (localUrl) {
      setLocked(false);
      return;
    }
    setLocked(active.access === "paid" && !hasEntitlement(active.id, "reader"));
  }, [active, localUrl, reading]);

  useEffect(() => {
    if (!reading || locked) return;
    const url = localUrl || active?.epubUrl;
    if (!url || !host.current) return;
    let destroyed = false;
    let bookObj: { destroy: () => void } | null = null;
    (async () => {
      setStatus("Opening…");
      const ePub = (await import("epubjs")).default;
      if (destroyed || !host.current) return;
      host.current.innerHTML = "";
      const book = ePub(url);
      bookObj = book;
      const rendition = book.renderTo(host.current, {
        width: "100%",
        height: "100%",
        flow: "paginated",
        spread: "auto",
        allowScriptedContent: false,
      });
      rendition.themes.default({
        body: {
          "font-family": "Georgia, 'Iowan Old Style', serif",
          "line-height": "1.7",
          background: "#f7f0e4",
          color: "#2b2118",
          padding: "0 6%",
          "max-width": "none",
        },
        img: { "max-width": "100%", height: "auto" },
        p: { "orphans": "3", "widows": "3", "text-align": "justify" },
      });
      renditionRef.current = rendition;
      const key = readingCfiKey(active?.id || url);
      const saved = localStorage.getItem(key);
      await rendition.display(saved || undefined);
      rendition.on("relocated", (loc: { start: { cfi: string } }) => {
        localStorage.setItem(key, loc.start.cfi);
      });
      setTitle(active?.title || "Opened file");
      setStatus("");
    })().catch((err) => {
      console.error(err);
      setStatus("Could not open this EPUB.");
    });
    return () => {
      destroyed = true;
      try {
        renditionRef.current?.destroy();
      } catch {
        /* ignore */
      }
      renditionRef.current = null;
      try {
        bookObj?.destroy();
      } catch {
        /* ignore */
      }
    };
  }, [active, locked, localUrl, reading]);

  function closeReader() {
    setReading(false);
    setLocalUrl(null);
    setActive(null);
    setStatus("");
  }

  function openBook(book: ShelfBook) {
    setLocalUrl(null);
    setActive(book);
    setReading(true);
  }

  if (reading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#f7f0e4]">
        <div className="flex items-center justify-between gap-3 border-b border-[#e4d4bc] bg-[#efe4d0] px-3 py-2">
          <Button variant="ghost" onClick={closeReader}>
            <X className="mr-1" /> Close
          </Button>
          <p className="min-w-0 truncate text-sm font-medium text-[#3a2a1c]">
            {title} {status && `· ${status}`}
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" aria-label="Previous page" onClick={() => renditionRef.current?.prev()}>
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="icon" aria-label="Next page" onClick={() => renditionRef.current?.next()}>
              <ChevronRight />
            </Button>
          </div>
        </div>
        {locked && active ? (
          <div className="mx-auto flex max-w-lg flex-1 flex-col justify-center p-8">
            <h2 className="text-2xl">This title is paid to read</h2>
            <p className="mt-2 text-sm text-muted-foreground">Buy reader access on the book page, then return.</p>
            <Link href={`/books/${active.slug}`} className="mt-4 text-primary underline">
              Go to {active.title}
            </Link>
          </div>
        ) : (
          <div className="relative min-h-0 flex-1">
            <button
              type="button"
              aria-label="Previous page"
              className="absolute inset-y-0 left-0 z-10 w-[18%] cursor-w-resize bg-transparent"
              onClick={() => renditionRef.current?.prev()}
            />
            <button
              type="button"
              aria-label="Next page"
              className="absolute inset-y-0 right-0 z-10 w-[18%] cursor-e-resize bg-transparent"
              onClick={() => renditionRef.current?.next()}
            />
            <div ref={host} className="h-full w-full" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-sm uppercase tracking-[0.16em] text-primary">Free tools</p>
      <h1 className="mt-1 text-4xl">E-book reader</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Choose a title from our list, or open your own EPUB below. Once a book is open, the reader fills the screen — cream paper, page turns, and a saved place on this device.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {books.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => openBook(b)}
            className="flex gap-3 rounded-2xl border bg-card p-3 text-left hover:shadow-md"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.cover} alt="" className="h-24 w-16 rounded-md object-cover" />
            <span>
              <span className="block font-medium">{b.title}</span>
              <span className="block text-sm text-muted-foreground">{b.author}</span>
              <span className="mt-1 inline-block text-xs text-primary">{b.access === "free" ? "Free to read" : "Paid to read"}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="mt-10 rounded-2xl border border-dashed bg-muted/40 p-6">
        <p className="font-medium">Open an EPUB from your computer</p>
        <p className="mt-1 text-sm text-muted-foreground">Use a file you converted here, or any EPUB 2 / EPUB 3.</p>
        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/85">
          <Upload className="size-4" />
          Open EPUB
          <input
            type="file"
            accept=".epub,application/epub+zip"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setActive(null);
              setLocalUrl(URL.createObjectURL(file));
              setTitle(file.name.replace(/\.epub$/i, ""));
              setReading(true);
            }}
          />
        </label>
      </div>
    </div>
  );
}
