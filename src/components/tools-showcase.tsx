import Link from "next/link";
import { Barcode, BookOpen, FileText, ImageIcon, Mic, Type } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tools = [
  {
    href: "/tools/isbn",
    title: "ISBN to barcode",
    body: "Type an ISBN. Download EAN-13 artwork as PNG, SVG, or JPEG — no watermark.",
    icon: Barcode,
    tone: "bg-[oklch(0.95_0.03_42)]",
  },
  {
    href: "/tools/cover",
    title: "Cover designer",
    body: "Trade and A-series sizes, several layouts, stock pictures or your own image, and a choice of type.",
    icon: ImageIcon,
    tone: "bg-[oklch(0.96_0.03_70)]",
  },
  {
    href: "/tools/publisher-page",
    title: "Publisher page maker",
    body: "Five imprint templates, including copyright pages. Fill in the house details and export.",
    icon: FileText,
    tone: "bg-[oklch(0.95_0.02_55)]",
  },
  {
    href: "/tools/pdf-to-epub",
    title: "PDF to e-book",
    body: "Built for long files. Reconstructs paragraphs and columns, keeps images, writes EPUB 3.",
    icon: BookOpen,
    tone: "bg-[oklch(0.96_0.025_80)]",
  },
];

export function ToolsShowcase({ compact = false }: { compact?: boolean }) {
  return (
    <section id="tools" className="bg-[oklch(0.97_0.02_75)] py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.16em] text-primary">Free tools</p>
            <h2 className="mt-1 text-3xl">{compact ? "Author tools" : "Make a barcode, a cover, a page, a file"}</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              No account. Use what you need, then take the file away. The e-book reader sits beside these tools — it is not mixed into the nav.
            </p>
          </div>
          {compact && (
            <Link href="/tools" className={cn(buttonVariants({ variant: "outline" }))}>
              All tools
            </Link>
          )}
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {tools.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={cn("group flex gap-4 rounded-2xl p-5 ring-1 ring-foreground/10 transition hover:-translate-y-0.5 hover:shadow-md", t.tone)}
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-primary shadow-sm">
                <t.icon className="size-6" />
              </span>
              <span>
                <h3 className="text-xl">{t.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.body}</p>
                <span className="mt-3 inline-flex text-sm font-medium text-primary group-hover:underline">Open tool</span>
              </span>
            </Link>
          ))}
        </div>

        <Link
          href="/reader"
          className="mt-5 flex flex-col gap-4 rounded-2xl bg-primary p-6 text-primary-foreground shadow-sm transition hover:bg-primary/90 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <BookOpen className="size-6" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-primary-foreground/80">Separate tool</p>
              <h3 className="text-2xl">E-book reader</h3>
              <p className="mt-1 max-w-xl text-sm text-primary-foreground/85">
                Open an EPUB on cream paper. Type stays type. This browser remembers where you stopped.
              </p>
            </div>
          </div>
          <span className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "shrink-0")}>Open reader</span>
        </Link>

        <div id="coming-soon" className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-dashed bg-background/60 p-5">
            <Type className="size-5 text-muted-foreground" />
            <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">Coming soon</p>
            <h3 className="mt-1 text-xl">Typesetter</h3>
            <p className="mt-1 text-sm text-muted-foreground">Interior pages and running heads. Not ready yet.</p>
          </div>
          <div className="rounded-2xl border border-dashed bg-background/60 p-5">
            <Mic className="size-5 text-muted-foreground" />
            <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">Coming soon</p>
            <h3 className="mt-1 text-xl">Audiobook maker</h3>
            <p className="mt-1 text-sm text-muted-foreground">Narration and chapter markers. Not ready yet.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
