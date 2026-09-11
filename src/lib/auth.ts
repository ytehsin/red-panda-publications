import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE = "rpp_admin";

function secret() {
  return process.env.ADMIN_SECRET || "red-panda-house-secret";
}

export function adminPassword() {
  return process.env.ADMIN_PASSWORD || "redpanda";
}

export function signAdminToken() {
  const ts = Date.now().toString();
  const sig = createHmac("sha256", secret()).update(ts).digest("hex");
  return `${ts}.${sig}`;
}

export function verifyAdminToken(token: string | undefined) {
  if (!token) return false;
  const [ts, sig] = token.split(".");
  if (!ts || !sig) return false;
  const expected = createHmac("sha256", secret()).update(ts).digest("hex");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function isAdmin() {
  const jar = await cookies();
  return verifyAdminToken(jar.get(COOKIE)?.value);
}

export { COOKIE as ADMIN_COOKIE };
