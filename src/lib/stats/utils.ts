import { Filters } from "./types";

export const PAGE_SIZES = [10, 20, 50, 100] as const;

export function fmtDate(iso?: string, dateOnly = false) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const opts: Intl.DateTimeFormatOptions = dateOnly
      ? { year: "numeric", month: "2-digit", day: "2-digit" }
      : { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" };
    return new Intl.DateTimeFormat(undefined, opts).format(d);
  } catch {
    return iso ?? "—";
  }
}

export function pickFichasFilters(f: Filters) {
  const allow: (keyof Filters)[] = [
    "q",
    "ambito",
    "ccaa_id",
    "provincia_id",
    "tramite_tipo",
    "trabajador_id",
    "created_desde",
    "created_hasta",
  ];
  const out: Partial<Filters> = {};
  allow.forEach((k) => {
    const v = f[k];
    if (v) (out as any)[k] = v;
  });
  return out;
}

// src/lib/stats/utils.ts

export function asItems<T = any>(json: any): T[] {
  if (Array.isArray(json)) return json as T[];
  if (json && Array.isArray(json.items)) return json.items as T[];
  return [];
}
