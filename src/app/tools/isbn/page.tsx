"use client";

import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import { normalizeIsbn13, formatIsbn13 } from "@/lib/isbn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function IsbnToolPage() {
  const [raw, setRaw] = useState("9781990001001");
  const [error, setError] = useState<string | undefined>();
  const [isbn, setIsbn] = useState("9781990001001");
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const next = normalizeIsbn13(raw);
    setError(next.error);
    if (next.isbn13) setIsbn(next.isbn13);
  }, [raw]);

  useEffect(() => {
    if (!svgRef.current || error) return;
    try {
      JsBarcode(svgRef.current, isbn, {
        format: "EAN13",
        lineColor: "#3a2a1c",
        width: 2.2,
        height: 72,
        displayValue: true,
        fontSize: 16,
        margin: 12,
        background: "#fffef8",
      });
    } catch {
      setError("Could not draw this ISBN.");
    }
  }, [isbn, error]);

  function download(kind: "svg" | "png" | "jpeg") {
    const svg = svgRef.current;
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    if (kind === "svg") {
      const blob = new Blob([xml], { type: "image/svg+xml" });
      save(blob, `${isbn}.svg`);
      return;
    }
    const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#fffef8";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (b) => {
          if (b) save(b, `${isbn}.${kind === "png" ? "png" : "jpg"}`);
          URL.revokeObjectURL(url);
        },
        kind === "png" ? "image/png" : "image/jpeg",
        0.95
      );
    };
    img.src = url;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-sm uppercase tracking-[0.16em] text-primary">Free tool</p>
      <h1 className="mt-1 text-4xl">ISBN to barcode</h1>
      <p className="mt-3 text-muted-foreground">
        EAN-13 artwork for 978 and 979 numbers. ISBN-10 is converted. Nothing is watermarked.
      </p>
      <div className="mt-8 space-y-2">
        <Label htmlFor="isbn">ISBN</Label>
        <Input id="isbn" value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="978-1-9900-0100-1" />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!error && <p className="text-sm text-muted-foreground">Normalised: {formatIsbn13(isbn)}</p>}
      </div>
      <div className="mt-8 overflow-auto rounded-2xl border bg-[oklch(0.99_0.01_85)] p-6">
        <svg ref={svgRef} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => download("png")} disabled={!!error}>
          Download PNG
        </Button>
        <Button variant="outline" onClick={() => download("svg")} disabled={!!error}>
          Download SVG
        </Button>
        <Button variant="outline" onClick={() => download("jpeg")} disabled={!!error}>
          Download JPEG
        </Button>
      </div>
    </div>
  );
}

function save(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
