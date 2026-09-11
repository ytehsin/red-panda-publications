"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function HireForm() {
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "hire",
        payload: Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)])),
      }),
    });
    setBusy(false);
    if (!res.ok) toast.error("Could not send.");
    else {
      toast.success("Received. We will reply from the Red Panda desk.");
      e.currentTarget.reset();
    }
  }
  return (
    <form onSubmit={onSubmit} className="mt-10 space-y-3 rounded-2xl border bg-muted/30 p-6">
      <h2 className="text-xl">Ask for a quote</h2>
      <div>
        <Label htmlFor="h-name">Name</Label>
        <Input id="h-name" name="name" required />
      </div>
      <div>
        <Label htmlFor="h-phone">Contact number</Label>
        <Input id="h-phone" name="phone" required />
      </div>
      <div>
        <Label htmlFor="h-note">Which stages?</Label>
        <Textarea id="h-note" name="note" required placeholder="Editing, translation into Spanish, print run of 300…" />
      </div>
      <Button type="submit" disabled={busy}>
        Send details
      </Button>
    </form>
  );
}
