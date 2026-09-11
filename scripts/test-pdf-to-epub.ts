import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { convertPdfToEpub } from "../src/lib/pdf-to-epub";
import JSZip from "jszip";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

async function makeFixture(pages: number, columns = false) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const unique = `UNIQUE_TOKEN_${pages}_${columns ? "COL" : "ONE"}`;

  for (let i = 1; i <= pages; i++) {
    const page = doc.addPage([612, 792]);
    page.drawText(`Chapter heading on page ${i}`, {
      x: 72,
      y: 720,
      size: 18,
      font: bold,
      color: rgb(0.55, 0.22, 0.12),
    });
    if (columns) {
      const left = `Left column page ${i}. The pigeon returned at dusk. ${unique} sits in the left gutter so we can prove order.`;
      const right = `Right column page ${i}. Terracotta roofs held the last light. Column integrity matters for long books.`;
      page.drawText(wrap(left, 28), { x: 54, y: 660, size: 11, font, lineHeight: 14 });
      page.drawText(wrap(right, 28), { x: 320, y: 660, size: 11, font, lineHeight: 14 });
    } else {
      const body = `Page ${i} of a Red Panda specimen. ${i === 1 ? unique : "The homing bird knew the cream-coloured house."} Paragraph two continues without distortion so a two-hundred page conversion still reads as a book, not a pile of screenshots.`;
      page.drawText(wrap(body, 78), { x: 72, y: 680, size: 12, font, lineHeight: 16 });
      page.drawText(wrap("A second paragraph follows the first with a proper break, the way a typesetter would expect.", 78), {
        x: 72,
        y: 600,
        size: 12,
        font,
        lineHeight: 16,
      });
    }
  }
  return { bytes: await doc.save(), unique };
}

function wrap(text: string, width: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length > width) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines.join("\n");
}

async function unzipText(epub: Uint8Array) {
  const zip = await JSZip.loadAsync(epub);
  const names = Object.keys(zip.files);
  const xhtml = names.filter((n) => n.endsWith(".xhtml") && n.includes("chapters"));
  let text = "";
  for (const n of xhtml.sort()) {
    text += await zip.files[n].async("string");
  }
  return { zip, names, text };
}

async function run() {
  const results: string[] = [];

  const small = await makeFixture(8, false);
  const smallOut = await convertPdfToEpub(small.bytes, { title: "Small flock", author: "Test" });
  const smallZip = await unzipText(smallOut.epub);
  assert(smallZip.names[0] === "mimetype", "mimetype must be first zip entry");
  assert(smallZip.names.includes("META-INF/container.xml"), "container.xml missing");
  assert(smallZip.names.includes("OEBPS/content.opf"), "OPF missing");
  assert(smallZip.text.includes(small.unique), "unique token missing from small book");
  assert(smallOut.report.pageCount === 8, `expected 8 pages, got ${smallOut.report.pageCount}`);
  assert(smallOut.report.wordCount > 80, "word count too low on small book");
  results.push(`small: pages=${smallOut.report.pageCount} words=${smallOut.report.wordCount} ms=${smallOut.report.elapsedMs}`);

  const cols = await makeFixture(6, true);
  const colOut = await convertPdfToEpub(cols.bytes, { title: "Columns", pagesPerChapter: 3 });
  const colZip = await unzipText(colOut.epub);
  assert(colZip.text.includes(cols.unique), "column unique token missing");
  assert(colZip.text.indexOf("Left column") < colZip.text.indexOf("Right column"), "left column should precede right");
  assert(colOut.report.chapterCount === 2, `expected 2 chapters, got ${colOut.report.chapterCount}`);
  results.push(`columns: columnPages=${colOut.report.columnPages} chapters=${colOut.report.chapterCount}`);

  const large = await makeFixture(200, false);
  const largeOut = await convertPdfToEpub(large.bytes, { title: "Two hundred pages", pagesPerChapter: 20 });
  const largeZip = await unzipText(largeOut.epub);
  assert(largeOut.report.pageCount === 200, `expected 200 pages, got ${largeOut.report.pageCount}`);
  assert(largeZip.text.includes("Page 200"), "page 200 missing");
  assert(largeZip.text.includes("Page 1"), "page 1 missing");
  assert(largeZip.text.includes(large.unique), "unique token missing from 200-page book");
  assert(!/Page 201/.test(largeZip.text), "phantom extra page");
  const pageMarks = (largeZip.text.match(/class="folio">Page /g) || []).length;
  assert(pageMarks === 200, `folio count ${pageMarks} !== 200`);
  assert(largeOut.report.chapterCount === 10, `expected 10 chapters, got ${largeOut.report.chapterCount}`);
  results.push(
    `large: pages=${largeOut.report.pageCount} chapters=${largeOut.report.chapterCount} words=${largeOut.report.wordCount} ms=${largeOut.report.elapsedMs} warnings=${largeOut.report.warnings.length}`
  );

  console.log("PDF → EPUB tests passed");
  for (const line of results) console.log(" -", line);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
