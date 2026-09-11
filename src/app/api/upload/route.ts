import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { isAdmin } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const form = await request.formData();
  const file = form.get("file");
  const folder = String(form.get("folder") || "uploads");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }
  const ext = path.extname(file.name).toLowerCase() || ".png";
  const allowed = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".epub"];
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
  }
  const safeFolder = ["covers", "banners", "uploads", "epubs"].includes(folder) ? folder : "uploads";
  const dir = path.join(process.cwd(), "public", safeFolder);
  await fs.mkdir(dir, { recursive: true });
  const name = `${randomUUID()}${ext}`;
  await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/${safeFolder}/${name}` });
}
