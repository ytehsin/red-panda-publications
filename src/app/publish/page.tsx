"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function PublishPage() {
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "publish",
        payload: Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)])),
      }),
    });
    setBusy(false);
    if (!res.ok) toast.error("Could not send.");
    else {
      toast.success("Details received. We will be in touch.");
      e.currentTarget.reset();
    }
  }
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <p className="text-sm uppercase tracking-[0.16em] text-primary">Submissions</p>
      <h1 className="mt-1 text-4xl">Publish with us?</h1>
      <p className="mt-3 text-muted-foreground">
        Three small fields. We do not want the manuscript in this first note — only whether the book is yours to offer.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border bg-card p-6">
        <div>
          <Label htmlFor="title">Book title</Label>
          <Input id="title" name="title" required placeholder="The Migration Clock" />
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Do you own it?</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="owns" value="yes" required defaultChecked /> Yes — I hold the rights
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="owns" value="no" /> No / not sure
          </label>
        </fieldset>
        <div>
          <Label htmlFor="phone">Contact number</Label>
          <Input id="phone" name="phone" required placeholder="+1 …" />
        </div>
        <Button type="submit" disabled={busy}>
          Send details
        </Button>
      </form>
    </div>
  );
}
