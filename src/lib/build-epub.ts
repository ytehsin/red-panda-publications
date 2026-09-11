import JSZip from "jszip";

export async function buildSimpleEpub(opts: {
  title: string;
  author: string;
  chapters: { title: string; paragraphs: string[] }[];
}) {
  const zip = new JSZip();
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );
  zip.file(
    "OEBPS/style.css",
    `body{font-family:Georgia,serif;line-height:1.6;margin:1.25em;background:#fffef8;color:#2b2118;}
h1{font-size:1.6em;}p{margin:0 0 .8em;text-align:justify;}`
  );

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const manifest: string[] = [
    `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `<item id="css" href="style.css" media-type="text/css"/>`,
  ];
  const spine: string[] = [];
  const nav: string[] = [];

  opts.chapters.forEach((ch, i) => {
    const id = `ch${i + 1}`;
    const href = `chapters/${id}.xhtml`;
    const paras = ch.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("\n");
    zip.file(
      `OEBPS/${href}`,
      `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head><title>${esc(ch.title)}</title><link rel="stylesheet" href="../style.css"/></head>
<body><h1>${esc(ch.title)}</h1>${paras}</body></html>`
    );
    manifest.push(`<item id="${id}" href="${href}" media-type="application/xhtml+xml"/>`);
    spine.push(`<itemref idref="${id}"/>`);
    nav.push(`<li><a href="${href}">${esc(ch.title)}</a></li>`);
  });

  zip.file(
    "OEBPS/content.opf",
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">urn:uuid:${crypto.randomUUID()}</dc:identifier>
    <dc:title>${esc(opts.title)}</dc:title>
    <dc:creator>${esc(opts.author)}</dc:creator>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z$/, "Z")}</meta>
  </metadata>
  <manifest>${manifest.join("")}</manifest>
  <spine>${spine.join("")}</spine>
</package>`
  );
  zip.file(
    "OEBPS/nav.xhtml",
    `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Contents</title></head>
<body><nav epub:type="toc"><ol>${nav.join("")}</ol></nav></body></html>`
  );

  return Buffer.from(
    await zip.generateAsync({
      type: "nodebuffer",
      mimeType: "application/epub+zip",
      compression: "DEFLATE",
    })
  );
}
