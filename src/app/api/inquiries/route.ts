import { NextResponse } from "next/server";
import { addInquiry } from "@/lib/site";
import { randomUUID } from "crypto";
import type { InquiryKind } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    kind?: InquiryKind;
    payload?: Record<string, string>;
  };
  if (!body.kind || !body.payload) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }
  const inquiry = {
    id: randomUUID(),
    kind: body.kind,
    createdAt: new Date().toISOString(),
    payload: body.payload,
  };
  await addInquiry(inquiry);
  return NextResponse.json({ ok: true, id: inquiry.id });
}
