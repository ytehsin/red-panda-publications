"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function ContactPage() {
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "contact",
        payload: Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)])),
      }),
    });
    setBusy(false);
    if (!res.ok) toast.error("Could not send.");
    else {
      toast.success("Message received.");
      e.currentTarget.reset();
    }
  }
  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 md:grid-cols-2">
      <div>
        <p className="text-sm uppercase tracking-[0.16em] text-primary">The office</p>
        <h1 className="mt-1 text-4xl">Contact us</h1>
        <p className="mt-3 text-muted-foreground">
          Write, call, or use the form. The house desk chatbot on every page answers the short questions; this form is for everything else.
        </p>
        <address className="mt-6 not-italic text-sm leading-7">
          Red Panda Publications
          <br />
          18 Rustleaf Road, Suite 4
          <br />
          San Francisco, CA 94110
          <br />
          hello@redpandapublications.com
          <br />
          +1 (415) 555-0148
        </address>
      </div>
      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border bg-card p-6">
        <div>
          <Label htmlFor="c-name">Name</Label>
          <Input id="c-name" name="name" required />
        </div>
        <div>
          <Label htmlFor="c-phone">Contact number</Label>
          <Input id="c-phone" name="phone" required />
        </div>
        <div>
          <Label htmlFor="c-msg">Message</Label>
          <Textarea id="c-msg" name="message" required className="min-h-32" />
        </div>
        <Button type="submit" disabled={busy}>
          Send
        </Button>
      </form>
    </div>
  );
}
