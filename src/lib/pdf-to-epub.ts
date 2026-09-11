import JSZip from "jszip";
import { PNG } from "pngjs";

type ConvertOptions = {
  title?: string;
  author?: string;
  language?: string;
  pagesPerChapter?: number;
};

export type ConvertReport = {
  pageCount: number;
  chapterCount: number;
  imageCount: number;
  wordCount: number;
  columnPages: number;
  warnings: string[];
  elapsedMs: number;
};

export type ConvertResult = {
  epub: Uint8Array;
  report: ConvertReport;
  title: string;
};

type Line = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
};

type Block =
  | { kind: "heading" | "paragraph"; text: string; fontSize: number }
  | { kind: "image"; href: string; width: number; height: number };

type PageContent = {
  pageNumber: number;
  width: number;
  height: number;
  blocks: Block[];
  columns: number;
  words: number;
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function median(values: number[]) {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function clusterColumns(xs: number[], pageWidth: number) {
  if (xs.length < 8) return [0];
  const sorted = [...xs].sort((a, b) => a - b);
  const gaps: { i: number; gap: number; x: number }[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i] - sorted[i - 1];
    if (gap > pageWidth * 0.12) gaps.push({ i, gap, x: (sorted[i - 1] + sorted[i]) / 2 });
  }
  if (!gaps.length) return [0];
  gaps.sort((a, b) => b.gap - a.gap);
  const split = gaps[0].x;
  const left = xs.filter((x) => x < split).length;
  const right = xs.length - left;
  if (left < 4 || right < 4) return [0];
  return [0, split];
}

function itemsToLines(
  items: {
    str: string;
    x: number;
    y: number;
    w: number;
    h: number;
    fontSize: number;
    fontName: string;
  }[]
) {
  const usable = items.filter((i) => i.str.trim().length || i.str === " ");
  usable.sort((a, b) => a.y - b.y || a.x - b.x);
  const lines: Line[] = [];
  for (const item of usable) {
    const last = lines[lines.length - 1];
    const sameLine =
      last &&
      Math.abs(item.y - last.y) < Math.max(item.fontSize, last.height) * 0.45 &&
      item.x >= last.x - 2;
    if (!sameLine) {
      lines.push({
        text: item.str,
        x: item.x,
        y: item.y,
        width: item.w,
        height: item.h || item.fontSize,
        fontSize: item.fontSize,
        fontName: item.fontName,
      });
      continue;
    }
    const gap = item.x - (last.x + last.width);
    const space = gap > item.fontSize * 0.18 ? " " : "";
    last.text += space + item.str;
    last.width = item.x + item.w - last.x;
    last.height = Math.max(last.height, item.h);
    last.fontSize = Math.max(last.fontSize, item.fontSize);
  }
  return lines.map((l) => ({ ...l, text: l.text.replace(/\s+/g, " ").trim() })).filter((l) => l.text);
}

function linesToBlocks(lines: Line[], images: Block[]): Block[] {
  if (!lines.length) return images;
  const sizes = lines.map((l) => l.fontSize);
  const base = median(sizes) || 12;
  const blocks: Block[] = [];
  let para: string[] = [];
  let paraSize = base;

  const flush = (asHeading = false) => {
    const text = para.join(" ").replace(/\s+/g, " ").trim();
    para = [];
    if (!text) return;
    blocks.push({
      kind: asHeading || text.length < 80 && paraSize > base * 1.22 ? "heading" : "paragraph",
      text,
      fontSize: paraSize,
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = lines[i + 1];
    const isHeading =
      line.fontSize > base * 1.28 ||
      /bold|black|heavy|semibold/i.test(line.fontName);
    const gap = next ? next.y - (line.y + line.height) : 999;
    const endsSentence = /[.!?:]"?$/.test(line.text);
    const short = line.text.length < 48;

    if (isHeading && short) {
      flush();
      blocks.push({ kind: "heading", text: line.text, fontSize: line.fontSize });
      continue;
    }

    para.push(line.text);
    paraSize = Math.max(paraSize, line.fontSize);
    const hardBreak = !next || gap > line.height * 0.85 || (endsSentence && gap > line.height * 0.35);
    if (hardBreak) flush();
  }
  flush();
  return [...images, ...blocks];
}

function rgbToPng(width: number, height: number, data: Uint8Array, channels: number) {
  const png = new PNG({ width, height });
  for (let i = 0, p = 0; i < width * height; i++) {
    if (channels === 1) {
      const v = data[i];
      png.data[p++] = v;
      png.data[p++] = v;
      png.data[p++] = v;
      png.data[p++] = 255;
    } else if (channels === 3) {
      png.data[p++] = data[i * 3];
      png.data[p++] = data[i * 3 + 1];
      png.data[p++] = data[i * 3 + 2];
      png.data[p++] = 255;
    } else {
      png.data[p++] = data[i * 4];
      png.data[p++] = data[i * 4 + 1];
      png.data[p++] = data[i * 4 + 2];
      png.data[p++] = data[i * 4 + 3];
    }
  }
  return PNG.sync.write(png);
}

async function extractImages(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdfjs: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  pageNumber: number,
  zip: JSZip,
  warnings: string[]
) {
  const blocks: Block[] = [];
  try {
    const ops = await page.getOperatorList();
    const names = new Set<string>();
    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i];
      if (
        fn === pdfjs.OPS.paintImageXObject ||
        fn === pdfjs.OPS.paintInlineImageXObject ||
        fn === pdfjs.OPS.paintJpegXObject ||
        fn === pdfjs.OPS.paintImageXObjectRepeat
      ) {
        const name = ops.argsArray[i]?.[0];
        if (typeof name === "string") names.add(name);
      }
    }
    let index = 0;
    for (const name of names) {
      const img = await new Promise<Record<string, unknown> | null>((resolve) => {
        try {
          if (page.objs.has(name)) {
            page.objs.get(name, (v: Record<string, unknown>) => resolve(v));
            return;
          }
          if (page.commonObjs?.has?.(name)) {
            page.commonObjs.get(name, (v: Record<string, unknown>) => resolve(v));
            return;
          }
        } catch {
          resolve(null);
          return;
        }
        setTimeout(() => resolve(null), 40);
      });
      if (!img) continue;
      const width = Number(img.width) || 0;
      const height = Number(img.height) || 0;
      const data = img.data as Uint8ClampedArray | Uint8Array | undefined;
      if (!width || !height || !data) continue;
      if (width < 24 || height < 24) continue;
      const kind = Number(img.kind) || 0;
      const channels = kind === 1 ? 1 : kind === 3 ? 4 : 3;
      try {
        const png = rgbToPng(width, height, Uint8Array.from(data), channels);
        index += 1;
        const href = `images/p${pageNumber}-${index}.png`;
        zip.file(`OEBPS/${href}`, png);
        blocks.push({ kind: "image", href, width, height });
      } catch (err) {
        warnings.push(`Skipped image on page ${pageNumber}: ${(err as Error).message}`);
      }
    }
  } catch (err) {
    warnings.push(`Image pass failed on page ${pageNumber}: ${(err as Error).message}`);
  }
  return blocks;
}

function chapterXhtml(title: string, pages: PageContent[]) {
  const body = pages
    .map((page) => {
      const inner = page.blocks
        .map((block) => {
          if (block.kind === "image") {
            const w = Math.min(480, block.width);
            return `<figure class="fig"><img src="../${block.href}" alt="" width="${w}" /></figure>`;
          }
          const tag = block.kind === "heading" ? "h2" : "p";
          return `<${tag}>${escapeXml(block.text)}</${tag}>`;
        })
        .join("\n");
      return `<section class="page" id="page-${page.pageNumber}" epub:type="bodymatter">
<p class="folio">Page ${page.pageNumber}</p>
${inner || `<p class="empty">[No extractable text on page ${page.pageNumber}]</p>`}
</section>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${escapeXml(title)}</title>
  <link rel="stylesheet" href="style.css"/>
</head>
<body>
${body}
</body>
</html>`;
}

const CSS = `body{font-family:Palatino,"Palatino Linotype",Georgia,serif;line-height:1.55;margin:1.2em 1.4em;color:#222;background:#fffef8;}
h1,h2{font-family:"Iowan Old Style",Georgia,serif;font-weight:600;line-height:1.25;page-break-after:avoid;}
p{margin:0 0 .7em;text-align:justify;hyphens:auto;-webkit-hyphens:auto;}
.folio{font-size:.75em;color:#8a6a4a;letter-spacing:.08em;text-transform:uppercase;text-align:center;margin:1.4em 0 .8em;}
.fig{margin:1em auto;text-align:center;page-break-inside:avoid;}
.fig img{max-width:100%;height:auto;}
.empty{color:#777;font-style:italic;}
.page{break-inside:auto;}
`;

export async function convertPdfToEpub(pdfBytes: Uint8Array, options: ConvertOptions = {}): Promise<ConvertResult> {
  const started = Date.now();
  const warnings: string[] = [];
  const { pdfjs, cMapUrl, standardFontDataUrl } = await loadPdfjs();

  const loadingTask = pdfjs.getDocument({
    data: pdfBytes,
    cMapUrl,
    cMapPacked: true,
    standardFontDataUrl,
    useSystemFonts: true,
    disableAutoFetch: true,
    disableStream: true,
  });
  const doc = await loadingTask.promise;
  const meta = await doc.getMetadata().catch(() => null);
  const info = (meta?.info || {}) as Record<string, string>;
  const title = options.title || info.Title || "Converted book";
  const author = options.author || info.Author || "Unknown author";
  const language = options.language || "en";
  const pagesPerChapter = options.pagesPerChapter || 12;

  const zip = new JSZip();
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.folder("META-INF");
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );
  zip.file("OEBPS/style.css", CSS);

  const pages: PageContent[] = [];
  let imageCount = 0;
  let wordCount = 0;
  let columnPages = 0;

  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent({ includeMarkedContent: true });
    const items = [];
    for (const raw of textContent.items) {
      if (!("str" in raw) || !raw.str) continue;
      const t = raw.transform;
      const [x, y] = viewport.convertToViewportPoint(t[4], t[5]);
      const fontSize = Math.hypot(t[0], t[1]);
      items.push({
        str: raw.str,
        x,
        y,
        w: (raw.width || 0) * (viewport.scale || 1),
        h: (raw.height || fontSize) * (viewport.scale || 1),
        fontSize,
        fontName: raw.fontName || "",
      });
    }

    const xs = items.map((i) => i.x);
    const colStarts = clusterColumns(xs, viewport.width);
    const columns = Math.max(1, colStarts.length);
    if (columns > 1) columnPages += 1;

    const images = await extractImages(pdfjs, page, n, zip, warnings);
    imageCount += images.length;

    const grouped: typeof items[] = colStarts.map(() => []);
    if (columns === 1) grouped[0] = items;
    else {
      for (const item of items) {
        let col = 0;
        for (let c = 1; c < colStarts.length; c++) {
          if (item.x >= colStarts[c]) col = c;
        }
        grouped[col].push(item);
      }
    }

    const blocks: Block[] = [...images];
    for (const colItems of grouped) {
      const lines = itemsToLines(colItems);
      blocks.push(...linesToBlocks(lines, []));
    }

    const words = blocks
      .filter((b): b is Extract<Block, { kind: "paragraph" | "heading" }> => b.kind !== "image")
      .reduce((sum, b) => sum + b.text.split(/\s+/).filter(Boolean).length, 0);
    wordCount += words;
    pages.push({
      pageNumber: n,
      width: viewport.width,
      height: viewport.height,
      blocks,
      columns,
      words,
    });
    page.cleanup();
  }

  const pdfDoc = doc as { destroy?: () => void; cleanup?: () => void };
  try {
    pdfDoc.destroy?.();
    pdfDoc.cleanup?.();
  } catch {
    /* pdf.js version differences */
  }

  const chapters: PageContent[][] = [];
  for (let i = 0; i < pages.length; i += pagesPerChapter) {
    chapters.push(pages.slice(i, i + pagesPerChapter));
  }

  const manifestItems: string[] = [
    `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `<item id="css" href="style.css" media-type="text/css"/>`,
  ];
  const spine: string[] = [];
  const navLis: string[] = [];

  chapters.forEach((chunk, idx) => {
    const id = `ch${idx + 1}`;
    const href = `chapters/${id}.xhtml`;
    const label = `Pages ${chunk[0].pageNumber}–${chunk[chunk.length - 1].pageNumber}`;
    zip.file(`OEBPS/${href}`, chapterXhtml(label, chunk));
    manifestItems.push(
      `<item id="${id}" href="${href}" media-type="application/xhtml+xml"/>`
    );
    spine.push(`<itemref idref="${id}"/>`);
    navLis.push(`<li><a href="${href}">${escapeXml(label)}</a></li>`);
  });

  const imageFiles = Object.keys(zip.files).filter((f) => f.startsWith("OEBPS/images/"));
  imageFiles.forEach((file, i) => {
    manifestItems.push(
      `<item id="img${i + 1}" href="${file.replace("OEBPS/", "")}" media-type="image/png"/>`
    );
  });

  const bookId = `urn:uuid:${globalThis.crypto.randomUUID()}`;
  const modified = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  zip.file(
    "OEBPS/content.opf",
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${bookId}</dc:identifier>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>${escapeXml(author)}</dc:creator>
    <dc:language>${escapeXml(language)}</dc:language>
    <meta property="dcterms:modified">${modified}</meta>
    <meta name="cover" content="img1"/>
  </metadata>
  <manifest>
    ${manifestItems.join("\n    ")}
  </manifest>
  <spine>
    ${spine.join("\n    ")}
  </spine>
</package>`
  );

  zip.file(
    "OEBPS/nav.xhtml",
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en">
<head><meta charset="utf-8"/><title>Contents</title><link rel="stylesheet" href="style.css"/></head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>${escapeXml(title)}</h1>
    <ol>
      ${navLis.join("\n      ")}
    </ol>
  </nav>
</body>
</html>`
  );

  const epub = await zip.generateAsync({
    type: "uint8array",
    mimeType: "application/epub+zip",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return {
    epub,
    title,
    report: {
      pageCount: pages.length,
      chapterCount: chapters.length,
      imageCount,
      wordCount,
      columnPages,
      warnings,
      elapsedMs: Date.now() - started,
    },
  };
}

export async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const version = pdfjs.version || "6.3.289";
  if (typeof window !== "undefined") {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/legacy/build/pdf.worker.min.mjs`;
    return {
      pdfjs,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${version}/cmaps/`,
      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${version}/standard_fonts/`,
    };
  }
  const path = await import("node:path");
  const { pathToFileURL } = await import("node:url");
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
    path.join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs")
  ).href;
  return {
    pdfjs,
    cMapUrl: pathToFileURL(path.join(process.cwd(), "node_modules/pdfjs-dist/cmaps/")).href,
    standardFontDataUrl: pathToFileURL(path.join(process.cwd(), "node_modules/pdfjs-dist/standard_fonts/")).href,
  };
}

export function hashBytes(bytes: Uint8Array) {
  let h = 0;
  for (let i = 0; i < bytes.length; i++) h = (h * 31 + bytes[i]) | 0;
  return String(h);
}
