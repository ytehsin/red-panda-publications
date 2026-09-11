const KEY = "rpp-entitlements";

export type Format = "reader" | "pdf" | "print";

export function grantEntitlement(bookId: string, format: Format) {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(KEY);
  const data = raw ? (JSON.parse(raw) as Record<string, Format[]>) : {};
  const set = new Set(data[bookId] || []);
  set.add(format);
  data[bookId] = [...set];
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function hasEntitlement(bookId: string, format: Format) {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(KEY);
  if (!raw) return false;
  const data = JSON.parse(raw) as Record<string, Format[]>;
  return (data[bookId] || []).includes(format);
}

export function readingCfiKey(bookId: string) {
  return `rpp-cfi:${bookId}`;
}
