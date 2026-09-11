import { notFound } from "next/navigation";
import Image from "next/image";
import { getCachedSite } from "@/lib/site";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = await getCachedSite();
  const post = site.blog.find((p) => p.slug === slug);
  return { title: post?.title || "Post" };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getCachedSite();
  const post = site.blog.find((p) => p.slug === slug);
  if (!post) notFound();
  return (
    <article className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-sm text-muted-foreground">{post.date}</p>
      <h1 className="mt-2 text-4xl">{post.title}</h1>
      <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
        <Image src={post.cover} alt="" fill className="object-cover" />
      </div>
      <div className="mt-8 space-y-4 whitespace-pre-wrap text-lg leading-relaxed">{post.body}</div>
    </article>
  );
}
