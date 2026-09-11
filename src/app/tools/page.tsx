import { ToolsShowcase } from "@/components/tools-showcase";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Free tools" };

export default function ToolsPage() {
  return (
    <div className="pb-8">
      <div className="mx-auto max-w-6xl px-4 pt-12">
        <p className="text-sm uppercase tracking-[0.16em] text-primary">Author bench</p>
        <h1 className="mt-1 text-4xl">Free tools</h1>
      </div>
      <ToolsShowcase />
    </div>
  );
}
