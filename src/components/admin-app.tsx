"use client";

import { useEffect, useState } from "react";
import type { Banner, Book, Inquiry, SiteData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/site-client";
import { toast } from "sonner";
import baked from "../../data/site.json";

export function AdminApp() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [site, setSite] = useState<SiteData | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("banners");

  async function load() {
    try {
      const res = await fetch("/api/admin");
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setSite(data.site);
        setInquiries(data.inquiries || []);
        setAuthed(true);
        return;
      }
    } catch {
      /* GitHub Pages / static */
    }
    const local = typeof window !== "undefined" ? localStorage.getItem("rpp-admin-site") : null;
    setSite(local ? (JSON.parse(local) as SiteData) : (baked as SiteData));
    setAuthed(sessionStorage.getItem("rpp-admin") === "1");
  }

  useEffect(() => {
    load();
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        await load();
        return;
      }
    } catch {
      /* static */
    }
    if (password === "redpanda") {
      sessionStorage.setItem("rpp-admin", "1");
      setAuthed(true);
      const local = localStorage.getItem("rpp-admin-site");
      setSite(local ? (JSON.parse(local) as SiteData) : (baked as SiteData));
      return;
    }
    toast.error("Wrong password.");
  }

  async function save(next: SiteData) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (res.ok) {
        setSite(next);
        toast.success("Homepage data saved.");
        setBusy(false);
        return;
      }
    } catch {
      /* static */
    }
    localStorage.setItem("rpp-admin-site", JSON.stringify(next));
    setSite(next);
    toast.success("Saved in this browser (static host).");
    setBusy(false);
  }

  async function upload(file: File, folder: string) {
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("folder", folder);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (res.ok) {
        const data = await res.json();
        return data.url as string;
      }
    } catch {
      /* static */
    }
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });
  }

  if (authed === null) return <p className="px-4 py-16 text-center">Checking the desk key…</p>;
  if (!authed) {
    return (
      <form onSubmit={login} className="mx-auto mt-16 max-w-sm space-y-3 rounded-2xl border bg-card p-6">
        <h1 className="text-2xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Edit banners and books on the homepage. Default password: redpanda</p>
        <Label htmlFor="pw">Password</Label>
        <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit">Enter</Button>
      </form>
    );
  }
  if (!site) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Banners, books, FAQs, and blog copy live here. Saving writes to the homepage.</p>
        </div>
        <div className="flex gap-2">
          <Button disabled={busy} onClick={() => save(site)}>
            {busy ? "Saving…" : "Save all"}
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              await fetch("/api/admin", { method: "DELETE" });
              setAuthed(false);
            }}
          >
            Log out
          </Button>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap gap-2">
        {[
          ["banners", "Banner"],
          ["books", "Books"],
          ["faqs", "Chat FAQs"],
          ["blog", "Blog"],
          ["inbox", "Inbox"],
        ].map(([id, label]) => (
          <Button key={id} size="sm" variant={tab === id ? "default" : "outline"} onClick={() => setTab(id)}>
            {label}
          </Button>
        ))}
      </div>
      {tab === "banners" && (
        <div className="mt-6 space-y-6">
          {site.banners.map((banner, i) => (
            <BannerEditor
              key={banner.id}
              banner={banner}
              onChange={(b) => {
                const banners = site.banners.map((x) => (x.id === b.id ? b : { ...x, active: b.active ? false : x.active }));
                setSite({ ...site, banners });
              }}
              onUpload={async (file) => {
                const url = await upload(file, "banners");
                const banners = site.banners.map((x, idx) => (idx === i ? { ...x, image: url } : x));
                setSite({ ...site, banners });
              }}
              onRemove={() => setSite({ ...site, banners: site.banners.filter((b) => b.id !== banner.id) })}
            />
          ))}
          <Button
            variant="outline"
            onClick={() =>
              setSite({
                ...site,
                banners: [
                  ...site.banners,
                  {
                    id: crypto.randomUUID(),
                    eyebrow: "New banner",
                    title: "Headline",
                    subtitle: "Supporting line",
                    ctaLabel: "Browse the list",
                    ctaHref: "/books",
                    image: "/banners/reading-room.png",
                    active: site.banners.every((b) => !b.active),
                  },
                ],
              })
            }
          >
            Add banner
          </Button>
        </div>
      )}
      {tab === "books" && (
        <div className="mt-6 space-y-6">
          <p className="text-sm text-muted-foreground">Add as many titles as you like. Free vs paid controls the reader; PDF and print always have their own prices.</p>
          {site.books.map((book) => (
            <BookEditor
              key={book.id}
              book={book}
              onChange={(b) => setSite({ ...site, books: site.books.map((x) => (x.id === b.id ? b : x)) })}
              onUpload={async (file) => {
                const url = await upload(file, "covers");
                setSite({ ...site, books: site.books.map((x) => (x.id === book.id ? { ...x, cover: url } : x)) });
              }}
              onRemove={() => setSite({ ...site, books: site.books.filter((b) => b.id !== book.id) })}
            />
          ))}
          <Button
            onClick={() =>
              setSite({
                ...site,
                books: [
                  ...site.books,
                  {
                    id: crypto.randomUUID(),
                    slug: `new-title-${site.books.length + 1}`,
                    title: "New title",
                    author: "Author",
                    description: "A few sentences for the list.",
                    cover: "/covers/migration-clock.png",
                    isbn: "9781990001990",
                    access: "free",
                    readerPrice: 0,
                    pdfPrice: 6.99,
                    printPrice: 16,
                    currency: "USD",
                    pages: 200,
                    language: "English",
                    genre: "Fiction",
                    epubUrl: "/epubs/the-migration-clock.epub",
                    featured: true,
                  },
                ],
              })
            }
          >
            Add a book
          </Button>
        </div>
      )}
      {tab === "faqs" && (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">These answers feed the house-desk chatbot. Add more whenever a question keeps landing.</p>
          {site.faqs.map((faq) => (
            <div key={faq.id} className="space-y-2 rounded-xl border p-4">
              <Input value={faq.question} onChange={(e) => setSite({ ...site, faqs: site.faqs.map((f) => (f.id === faq.id ? { ...f, question: e.target.value } : f)) })} />
              <Textarea value={faq.answer} onChange={(e) => setSite({ ...site, faqs: site.faqs.map((f) => (f.id === faq.id ? { ...f, answer: e.target.value } : f)) })} />
              <Button size="sm" variant="ghost" onClick={() => setSite({ ...site, faqs: site.faqs.filter((f) => f.id !== faq.id) })}>
                Remove
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() =>
              setSite({
                ...site,
                faqs: [...site.faqs, { id: crypto.randomUUID(), question: "New question", answer: "The answer." }],
              })
            }
          >
            Add FAQ
          </Button>
        </div>
      )}
      {tab === "blog" && (
        <div className="mt-6 space-y-4">
          {site.blog.map((post) => (
            <div key={post.id} className="space-y-2 rounded-xl border p-4">
              <Input value={post.title} onChange={(e) => setSite({ ...site, blog: site.blog.map((p) => (p.id === post.id ? { ...p, title: e.target.value, slug: slugify(e.target.value) } : p)) })} />
              <Input value={post.excerpt} onChange={(e) => setSite({ ...site, blog: site.blog.map((p) => (p.id === post.id ? { ...p, excerpt: e.target.value } : p)) })} />
              <Textarea className="min-h-32" value={post.body} onChange={(e) => setSite({ ...site, blog: site.blog.map((p) => (p.id === post.id ? { ...p, body: e.target.value } : p)) })} />
              <Button size="sm" variant="ghost" onClick={() => setSite({ ...site, blog: site.blog.filter((p) => p.id !== post.id) })}>
                Remove
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() =>
              setSite({
                ...site,
                blog: [
                  ...site.blog,
                  {
                    id: crypto.randomUUID(),
                    slug: "new-post",
                    title: "New post",
                    excerpt: "A short line.",
                    body: "The piece.",
                    date: new Date().toISOString().slice(0, 10),
                    cover: "/stock/paper.png",
                  },
                ],
              })
            }
          >
            Add post
          </Button>
        </div>
      )}
      {tab === "inbox" && (
        <div className="mt-6 space-y-3">
          {inquiries.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
          {inquiries.map((q) => (
            <div key={q.id} className="rounded-xl border bg-card p-4 text-sm">
              <p className="font-medium capitalize">
                {q.kind} · {new Date(q.createdAt).toLocaleString()}
              </p>
              <pre className="mt-2 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">{JSON.stringify(q.payload, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BannerEditor({
  banner,
  onChange,
  onUpload,
  onRemove,
}: {
  banner: Banner;
  onChange: (b: Banner) => void;
  onUpload: (f: File) => Promise<void>;
  onRemove: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-2">
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={banner.active} onChange={(e) => onChange({ ...banner, active: e.target.checked })} />
          Show this banner on the homepage
        </label>
        <Input value={banner.eyebrow} onChange={(e) => onChange({ ...banner, eyebrow: e.target.value })} />
        <Input value={banner.title} onChange={(e) => onChange({ ...banner, title: e.target.value })} />
        <Textarea value={banner.subtitle} onChange={(e) => onChange({ ...banner, subtitle: e.target.value })} />
        <Input value={banner.ctaLabel} onChange={(e) => onChange({ ...banner, ctaLabel: e.target.value })} />
        <Input value={banner.ctaHref} onChange={(e) => onChange({ ...banner, ctaHref: e.target.value })} />
        <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
        <Button size="sm" variant="ghost" onClick={onRemove}>
          Remove banner
        </Button>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={banner.image} alt="" className="h-48 w-full rounded-xl object-cover" />
    </div>
  );
}

function BookEditor({
  book,
  onChange,
  onUpload,
  onRemove,
}: {
  book: Book;
  onChange: (b: Book) => void;
  onUpload: (f: File) => Promise<void>;
  onRemove: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-[140px_1fr]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={book.cover} alt="" className="aspect-[3/4] rounded-lg object-cover" />
      <div className="grid gap-2 sm:grid-cols-2">
        <Input value={book.title} onChange={(e) => onChange({ ...book, title: e.target.value, slug: slugify(e.target.value) || book.slug })} />
        <Input value={book.author} onChange={(e) => onChange({ ...book, author: e.target.value })} />
        <Textarea className="sm:col-span-2" value={book.description} onChange={(e) => onChange({ ...book, description: e.target.value })} />
        <Input value={book.isbn} onChange={(e) => onChange({ ...book, isbn: e.target.value })} />
        <Input value={book.genre} onChange={(e) => onChange({ ...book, genre: e.target.value })} />
        <select
          className="rounded-lg border bg-background px-2 py-2 text-sm"
          value={book.access}
          onChange={(e) =>
            onChange({
              ...book,
              access: e.target.value as Book["access"],
              readerPrice: e.target.value === "free" ? 0 : book.readerPrice || 8,
            })
          }
        >
          <option value="free">Free to read</option>
          <option value="paid">Paid to read</option>
        </select>
        <Input type="number" step="0.01" value={book.readerPrice} onChange={(e) => onChange({ ...book, readerPrice: Number(e.target.value) })} />
        <Input type="number" step="0.01" value={book.pdfPrice} onChange={(e) => onChange({ ...book, pdfPrice: Number(e.target.value) })} />
        <Input type="number" step="0.01" value={book.printPrice} onChange={(e) => onChange({ ...book, printPrice: Number(e.target.value) })} />
        <Input type="number" value={book.pages} onChange={(e) => onChange({ ...book, pages: Number(e.target.value) })} />
        <Input value={book.epubUrl} onChange={(e) => onChange({ ...book, epubUrl: e.target.value })} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={book.featured} onChange={(e) => onChange({ ...book, featured: e.target.checked })} />
          Featured on homepage
        </label>
        <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
        <Button size="sm" variant="ghost" onClick={onRemove}>
          Remove book
        </Button>
      </div>
    </div>
  );
}
