import { HireForm } from "@/components/hire-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Hire us" };

const services = [
  {
    title: "Manuscript assessment",
    body: "A written report on structure, voice, and market fit before anyone marks the pages. Useful when you are not sure the draft is ready for a full edit.",
  },
  {
    title: "Developmental editing",
    body: "Chapter-level work: argument, plot, pacing, and what to cut. We stay with the book until the spine of it is clear.",
  },
  {
    title: "Copyediting and proofreading",
    body: "Line, grammar, consistency, and a last pass on the typeset pages. Two different jobs; we price them as such.",
  },
  {
    title: "Cover and interior design",
    body: "Trim size, type, margins, and a cover that can sit beside international lists without looking like a template.",
  },
  {
    title: "ISBN, barcode, and imprint",
    body: "Numbers, EAN-13 artwork, and a copyright page that names the house correctly.",
  },
  {
    title: "Printing",
    body: "Short-run and print-on-demand paperbacks and casebound copies. Cream stock by default. We manage files to the bindery.",
  },
  {
    title: "Distribution",
    body: "Metadata, trade channels, and a page on our own list if the title belongs here.",
  },
  {
    title: "Multilingual translation",
    body: "Literary and commercial translation, then a second editor in the target language. We can take that edition through print as well — manuscript to printed book in more than one tongue.",
  },
  {
    title: "Launch and publicity",
    body: "A brief plan: advance copies, a page, a date. We do not promise a bestseller. We do send the book into the world properly dressed.",
  },
];

export default function HirePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-sm uppercase tracking-[0.16em] text-primary">From manuscript to printed book</p>
      <h1 className="mt-1 text-4xl">Hire us?</h1>
      <p className="mt-3 text-muted-foreground">
        Open a drop-down for a brief note on each stage, then send a quote request. Translation is part of the same path.
      </p>
      <div className="mt-8 divide-y rounded-2xl border bg-card">
        {services.map((s) => (
          <details key={s.title} className="group px-4 py-1">
            <summary className="cursor-pointer list-none py-3 font-medium marker:content-none after:float-right after:text-muted-foreground after:content-['+'] group-open:after:content-['–']">
              {s.title}
            </summary>
            <p className="pb-3 text-sm text-muted-foreground">{s.body}</p>
          </details>
        ))}
      </div>
      <HireForm />
    </div>
  );
}
