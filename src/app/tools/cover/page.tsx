"use client";

import { useMemo, useRef, useState } from "react";
import { toPng, toJpeg } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const sizes = [
  { id: "trade", label: "US Trade 6 × 9 in", w: 6, h: 9, unit: "in" },
  { id: "digest", label: "Digest 5.5 × 8.5 in", w: 5.5, h: 8.5, unit: "in" },
  { id: "mass", label: "Mass market 4.25 × 6.87 in", w: 4.25, h: 6.87, unit: "in" },
  { id: "a5", label: "A5 148 × 210 mm", w: 148, h: 210, unit: "mm" },
  { id: "a4", label: "A4 210 × 297 mm", w: 210, h: 297, unit: "mm" },
  { id: "square", label: "Square 8.5 × 8.5 in", w: 8.5, h: 8.5, unit: "in" },
  { id: "hard", label: "Hardcover 6.25 × 9.25 in", w: 6.25, h: 9.25, unit: "in" },
];

const designs = [
  { id: "block", label: "Colour block" },
  { id: "bleed", label: "Full-bleed photo" },
  { id: "split", label: "Split band" },
  { id: "frame", label: "Botanical frame" },
  { id: "classic", label: "Classic centred" },
];

const fonts = [
  { id: "var(--font-heading), Georgia, serif", label: "Fraunces" },
  { id: "Georgia, 'Times New Roman', serif", label: "Georgia" },
  { id: "'Palatino Linotype', Palatino, serif", label: "Palatino" },
  { id: "Garamond, 'Times New Roman', serif", label: "Garamond" },
  { id: "'Trebuchet MS', sans-serif", label: "Trebuchet" },
  { id: "var(--font-sans), sans-serif", label: "Outfit" },
];

const stock = [
  { src: "/stock/red-panda.png", label: "Red panda" },
  { src: "/stock/library.png", label: "Library" },
  { src: "/stock/paper.png", label: "Paper" },
  { src: "/stock/botanical.png", label: "Botanical" },
  { src: "/stock/pigeons.png", label: "Flock" },
];

const colors = ["#C45C26", "#2A9D8F", "#F4E6C8", "#3A2A1C", "#E07A5F", "#1D3557"];

