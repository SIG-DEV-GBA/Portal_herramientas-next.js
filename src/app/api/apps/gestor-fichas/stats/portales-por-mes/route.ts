// src/app/api/apps/gestor-fichas/stats/portales-por-mes/route.ts
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

    // --- periodo: anio/mes (1..12) o rango libre
    const anio = toInt(sp.get("anio"));
    const mesNum = toInt(sp.get("mes")); // 1..12 si viene
    const created_desde = sp.get("created_desde");
    const created_hasta = sp.get("created_hasta");

    // Calculamos rango [desde, hasta] de fechas y rango de meses [firstMonth, lastMonth] (primer día)
    let desde: Date | null = null;
    let hasta: Date | null = null;
    let firstMonth: Date | null = null;
    let lastMonth: Date | null = null;

    if (anio) {
      if (mesNum && mesNum >= 1 && mesNum <= 12) {
        // Mes concreto del año
        desde = new Date(Date.UTC(anio, mesNum - 1, 1, 0, 0, 0));
        hasta = new Date(Date.UTC(anio, mesNum, 1, 0, 0, 0)); // exclusivo
      } else {
        // Todo el año
        desde = new Date(Date.UTC(anio, 0, 1, 0, 0, 0));
        hasta = new Date(Date.UTC(anio + 1, 0, 1, 0, 0, 0)); // exclusivo
      }
    } else {
      // Sin año específico - obtener rango completo de la BD
      const rangeResult = await prisma.$queryRaw<Array<{min_date: Date, max_date: Date}>>`
        SELECT 
          MIN(created_at) as min_date,
          MAX(created_at) as max_date 
        FROM fichas
      `;
      
      if (rangeResult.length > 0 && rangeResult[0].min_date && rangeResult[0].max_date) {
        desde = rangeResult[0].min_date;
        hasta = new Date(rangeResult[0].max_date.getTime() + 24 * 60 * 60 * 1000); // +1 día para inclusivo
      } else {
        // Fallback si no hay datos
        desde = new Date(Date.UTC(2020, 0, 1, 0, 0, 0));
        hasta = new Date(Date.UTC(2030, 0, 1, 0, 0, 0));
      }
    }

    if (created_desde || created_hasta) {
      // El rango libre tiene prioridad si viene
      const d = created_desde ? new Date(created_desde + "T00:00:00Z") : null;
      const h = created_hasta ? new Date(created_hasta + "T23:59:59Z") : null;
      if (d) desde = d;
      if (h) hasta = h;
    }

    // Si al final no hay rango definido, exigimos al menos anio
    if (!desde || !hasta) {
      return NextResponse.json(
        { error: "Debes indicar ?anio=YYYY (opcionalmente &mes=1..12) o bien created_desde/hasta." },
        { status: 400 }
      );
    }

    // Primer día del mes de 'desde' y 'hasta' para el CTE de meses
    firstMonth = firstDayOfMonth(desde);
    // Para lastMonth usamos el primer día del mes de (hasta - 1 milisegundo)
    const hastaIncl = new Date(hasta.getTime() - 1);
    lastMonth = firstDayOfMonth(hastaIncl);

    // --- filtros comunes
    const q = (sp.get("q") ?? "").trim();
    const ambito = sp.get("ambito");
    const tramite_tipo = sp.get("tramite_tipo");
    const complejidad = sp.get("complejidad");
    const ccaa_id = toInt(sp.get("ccaa_id"));
    const provincia_id = toInt(sp.get("provincia_id"));
    const trabajador_id = toInt(sp.get("trabajador_id"));
    const trabajador_subida_id = toInt(sp.get("trabajador_subida_id"));

    // WHERE del conteo
    const whereParts: string[] = ["f.created_at >= ?", "f.created_at < ?"]; // < hasta (exclusivo)
    const params: Param[] = [desde, hasta];
    
    // Si solo se filtró por mes (sin año), agregar filtro por mes
    if (!anio && mesNum && mesNum >= 1 && mesNum <= 12) {
      whereParts.push("MONTH(f.created_at) = ?");
      params.push(mesNum);
    }

    if (q) {
      whereParts.push(
        "(f.nombre_ficha LIKE ? OR f.frase_publicitaria LIKE ? OR f.texto_divulgacion LIKE ?)"
      );
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

    const whereSQL = "WHERE " + whereParts.join(" AND ");

    // CTE de meses entre [firstMonth, lastMonth] con salto de 1 mes
    // + Conteos agrupados por (YYYY-MM, portal) dentro del where
    const sql = `
      WITH RECURSIVE months(m) AS (
        SELECT ? AS m
        UNION ALL
        SELECT DATE_ADD(m, INTERVAL 1 MONTH) FROM months WHERE m < ?
      ),
      conteos AS (
        SELECT
          ${!anio && mesNum ? 'MONTH(f.created_at)' : 'DATE_FORMAT(f.created_at, \'%Y-%m\')'} AS month,
          fp.portal_id,
          COUNT(DISTINCT f.id) AS total
        FROM fichas f
        JOIN ficha_portal fp ON fp.ficha_id = f.id
        ${whereSQL}
        GROUP BY month, fp.portal_id
      )
      SELECT
        ${!anio && mesNum ? 'MONTH(months.m)' : 'DATE_FORMAT(months.m, \'%Y-%m\')'} AS month,
        p.id   AS portal_id,
        p.slug AS portal_slug,
        p.nombre AS portal_nombre,
        COALESCE(c.total, 0) AS total
      FROM months
      CROSS JOIN portales p
      LEFT JOIN conteos c
        ON c.portal_id = p.id
       AND c.month = ${!anio && mesNum ? 'MONTH(months.m)' : 'DATE_FORMAT(months.m, \'%Y-%m\')'}
      ORDER BY month ASC,
        CASE p.slug
          WHEN 'familia' THEN 1
          WHEN 'salud' THEN 2
          WHEN 'mayores' THEN 3
          WHEN 'discapacidad' THEN 4
          WHEN 'mujer' THEN 5
          ELSE 6
        END,
        p.nombre ASC;
    `;

    // params: firstMonth, lastMonth, ...where params
    const rows = await prisma.$queryRawUnsafe<any[]>(
      sql,
      firstMonth, lastMonth,
      ...params
    );

    return NextResponse.json(serialize(rows));
  } catch (e: any) {
    console.error("stats/portales-por-mes error:", e?.message, e);
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}

/* ---------------- helpers ---------------- */
function toInt(s: string | null) { if (!s) return null; const n = Number(s); return Number.isFinite(n) ? n : null; }
function parseBool(s: string | null) { if (s === "true") return true; if (s === "false") return false; return null; }
function firstDayOfMonth(d: Date) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0)); }
