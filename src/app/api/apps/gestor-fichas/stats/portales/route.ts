import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/db";
import { requirePermission } from "@/lib/utils/api-guard";
import { serialize } from "@/lib/utils/serialize";

export const runtime = "nodejs";
type Param = string | number | Date;

export async function GET(req: NextRequest) {
  try {
    const { error } = await requirePermission(req, "fichas", "read");
    if (error) return error;

    const sp = req.nextUrl.searchParams;

    // Filtros
    const q = (sp.get("q") ?? "").trim();
    const ambito = sp.get("ambito");
    const tramite_tipo = sp.get("tramite_tipo");
    const complejidad = sp.get("complejidad");
    const ccaa_id = toInt(sp.get("ccaa_id"));
    const provincia_id = toInt(sp.get("provincia_id"));
    const trabajador_id = toInt(sp.get("trabajador_id"));
    const trabajador_subida_id = toInt(sp.get("trabajador_subida_id"));


    // Año o mes o rango
    const anio = toInt(sp.get("anio"));
    const mes = sp.get("mes"); // YYYY-MM
    let desde: Date | null = null;
    let hasta: Date | null = null;

    if (anio) {
      desde = new Date(Date.UTC(anio, 0, 1, 0, 0, 0));
      hasta = new Date(Date.UTC(anio, 11, 31, 23, 59, 59));
    } else if (mes && /^\d{4}-\d{2}$/.test(mes)) {
      const [Y, M] = mes.split("-").map(Number);
      desde = new Date(Date.UTC(Y, M - 1, 1, 0, 0, 0));
      hasta = new Date(Date.UTC(Y, M, 0, 23, 59, 59));
    } else {
      const created_desde = sp.get("created_desde");
      const created_hasta = sp.get("created_hasta");
      if (created_desde) desde = new Date(created_desde + "T00:00:00Z");
      if (created_hasta) hasta = new Date(created_hasta + "T23:59:59Z");
      
      // Si no hay filtros de fecha específicos, usar rango completo de la BD
      if (!desde && !hasta) {
        const rangeResult = await prisma.$queryRaw<Array<{min_date: Date, max_date: Date}>>`
          SELECT 
            MIN(created_at) as min_date,
            MAX(created_at) as max_date 
          FROM fichas
        `;
        
        if (rangeResult.length > 0 && rangeResult[0].min_date && rangeResult[0].max_date) {
          desde = rangeResult[0].min_date;
          hasta = new Date(rangeResult[0].max_date.getTime() + 24 * 60 * 60 * 1000);
        } else {
          // Fallback si no hay datos
          desde = new Date(Date.UTC(2020, 0, 1, 0, 0, 0));
          hasta = new Date(Date.UTC(2030, 0, 1, 0, 0, 0));
        }
      }
    }

    // WHERE (para la subconsulta de conteo)
    const whereParts: string[] = [];
    const params: Param[] = [];

    if (q) {
      whereParts.push("(f.nombre_ficha LIKE ? OR f.frase_publicitaria LIKE ? OR f.texto_divulgacion LIKE ?)");
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (ambito)               { whereParts.push("f.ambito_nivel = ?"); params.push(ambito); }
    if (tramite_tipo)         { whereParts.push("f.tramite_tipo = ?"); params.push(tramite_tipo); }
    if (complejidad)          { whereParts.push("f.complejidad = ?"); params.push(complejidad); }

    if (ccaa_id)              { whereParts.push("f.ambito_ccaa_id = ?"); params.push(ccaa_id); }
    if (provincia_id) {
      const { getProvinciaInclusiveWhere } = await import('@/lib/utils/provincia-filter');
      const provinciaWhere = await getProvinciaInclusiveWhere(provincia_id);
      if (provinciaWhere) {
        whereParts.push(provinciaWhere.condition);
        params.push(...provinciaWhere.params);
      }
    }
    if (trabajador_id)        { whereParts.push("f.trabajador_id = ?"); params.push(trabajador_id); }
    if (trabajador_subida_id) { whereParts.push("f.trabajador_subida_id = ?"); params.push(trabajador_subida_id); }
    if (desde)                { whereParts.push("f.created_at >= ?"); params.push(desde); }
    if (hasta)                { whereParts.push("f.created_at <= ?"); params.push(hasta); }

    const whereSQL = whereParts.length ? "WHERE " + whereParts.join(" AND ") : "";

    // Orden fijo deseado (ajústalo a tu gusto)
    // familia(3), salud(5), mayores(1), discapacidad(2), mujer(4)
    const ORDER_CASE = `
      CASE p.slug
        WHEN 'familia' THEN 1
        WHEN 'salud' THEN 2
        WHEN 'mayores' THEN 3
        WHEN 'discapacidad' THEN 4
        WHEN 'mujer' THEN 5
        ELSE 6
      END
    `;

    // LEFT JOIN para incluir portales sin fichas (cuenta = 0)
    const sql = `
      SELECT
        p.id    AS portal_id,
        p.slug  AS portal_slug,
        p.nombre AS portal_nombre,
        COALESCE(c.total, 0) AS total
      FROM portales p
      LEFT JOIN (
        SELECT fp.portal_id, COUNT(DISTINCT f.id) AS total
        FROM ficha_portal fp
        JOIN fichas f ON f.id = fp.ficha_id
        ${whereSQL}
        GROUP BY fp.portal_id
      ) c ON c.portal_id = p.id
      ORDER BY ${ORDER_CASE}, p.nombre ASC;
    `;

    const rows = await prisma.$queryRawUnsafe<any[]>(sql, ...params);
    
    // Verificar el número real de fichas únicas en el rango (para comparar)
    const uniqueFichasSql = `
      SELECT COUNT(DISTINCT f.id) as total_unique
      FROM fichas f
      ${whereSQL}
    `;
    const uniqueFichasResult = await prisma.$queryRawUnsafe<Array<{total_unique: number}>>(uniqueFichasSql, ...params);
    
    
    const response = {
      data: rows,
      metadata: {
        total_unique_fichas: Number(uniqueFichasResult[0]?.total_unique || 0),
        total_assignments: rows.reduce((sum, row) => sum + Number(row.total || 0), 0),
        total_portales: rows.length
      }
    };
    
    return NextResponse.json(serialize(response));
  } catch (e: any) {
    console.error("stats/portales error:", e?.message, e);
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}

function toInt(s: string | null) { if (!s) return null; const n = Number(s); return Number.isFinite(n) ? n : null; }
function parseBool(s: string | null) { if (s === "true") return true; if (s === "false") return false; return null; }
