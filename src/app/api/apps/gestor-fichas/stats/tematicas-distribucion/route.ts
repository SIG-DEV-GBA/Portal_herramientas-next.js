import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/db";
import { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/utils/api-guard";
import { serialize } from "@/lib/utils/serialize";

export const runtime = "nodejs";

type Row = { tematica_id: bigint; tematica_nombre: string; total: bigint };

export async function GET(req: NextRequest) {
  try {
    const { error } = await requirePermission(req, "fichas", "read");
    if (error) return error;

    const sp = req.nextUrl.searchParams;
    const anioStr = sp.get("anio");
    const mesStr  = sp.get("mes"); // "01".."12" opcional

    const anio = toInt(anioStr);
    if (!anio) {
      return NextResponse.json({ error: "Falta parámetro anio=YYYY" }, { status: 400 });
    }

    // rango base
    let desde = new Date(Date.UTC(anio, 0, 1, 0, 0, 0));
    let hasta = new Date(Date.UTC(anio + 1, 0, 1, 0, 0, 0));

    // si hay mes, estrechamos el rango al mes concreto
    const mes = toInt(mesStr);
    if (mes && mes >= 1 && mes <= 12) {
      desde = new Date(Date.UTC(anio, mes - 1, 1, 0, 0, 0));
      hasta = mes === 12
        ? new Date(Date.UTC(anio + 1, 0, 1, 0, 0, 0))
        : new Date(Date.UTC(anio, mes, 1, 0, 0, 0));
    }

    // filtros extra (idénticos a tus rutas)
    const q = (sp.get("q") ?? "").trim();
    const ambito = sp.get("ambito");
    const tramite_tipo = sp.get("tramite_tipo");
    const complejidad = sp.get("complejidad");
    const ccaa_id = toInt(sp.get("ccaa_id"));
    const provincia_id = toInt(sp.get("provincia_id"));
    const provincia_principal = toInt(sp.get("provincia_principal"));
    const trabajador_id = toInt(sp.get("trabajador_id"));
    const trabajador_subida_id = toInt(sp.get("trabajador_subida_id"));
    const existe_frase = parseBool(sp.get("existe_frase"));

    // WHERE seguro encadenado
    let where = Prisma.sql`WHERE f.created_at >= ${desde} AND f.created_at < ${hasta}`;

    if (q) {
      const like = `%${q}%`;
      where = Prisma.sql`${where} AND (f.nombre_ficha LIKE ${like} OR f.frase_publicitaria LIKE ${like} OR f.texto_divulgacion LIKE ${like})`;
    }
    if (ambito)               where = Prisma.sql`${where} AND f.ambito_nivel = ${ambito}`;
    if (tramite_tipo)         where = Prisma.sql`${where} AND f.tramite_tipo = ${tramite_tipo}`;
    if (complejidad)          where = Prisma.sql`${where} AND f.complejidad = ${complejidad}`;
    if (typeof existe_frase === "boolean")
                              where = Prisma.sql`${where} AND f.existe_frase = ${existe_frase ? 1 : 0}`;
    if (ccaa_id)              where = Prisma.sql`${where} AND f.ambito_ccaa_id = ${ccaa_id}`;
    if (provincia_id)         where = Prisma.sql`${where} AND f.ambito_provincia_id = ${provincia_id}`;
    if (provincia_principal) {
      // Filtro inclusivo por provincia
      const provinciaData = await prisma.provincias.findUnique({
        where: { id: provincia_principal },
        select: { ccaa_id: true }
      });
      
      if (provinciaData) {
        where = Prisma.sql`${where} AND (
          f.ambito_provincia_id = ${provincia_principal} OR 
          (f.ambito_nivel = 'CCAA' AND f.ambito_ccaa_id = ${provinciaData.ccaa_id}) OR 
          f.ambito_nivel = 'ESTADO'
        )`;
      }
    }
    if (trabajador_id)        where = Prisma.sql`${where} AND f.trabajador_id = ${trabajador_id}`;
    if (trabajador_subida_id) where = Prisma.sql`${where} AND f.trabajador_subida_id = ${trabajador_subida_id}`;

    // Query: distribución por temática (año o mes según rango)
    const rows = await prisma.$queryRaw<Row[]>(Prisma.sql`
      SELECT
        t.id     AS tematica_id,
        t.nombre AS tematica_nombre,
        COUNT(DISTINCT f.id) AS total
      FROM fichas f
      JOIN ficha_tematica ft ON ft.ficha_id = f.id
      JOIN tematicas t       ON t.id = ft.tematica_id
      ${where}
      GROUP BY t.id, t.nombre
      ORDER BY total DESC
    `);

    return NextResponse.json(serialize(rows));
  } catch (e: any) {
    console.error("stats/tematicas-distribucion error:", e?.message, e);
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}

/* helpers idénticos a tus archivos */
function toInt(s: string | null) { if (!s) return null; const n = Number(s); return Number.isFinite(n) ? n : null; }
function parseBool(s: string | null) { if (s==="true") return true; if (s==="false") return false; return null; }
