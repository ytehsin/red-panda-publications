"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Report = {
  pageCount: number;
  chapterCount: number;
  imageCount: number;
  wordCount: number;
  columnPages: number;
  warnings: string[];
  elapsedMs: number;
};

export default function PdfToEpubPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [epubUrl, setEpubUrl] = useState<string | null>(null);

  async function convert() {
    if (!file) {
      setError("Choose a PDF.");
      return;
    }
    setBusy(true);
    setError(null);
    setReport(null);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let blob: Blob | null = null;
      try {
        const form = new FormData();
        form.set("file", file);
        form.set("title", title);
        form.set("author", author);
        const res = await fetch("/api/convert/pdf-to-epub", { method: "POST", body: form });
        if (res.ok) {
          const encoded = res.headers.get("X-Convert-Report");
          if (encoded) setReport(JSON.parse(atob(encoded)) as Report);
          blob = await res.blob();
        }
      } catch {
        /* static hosting */
      }
      if (!blob) {
        const { convertPdfToEpub } = await import("@/lib/pdf-to-epub");
        const result = await convertPdfToEpub(bytes, {
          title: title || undefined,
          author: author || undefined,
        });
        setReport(result.report);
        blob = new Blob([new Uint8Array(result.epub)], { type: "application/epub+zip" });
      }
      const url = URL.createObjectURL(blob);
      setEpubUrl(url);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(title || file.name.replace(/\.pdf$/i, "") || "book").replace(/\s+/g, "-")}.epub`;
      a.click();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-sm uppercase tracking-[0.16em] text-primary">Free tool</p>
      <h1 className="mt-1 text-4xl">PDF to e-book</h1>
      <p className="mt-3 text-muted-foreground">
        This is not a screenshot stack. The converter reads text with positions, rebuilds paragraphs, detects columns, pulls embedded images, and writes EPUB 3 with a table of contents. It is tested against 200-page specimens.
      </p>
      <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        <li>Born-digital PDFs keep sentences as type, so the house reader can reflow without distorting letters.</li>
        <li>Two-column pages are read left column, then right.</li>
        <li>Files up to about 55 MB. A long novel takes a minute, not a second.</li>
      </ul>
      <div className="mt-8 space-y-3 rounded-2xl border bg-card p-6">
        <div>
          <Label htmlFor="pdf">PDF</Label>
          <Input id="pdf" type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <div>
          <Label htmlFor="title">Title (optional)</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="author">Author (optional)</Label>
          <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} />
        </div>
        <Button onClick={convert} disabled={busy}>
          {busy ? "Converting…" : "Convert to EPUB"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      {report && (
        <div className="mt-6 rounded-2xl bg-muted p-5 text-sm">
          <p className="font-medium">Conversion report</p>
          <dl className="mt-2 grid grid-cols-2 gap-2">
            <div>Pages: {report.pageCount}</div>
            <div>Chapters: {report.chapterCount}</div>
            <div>Words: {report.wordCount}</div>
            <div>Images: {report.imageCount}</div>
            <div>Column pages: {report.columnPages}</div>
            <div>Time: {(report.elapsedMs / 1000).toFixed(1)}s</div>
          </dl>
          {report.warnings.length > 0 && (
            <ul className="mt-2 list-disc pl-4 text-muted-foreground">
              {report.warnings.slice(0, 8).map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
          {epubUrl && (
            <Link href={`/reader?file=${encodeURIComponent(epubUrl)}`} className={cn(buttonVariants({ size: "sm" }), "mt-4 inline-flex")}>
              Open in the e-book reader
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
