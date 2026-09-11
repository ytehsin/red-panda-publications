import { promises as fs } from "fs";
import path from "path";
import { unstable_cache } from "next/cache";
import type { Inquiry, SiteData } from "./types";

const dataDir = path.join(process.cwd(), "data");
const sitePath = path.join(dataDir, "site.json");
const inquiriesPath = path.join(dataDir, "inquiries.json");

export async function readSite(): Promise<SiteData> {
  const raw = await fs.readFile(sitePath, "utf8");
  return JSON.parse(raw) as SiteData;
}

export const getCachedSite = unstable_cache(readSite, ["site-data"], {
  tags: ["site-data"],
  revalidate: 60,
});

export async function writeSite(data: SiteData) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(sitePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

export async function readInquiries(): Promise<Inquiry[]> {
  try {
    const raw = await fs.readFile(inquiriesPath, "utf8");
    return JSON.parse(raw) as Inquiry[];
  } catch {
    return [];
  }
}

export async function addInquiry(inquiry: Inquiry) {
  const all = await readInquiries();
  all.unshift(inquiry);
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(inquiriesPath, JSON.stringify(all, null, 2) + "\n", "utf8");
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}
