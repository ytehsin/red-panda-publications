import { NextResponse } from "next/server";
import { convertPdfToEpub } from "@/lib/pdf-to-epub";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Attach a PDF." }, { status: 400 });
  }
  if (file.size > 55 * 1024 * 1024) {
    return NextResponse.json({ error: "PDF is larger than 55 MB." }, { status: 413 });
  }
  const title = String(form.get("title") || "").trim();
  const author = String(form.get("author") || "").trim();
  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    const result = await convertPdfToEpub(bytes, {
      title: title || undefined,
      author: author || undefined,
      pagesPerChapter: 12,
    });
    return new NextResponse(new Uint8Array(result.epub), {
      headers: {
        "Content-Type": "application/epub+zip",
        "Content-Disposition": `attachment; filename="${slug(result.title)}.epub"`,
        "X-Convert-Report": Buffer.from(JSON.stringify(result.report)).toString("base64"),
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Conversion failed." },
      { status: 500 }
    );
  }
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "book";
}
