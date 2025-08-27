
export type FichaRow = {
  created_at: string;
  ambito_nivel?: string | null;      // 'UE'|'ESTADO'|'CCAA'|'PROVINCIA'|'MUNICIPAL'
  tramite_tipo?: string | null;      // 'directo'|'si'|'no' (o variantes)
  ficha_portal?: Array<{
    portales: { nombre?: string | null; slug?: string | null; codigo?: string | null };
  }>;
};

// --- utilidades ---
function norm(s?: string | null) {
  return (s ?? "").toString().trim().toLowerCase();
}

function toPortalKey(p?: { nombre?: string|null; slug?:string|null; codigo?:string|null }) {
  const cand = [p?.slug, p?.codigo, p?.nombre].map(norm).find(Boolean) || "";
  // mapeo flexible por nombre/slug
  if (/(mayor)/.test(cand)) return "mayores";
  if (/(discap)/.test(cand)) return "discapacidad";
  if (/(famil)/.test(cand)) return "familia";
  if (/(mujer)/.test(cand)) return "mujer";
  if (/(salud|sanidad)/.test(cand)) return "salud";
  return undefined;
}

export function getPortales(row: FichaRow): Array<"mayores"|"discapacidad"|"familia"|"mujer"|"salud"> {
  const rel = row.ficha_portal ?? [];
  const list = rel.map(fp => toPortalKey(fp.portales)).filter(Boolean) as any[];
  // únicos
  return Array.from(new Set(list));
}

export function getPortalPrincipal(row: FichaRow) {
  const ps = getPortales(row);
  return ps[0]; // no bloquea si hay varios; solo para contadores por portal
}

export function isVariosPortales(row: FichaRow) {
  return getPortales(row).length > 1;
}

export function getExclusiva(row: FichaRow) {
  const ps = getPortales(row);
  if (ps.length === 1) return ps[0];   // exclusiva de ese portal
  if (ps.length > 1) return "varios";
  return undefined;
}

export function getAmbito(row: FichaRow) {
  const a = norm(row.ambito_nivel);
  if (a === "ue" || a === "estado") return "estado";
  if (a === "ccaa") return "ccaa";
  if (a === "provincia") return "provincia";
  if (a === "municipal") return "municipal";
  return undefined;
}

export function getMonthIndex(row: FichaRow) {
  const d = new Date(row.created_at);
  return Number.isFinite(d.getTime()) ? d.getMonth() + 1 : 0; // 1..12
}

export function getOnline(row: FichaRow): "directo"|"si"|"no"|undefined {
  const v = norm(row.tramite_tipo);
  // admite variantes comunes
  if (["directo","enlace directo"].includes(v)) return "directo";
  if (["si","sí","online","telematico","telemático","con online"].includes(v)) return "si";
  if (["no","sin online","presencial"].includes(v)) return "no";
  return undefined;
}
