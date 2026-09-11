import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { ADMIN_COOKIE, adminPassword, isAdmin, signAdminToken } from "@/lib/auth";
import { readInquiries, readSite, writeSite } from "@/lib/site";
import type { SiteData } from "@/lib/types";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [site, inquiries] = await Promise.all([readSite(), readInquiries()]);
  return NextResponse.json({ site, inquiries });
}

export async function PUT(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const site = (await request.json()) as SiteData;
  if (!site?.house || !Array.isArray(site.books) || !Array.isArray(site.banners)) {
    return NextResponse.json({ error: "Invalid site payload." }, { status: 400 });
  }
  await writeSite(site);
  revalidateTag("site-data");
  revalidatePath("/");
  revalidatePath("/books");
  revalidatePath("/blog");
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const { password } = (await request.json()) as { password?: string };
  if (!password || password !== adminPassword()) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, signAdminToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  return NextResponse.json({ ok: true });
}
