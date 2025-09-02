export function getBaseUrl(req: Request) {
  // funciona en dev/prod y detrás de proxy
  const h = new Headers(req.headers);
  const proto = h.get("x-forwarded-proto") || "http";
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

export async function fetchFichasFromSelf(req: Request, extraQS?: string) {
  const url = new URL(req.url);
  const base = getBaseUrl(req);
  const search = url.search || "";
  const join = extraQS ? (search ? `${search}&${extraQS}` : `?${extraQS}`) : search;

  // reenviamos credenciales
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const cookie = req.headers.get("cookie");
  if (cookie) headers["cookie"] = cookie;
  const auth = req.headers.get("authorization");
  if (auth) headers["authorization"] = auth;

  const res = await fetch(`${base}/api/apps/gestor-fichas/fichas${join}`, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  // devolvemos error legible (evita 500 opaco)
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`/api/apps/gestor-fichas/fichas -> ${res.status} ${res.statusText} ${text}`);
  }

  const json = await res.json();
  return json as { items: any[]; total: number };
}
