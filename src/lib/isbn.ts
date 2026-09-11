export function digitsOnly(value: string) {
  return value.replace(/[^0-9Xx]/g, "").toUpperCase();
}

export function isbn10Checksum(body9: string) {
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += (10 - i) * Number(body9[i]);
  const rem = (11 - (sum % 11)) % 11;
  return rem === 10 ? "X" : String(rem);
}

export function isbn13Checksum(body12: string) {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(body12[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return String((10 - (sum % 10)) % 10);
}

export function isbn10To13(isbn10: string) {
  const d = digitsOnly(isbn10);
  if (d.length !== 10) return null;
  const body12 = `978${d.slice(0, 9)}`;
  return body12 + isbn13Checksum(body12);
}

export function normalizeIsbn13(raw: string): { isbn13: string; error?: string } {
  const d = digitsOnly(raw);
  if (d.length === 10) {
    if (isbn10Checksum(d.slice(0, 9)) !== d[9]) {
      return { isbn13: "", error: "ISBN-10 checksum does not match." };
    }
    return { isbn13: isbn10To13(d)! };
  }
  if (d.length === 13) {
    if (isbn13Checksum(d.slice(0, 12)) !== d[12]) {
      return { isbn13: "", error: "ISBN-13 checksum does not match." };
    }
    if (!d.startsWith("978") && !d.startsWith("979")) {
      return { isbn13: "", error: "ISBN-13 should begin with 978 or 979." };
    }
    return { isbn13: d };
  }
  if (d.length === 12 && (d.startsWith("978") || d.startsWith("979"))) {
    return { isbn13: d + isbn13Checksum(d) };
  }
  return {
    isbn13: "",
    error: "Enter a 10- or 13-digit ISBN (hyphens are fine).",
  };
}

export function formatIsbn13(isbn13: string) {
  const d = digitsOnly(isbn13);
  if (d.length !== 13) return isbn13;
  return `${d.slice(0, 3)}-${d[3]}-${d.slice(4, 9)}-${d.slice(9, 12)}-${d[12]}`;
}
