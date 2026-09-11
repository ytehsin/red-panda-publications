"use client";

import { useMemo, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import type { Faq } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Msg = { role: "bot" | "you"; text: string };

export function Chatbot({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "bot",
      text: "Hello from the Red Panda desk. Ask about free reading, PDFs, print, or pick a question below.",
    },
  ]);

  const match = useMemo(() => {
    return (q: string) => {
      const needle = q.toLowerCase();
      const scored = faqs
        .map((f) => {
          const hay = `${f.question} ${f.answer}`.toLowerCase();
          const hits = needle.split(/\s+/).filter((w) => w.length > 2 && hay.includes(w)).length;
          return { f, hits };
        })
        .sort((a, b) => b.hits - a.hits);
      if (scored[0] && scored[0].hits > 0) return scored[0].f;
      return null;
    };
  }, [faqs]);

  function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const found = faqs.find((f) => f.question === trimmed) || match(trimmed);
    const reply = found
      ? found.answer
      : "I do not have that yet. Write to hello@redpandapublications.com, or use Contact us. Editors add FAQs from the dashboard.";
    setMessages((m) => [...m, { role: "you", text: trimmed }, { role: "bot", text: reply }]);
    setInput("");
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2" data-chatbot>
      {open && (
        <div className="w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border bg-card shadow-xl">
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <p className="text-sm font-medium">Ask us</p>
            <button type="button" aria-label="Close chat" onClick={() => setOpen(false)}>
              <X className="size-4" />
            </button>
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto p-3 text-sm">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "bot"
                    ? "rounded-xl bg-muted px-3 py-2"
                    : "ml-8 rounded-xl bg-secondary px-3 py-2"
                }
              >
                {m.text}
              </div>
            ))}
            <div className="flex flex-wrap gap-1 pt-1">
              {faqs.slice(0, 4).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className="rounded-full border bg-background px-2 py-1 text-left text-[11px] leading-snug hover:bg-muted"
                  onClick={() => ask(f.question)}
                >
                  {f.question}
                </button>
              ))}
            </div>
          </div>
          <form
            className="flex gap-2 border-t p-2"
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question"
              aria-label="Chat question"
            />
            <Button type="submit" size="icon" aria-label="Send">
              <Send />
            </Button>
          </form>
        </div>
      )}
      <Button size="lg" className="rounded-full shadow-lg" onClick={() => setOpen((v) => !v)}>
        <MessageCircle /> Chat
      </Button>
    </div>
  );
}
