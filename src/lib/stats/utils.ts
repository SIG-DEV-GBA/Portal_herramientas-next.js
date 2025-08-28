// src/lib/stats/utils.ts
import { Filters } from "./types";

export const PAGE_SIZES = [10, 20, 50, 100] as const;

export const asAmbito = (s: string | null) =>
  s === "UE" || s === "ESTADO" || s === "CCAA" || s === "PROVINCIA" ? s : "";

export const asTramite = (s: string | null) =>
  s === "si" || s === "no" || s === "directo" ? s : "";

export const asComplejidad = (s: string | null) =>
  s === "baja" || s === "media" || s === "alta" ? s : "";




/** Fecha bonita (respeta locale del navegador) */
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

/**
 * Devuelve SOLO los filtros compatibles con /api/fichas & stats,
 * ignorando vacíos o undefined. Úsalo para montar querystrings.
 */
export function pickFichasFilters(f: Filters) {
  const allow: (keyof Filters)[] = [
    "q",
    "ambito",
    "ccaa_id",
    "provincia_id",
    "tramite_tipo",
    "complejidad",
    "trabajador_id",
    "trabajador_subida_id",
    "existe_frase",
    "anio",
    "mes",
    "created_desde",
    "created_hasta",
    "take",
    "page",
  ];

  const out: Partial<Filters> = {};
  for (const k of allow) {
    const v = f[k];
    if (v !== undefined && v !== null && String(v).length > 0) {
      (out as any)[k] = v;
    }
  }
  return out;
}

/** Construye un querystring a partir de Filters (solo campos no vacíos) */
export function toQueryString(filters: Filters) {
  const sp = new URLSearchParams();
  const clean = pickFichasFilters(filters);
  Object.entries(clean).forEach(([k, v]) => sp.set(k, String(v)));
  return sp.toString();
}

/** Convierte respuesta a items[] sin romper si el backend devuelve {items:[], total} */
export function asItems<T = any>(json: any): T[] {
  if (Array.isArray(json)) return json as T[];
  if (json && Array.isArray(json.items)) return json.items as T[];
  return [];
}

/** Nombre de mes (1..12). Devuelve "—" si fuera de rango. */
export function monthName(n?: number | string) {
  const idx = typeof n === "string" ? Number(n) : n;
  const NAMES = [
    "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  if (!Number.isFinite(idx) || !idx || idx < 1 || idx > 12) return "—";
  return NAMES[idx];
}
