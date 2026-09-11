"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const templates = [
  { id: "us", label: "US copyright" },
  { id: "uk", label: "UK imprint" },
  { id: "dedication", label: "Dedication + copyright" },
  { id: "colophon", label: "Colophon" },
  { id: "cip", label: "Cataloguing note" },
];

const starterCopy: Record<string, string> = {
  us: `First published in 2026 by Red Panda Publications, 18 Rustleaf Road, Suite 4, San Francisco, CA 94110.

Copyright © 2026 [Author].

All rights reserved. No part of this publication may be reproduced, stored in a retrieval system, or transmitted in any form or by any means without the prior written permission of the publisher, except for brief quotations in a review.

This is a work of fiction. Names, characters, places, and incidents are either the product of the author’s imagination or used fictitiously.

ISBN [ISBN]
A catalogue record is available from the Library of Congress.

Printed in the United States of America
First edition`,
  uk: `Published by Red Panda Publications
18 Rustleaf Road, Suite 4, San Francisco, CA 94110

Copyright © [Author] 2026

The right of [Author] to be identified as the author of this work has been asserted in accordance with the Copyright, Designs and Patents Act 1988.

All rights reserved.

ISBN [ISBN]

A CIP catalogue record for this book is available from the British Library.

Typeset in [Typeface]
Printed and bound by [Printer]`,
  dedication: `For the first reader who stays up.

—

First published 2026 by Red Panda Publications.

Copyright © [Author] 2026. All rights reserved.

ISBN [ISBN]

The moral right of the author has been asserted.`,
  colophon: `This edition of [Title] was designed at Red Panda Publications.

Text set in [Typeface] on cream stock.
Cover printed in terracotta and cream, the colours of the house mark.

ISBN [ISBN]
© [Author] and Red Panda Publications, 2026.`,
  cip: `[Title] / [Author].
San Francisco : Red Panda Publications, 2026.

ISBN [ISBN]

1. Literary fiction. I. Title.

Printed on acid-free paper.
Publisher’s address: 18 Rustleaf Road, Suite 4, San Francisco, CA 94110.`,
};

export default function PublisherPageMaker() {
  const page = useRef<HTMLDivElement>(null);
  const [template, setTemplate] = useState("us");
  const [publisher, setPublisher] = useState("Red Panda Publications");
  const [address, setAddress] = useState("18 Rustleaf Road, Suite 4, San Francisco, CA 94110");
  const [email, setEmail] = useState("hello@redpandapublications.com");
  const [title, setTitle] = useState("The Migration Clock");
  const [author, setAuthor] = useState("Lina Voss");
  const [isbn, setIsbn] = useState("978-1-9900-0100-1");
  const [typeface, setTypeface] = useState("Source Serif 4");
  const [year, setYear] = useState("2026");
  const [copy, setCopy] = useState(starterCopy.us);

  function applyTemplate(id: string) {
    setTemplate(id);
    let text = starterCopy[id];
    text = text
      .replaceAll("[Author]", author)
      .replaceAll("[Title]", title)
      .replaceAll("[ISBN]", isbn)
      .replaceAll("[Typeface]", typeface)
      .replaceAll("[Printer]", "Rustleaf Press")
      .replaceAll("2026", year)
      .replaceAll("Red Panda Publications", publisher)
      .replaceAll("18 Rustleaf Road, Suite 4, San Francisco, CA 94110", address);
    setCopy(text);
  }

  async function download() {
    if (!page.current) return;
    const url = await toPng(page.current, { pixelRatio: 2, cacheBust: true });
    const a = document.createElement("a");
    a.href = url;
    a.download = "publisher-page.png";
    a.click();
  }

  function printPage() {
    window.print();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-sm uppercase tracking-[0.16em] text-primary">Free tool</p>
      <h1 className="mt-1 text-4xl">Publisher page maker</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Five house templates, including copyright pages written in full. Edit the legal text. Fill publisher details. Export a PNG or print to PDF from the browser.
      </p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-3 print:hidden">
          <p className="text-sm font-medium">Templates</p>
          <div className="flex flex-wrap gap-1">
            {templates.map((t) => (
              <Button key={t.id} size="sm" variant={template === t.id ? "default" : "outline"} onClick={() => applyTemplate(t.id)}>
                {t.label}
              </Button>
            ))}
          </div>
          <div>
            <Label htmlFor="pub">Publisher</Label>
            <Input id="pub" value={publisher} onChange={(e) => setPublisher(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="addr">Address</Label>
            <Input id="addr" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="em">Email</Label>
            <Input id="em" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="bt">Book title</Label>
            <Input id="bt" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="au">Author</Label>
            <Input id="au" value={author} onChange={(e) => setAuthor(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="is">ISBN</Label>
            <Input id="is" value={isbn} onChange={(e) => setIsbn(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="tf">Typeface</Label>
            <Input id="tf" value={typeface} onChange={(e) => setTypeface(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="yr">Year</Label>
            <Input id="yr" value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="body">Editable page text</Label>
            <Textarea id="body" className="min-h-48" value={copy} onChange={(e) => setCopy(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button onClick={download}>Download PNG</Button>
            <Button variant="outline" onClick={printPage}>
              Print / Save PDF
            </Button>
          </div>
        </div>
        <div className="flex justify-center bg-[oklch(0.93_0.02_80)] p-4 print:bg-white">
          <div
            ref={page}
            className="min-h-[640px] w-[420px] bg-[#fffef8] p-12 text-[#3a2a1c] shadow-xl print:shadow-none"
            style={{ fontFamily: '"Source Serif 4", Georgia, serif' }}
          >
            <p className="text-[10px] uppercase tracking-[0.22em]">{publisher}</p>
            <p className="mt-1 text-[11px] text-[#6b5340]">{address}</p>
            <p className="text-[11px] text-[#6b5340]">{email}</p>
            <h2 className="mt-8 text-2xl" style={{ fontFamily: "var(--font-heading)" }}>
              {title}
            </h2>
            <p className="mt-1 text-sm">{author}</p>
            <div className="mt-8 whitespace-pre-wrap text-[13px] leading-relaxed">{copy}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
