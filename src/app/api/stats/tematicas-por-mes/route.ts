// Serie mensual de fichas por temática en un año (?anio=YYYY) con filtros.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/api-guard";
import { serialize } from "@/lib/serialize";

export const runtime = "nodejs";
type Param = string | number | Date;

export async function GET(req: NextRequest) {
  try {
    const { error } = await requirePermission(req, "fichas", "read");
    if (error) return error;

    const sp = req.nextUrl.searchParams;
    const anio = toInt(sp.get("anio"));
    if (!anio) {
      return NextResponse.json({ error: "Falta parámetro anio=YYYY" }, { status: 400 });
    }

    // rango del año
    const desde = new Date(Date.UTC(anio, 0, 1, 0, 0, 0));
    const hasta = new Date(Date.UTC(anio + 1, 0, 1, 0, 0, 0));

    // filtros opcionales
    const q = (sp.get("q") ?? "").trim();
    const ambito = sp.get("ambito");
    const tramite_tipo = sp.get("tramite_tipo");
    const complejidad = sp.get("complejidad");
    const ccaa_id = toInt(sp.get("ccaa_id"));
    const provincia_id = toInt(sp.get("provincia_id"));
    const trabajador_id = toInt(sp.get("trabajador_id"));
    const trabajador_subida_id = toInt(sp.get("trabajador_subida_id"));
    const existe_frase = parseBool(sp.get("existe_frase"));

    const whereParts: string[] = ["f.created_at >= ?", "f.created_at < ?"];
    const params: Param[] = [desde, hasta];

    if (q) {
      whereParts.push(
        "(f.nombre_ficha LIKE ? OR f.frase_publicitaria LIKE ? OR f.texto_divulgacion LIKE ?)"
      );
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (ambito) whereParts.push("f.ambito_nivel = ?"), params.push(ambito);
    if (tramite_tipo) whereParts.push("f.tramite_tipo = ?"), params.push(tramite_tipo);
    if (complejidad) whereParts.push("f.complejidad = ?"), params.push(complejidad);
    if (typeof existe_frase === "boolean") {
      whereParts.push("f.existe_frase = ?"), params.push(existe_frase ? 1 : 0);
    }
    if (ccaa_id) whereParts.push("f.ambito_ccaa_id = ?"), params.push(ccaa_id);
    if (provincia_id) whereParts.push("f.ambito_provincia_id = ?"), params.push(provincia_id);
    if (trabajador_id) whereParts.push("f.trabajador_id = ?"), params.push(trabajador_id);
    if (trabajador_subida_id)
      whereParts.push("f.trabajador_subida_id = ?"), params.push(trabajador_subida_id);

    const whereSQL = "WHERE " + whereParts.join(" AND ");

    const sql = `
      SELECT
        DATE_FORMAT(f.created_at, '%Y-%m') AS month,
        t.id   AS tematica_id,
        t.nombre AS tematica_nombre,
        COUNT(DISTINCT f.id) AS total
      FROM fichas f
      JOIN ficha_tematica ft ON ft.ficha_id = f.id
      JOIN tematicas t ON t.id = ft.tematica_id
      ${whereSQL}
      GROUP BY month, t.id, t.nombre
      ORDER BY month ASC, total DESC;
    `;

    const rows = await prisma.$queryRawUnsafe<any[]>(sql, ...params);
    return NextResponse.json(serialize(rows));
  } catch (e: any) {
    console.error("stats/tematicas-por-mes error:", e?.message, e);
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}

/* helpers */
function toInt(s: string | null) { if (!s) return null; const n = Number(s); return Number.isFinite(n)?n:null; }
function parseBool(s: string | null) { if (s==="true") return true; if (s==="false") return false; return null; }
