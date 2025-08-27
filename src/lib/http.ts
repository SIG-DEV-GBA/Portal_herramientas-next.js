import { PY_BACKEND_URL } from "@/lib/env";

export async function pyFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${PY_BACKEND_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    // Evitamos caché en auth
    cache: "no-store",
  });
  return res;
}
