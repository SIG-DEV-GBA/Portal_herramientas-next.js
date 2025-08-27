import { Filters } from "./types";

export function buildQS(filters: Partial<Filters>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length > 0) params.set(k, String(v));
  });
  return params.toString();
}

export async function apiJSON<T>(path: string, filters: Partial<Filters> = {}, init?: RequestInit): Promise<T> {
  const qs = buildQS(filters);
  const url = qs ? `${path}?${qs}` : path;
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Error ${res.status} al cargar ${url}`);
  return res.json();
}