export default function CoverDesignerPage() {
  const stage = useRef<HTMLDivElement>(null);
  const [sizeId, setSizeId] = useState("trade");
  const [design, setDesign] = useState("block");
  const [font, setFont] = useState(fonts[0].id);
  const [title, setTitle] = useState("The Migration Clock");
  const [author, setAuthor] = useState("Lina Voss");
  const [subtitle, setSubtitle] = useState("A novel");
  const [bg, setBg] = useState("#C45C26");
  const [fg, setFg] = useState("#F4E6C8");
  const [image, setImage] = useState("/stock/red-panda.png");

  const size = sizes.find((s) => s.id === sizeId)!;
  const px = useMemo(() => {
    const inchW = size.unit === "in" ? size.w : size.w / 25.4;
    const inchH = size.unit === "in" ? size.h : size.h / 25.4;
    const scale = 96;
    return { w: Math.round(inchW * scale), h: Math.round(inchH * scale) };
  }, [size]);

  async function exportCover(kind: "png" | "jpeg") {
    if (!stage.current) return;
    const dataUrl =
      kind === "png"
        ? await toPng(stage.current, { pixelRatio: 2, cacheBust: true })
        : await toJpeg(stage.current, { pixelRatio: 2, quality: 0.95, cacheBust: true });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `cover-${sizeId}.${kind === "png" ? "png" : "jpg"}`;
    a.click();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-sm uppercase tracking-[0.16em] text-primary">Free tool</p>
      <h1 className="mt-1 text-4xl">Cover page designer</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Pick a trim size used by trade houses, a layout, type, and a picture. Export PNG or JPEG for mock-ups — not a print-ready PDF with bleed.
      </p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex justify-center overflow-auto rounded-2xl bg-[oklch(0.93_0.02_80)] p-6">
          <div
            ref={stage}
            style={{
              width: px.w,
              height: px.h,
              fontFamily: font,
              color: fg,
              background: design === "bleed" ? "#111" : bg,
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 18px 40px rgba(58,42,28,.18)",
            }}
          >
            {(design === "bleed" || design === "split" || design === "frame") && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt=""
                style={{
                  position: "absolute",
                  inset: design === "split" ? "0 0 38% 0" : 0,
                  width: "100%",
                  height: design === "split" ? "62%" : "100%",
                  objectFit: "cover",
                  opacity: design === "frame" ? 0.35 : 1,
                }}
              />
            )}
            {design === "frame" && (
              <div style={{ position: "absolute", inset: 18, border: `3px solid ${fg}`, pointerEvents: "none" }} />
            )}
            {design === "block" && (
              <div style={{ position: "absolute", left: 0, right: 0, top: "18%", height: "54%", background: fg, color: bg, display: "flex", flexDirection: "column", justifyContent: "center", padding: 28 }}>
                <p style={{ letterSpacing: ".2em", fontSize: 11, textTransform: "uppercase" }}>{subtitle}</p>
                <h2 style={{ fontSize: Math.max(28, px.w / 12), lineHeight: 1.05, margin: "8px 0" }}>{title}</h2>
                <p style={{ fontSize: 16 }}>{author}</p>
              </div>
            )}
            {design !== "block" && (
              <div style={{ position: "absolute", left: 24, right: 24, bottom: design === "split" ? 24 : 36, textShadow: design === "bleed" ? "0 2px 16px rgba(0,0,0,.45)" : undefined }}>
                <p style={{ letterSpacing: ".18em", fontSize: 11, textTransform: "uppercase" }}>{subtitle}</p>
                <h2 style={{ fontSize: Math.max(26, px.w / 11), lineHeight: 1.05, margin: "6px 0" }}>{title}</h2>
                <p style={{ fontSize: 15 }}>{author}</p>
              </div>
            )}
            <p style={{ position: "absolute", top: 16, left: 20, fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", opacity: 0.85 }}>
              Red Panda Publications
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <Field label="Book size">
            <select className="w-full rounded-lg border bg-background px-2 py-2 text-sm" value={sizeId} onChange={(e) => setSizeId(e.target.value)}>
              {sizes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Design">
            <div className="flex flex-wrap gap-1">
              {designs.map((d) => (
                <Button key={d.id} size="sm" variant={design === d.id ? "default" : "outline"} onClick={() => setDesign(d.id)}>
                  {d.label}
                </Button>
              ))}
            </div>
          </Field>
          <Field label="Font">
            <select className="w-full rounded-lg border bg-background px-2 py-2 text-sm" value={font} onChange={(e) => setFont(e.target.value)}>
              {fonts.map((f) => (
                <option key={f.label} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </Field>
          <div>
            <Label htmlFor="ct">Title</Label>
            <Input id="ct" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="cs">Subtitle</Label>
            <Input id="cs" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ca">Author</Label>
            <Input id="ca" value={author} onChange={(e) => setAuthor(e.target.value)} />
          </div>
          <Field label="Colours">
            <div className="flex gap-2">
              {colors.map((c) => (
                <button key={c} type="button" aria-label={c} className="size-7 rounded-full border" style={{ background: c }} onClick={() => setBg(c)} />
              ))}
            </div>
            <div className="mt-2 flex gap-2 text-xs">
              <label>
                Ink{" "}
                <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} />
              </label>
              <label>
                Ground{" "}
                <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} />
              </label>
            </div>
          </Field>
          <Field label="Stock images">
            <div className="grid grid-cols-5 gap-1">
              {stock.map((s) => (
                <button key={s.src} type="button" onClick={() => setImage(s.src)} className="overflow-hidden rounded-md ring-1 ring-foreground/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.src} alt={s.label} className="aspect-square object-cover" />
                </button>
              ))}
            </div>
          </Field>
          <div>
            <Label htmlFor="custom">Custom image</Label>
            <Input
              id="custom"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setImage(URL.createObjectURL(file));
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => exportCover("png")}>Download PNG</Button>
            <Button variant="outline" onClick={() => exportCover("jpeg")}>
              Download JPEG
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-sm font-medium">{label}</p>
      {children}
    </div>
  );
}
