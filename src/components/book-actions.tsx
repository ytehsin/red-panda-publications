"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Book } from "@/lib/types";
import { money } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { grantEntitlement } from "@/lib/entitlements";
import { toast } from "sonner";

export function BookActions({ book }: { book: Book }) {
  const router = useRouter();
  const [format, setFormat] = useState<"reader" | "pdf" | "print" | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  const price =
    format === "reader" ? book.readerPrice : format === "pdf" ? book.pdfPrice : format === "print" ? book.printPrice : 0;

  async function submit() {
    if (!format) return;
    if (!name.trim() || !phone.trim()) {
      toast.error("Name and contact number, please.");
      return;
    }
    setBusy(true);
    try {
      if (format === "reader" && book.access === "free") {
        grantEntitlement(book.id, "reader");
        router.push(`/reader?book=${book.slug}`);
        return;
      }
      await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "order",
          payload: {
            book: book.title,
            slug: book.slug,
            format,
            price: String(price),
            name,
            phone,
          },
        }),
      });
      if (format === "reader") {
        grantEntitlement(book.id, "reader");
        toast.success("Reader access noted. Opening the book.");
        router.push(`/reader?book=${book.slug}`);
        return;
      }
      grantEntitlement(book.id, format);
      toast.success(
        format === "pdf"
          ? "PDF order received. We will send a download link."
          : "Print order received. We will confirm paper and postage."
      );
      setFormat(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Button
          variant={book.access === "free" ? "default" : "secondary"}
          onClick={() => {
            if (book.access === "free") {
              grantEntitlement(book.id, "reader");
              router.push(`/reader?book=${book.slug}`);
            } else setFormat("reader");
          }}
        >
          {book.access === "free" ? "Read free" : `Read · ${money(book.readerPrice)}`}
        </Button>
        <Button variant="outline" onClick={() => setFormat("pdf")}>
          Download PDF · {money(book.pdfPrice)}
        </Button>
        <Button variant="outline" onClick={() => setFormat("print")}>
          Order printed edition · {money(book.printPrice)}
        </Button>
      </div>
      {format && !(format === "reader" && book.access === "free") && (
        <div className="rounded-2xl border bg-muted/40 p-4">
          <p className="text-sm font-medium">
            {format === "reader" && "Paid reader access"}
            {format === "pdf" && "PDF licence — not included with free reading"}
            {format === "print" && "Printed paper copy"}
            <span className="ml-2 text-primary">{money(price)}</span>
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="order-name">Name</Label>
              <Input id="order-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="order-phone">Contact number</Label>
              <Input id="order-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={submit} disabled={busy}>
              Send details
            </Button>
            <Button variant="ghost" onClick={() => setFormat(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
