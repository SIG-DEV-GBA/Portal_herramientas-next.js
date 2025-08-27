type Session = { email: string };

const PY = process.env.PY_BACKEND_URL!;
const AUTH_COOKIE = process.env.AUTH_COOKIE ?? "sid";

export async function verifyOpaqueTokenViaMe(token?: string): Promise<Session | null> {
  if (!token) return null;
  try {
    const res = await fetch(`${PY}/auth/me`, {
      method: "GET",
      headers: { Cookie: `${AUTH_COOKIE}=${token}; Path=/` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; email?: string };
    if (!data?.ok || !data?.email) return null;
    return { email: data.email };
  } catch { return null; }
}
