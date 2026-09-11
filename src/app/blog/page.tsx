import Link from "next/link";
import Image from "next/image";
import { getCachedSite } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Blog" };

export default async function BlogPage() {
  const site = await getCachedSite();
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <p className="text-sm uppercase tracking-[0.16em] text-primary">From the house</p>
      <h1 className="mt-1 text-4xl">Blog</h1>
      <div className="mt-10 space-y-8">
        {site.blog.length === 0 && <p className="text-muted-foreground">No posts yet. Add them in the dashboard.</p>}
        {site.blog.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="flex gap-5 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 hover:shadow-md">
            <div className="relative hidden size-28 shrink-0 overflow-hidden rounded-xl sm:block">
              <Image src={post.cover} alt="" fill className="object-cover" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{post.date}</p>
              <h2 className="mt-1 text-2xl">{post.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{post.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
