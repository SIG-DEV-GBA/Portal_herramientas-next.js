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

    // -------- Periodo: anio/mes (1..12) o rango libre
    const anio = toInt(sp.get("anio"));
    const mesNum = toInt(sp.get("mes")); // 1..12 si viene
    const created_desde = sp.get("created_desde");
    const created_hasta = sp.get("created_hasta");

    let desde: Date | null = null;
    let hasta: Date | null = null;

    if (anio) {
      if (mesNum && mesNum >= 1 && mesNum <= 12) {
        // Mes concreto del año
        desde = new Date(Date.UTC(anio, mesNum - 1, 1, 0, 0, 0));
        hasta = new Date(Date.UTC(anio, mesNum, 1, 0, 0, 0)); // exclusivo
      } else {
        // Año completo
        desde = new Date(Date.UTC(anio, 0, 1, 0, 0, 0));
        hasta = new Date(Date.UTC(anio + 1, 0, 1, 0, 0, 0)); // exclusivo
      }
    }

    if (created_desde || created_hasta) {
      // El rango libre tiene prioridad si viene
      const d = created_desde ? new Date(created_desde + "T00:00:00Z") : null;
      const h = created_hasta ? new Date(created_hasta + "T23:59:59Z") : null;
      if (d) desde = d;
      if (h) hasta = h;
    }

    if (!desde || !hasta) {
      return NextResponse.json(
        { error: "Debes indicar ?anio=YYYY (opcionalmente &mes=1..12) o bien created_desde/hasta." },
        { status: 400 }
      );
    }

    // Cálculo de months CTE (primer día de mes entre [desde, hasta))
    const firstMonth = firstDayOfMonth(desde);
    const lastMonth = firstDayOfMonth(new Date(hasta.getTime() - 1)); // primer día del mes de (hasta - ε)

    // -------- Filtros comunes
    const q = (sp.get("q") ?? "").trim();
    const ambito = sp.get("ambito");               // UE|ESTADO|CCAA|PROVINCIA
    const tramite_tipo = sp.get("tramite_tipo");   // no|si|directo
    const complejidad = sp.get("complejidad");     // baja|media|alta
    const ccaa_id = toInt(sp.get("ccaa_id"));
    const provincia_id = toInt(sp.get("provincia_id"));
    const trabajador_id = toInt(sp.get("trabajador_id"));
    const trabajador_subida_id = toInt(sp.get("trabajador_subida_id"));
    const existe_frase = parseBool(sp.get("existe_frase"));

    // Filtro opcional por lista de portales => considerar solo fichas que tengan alguno de esos portales
    const portalsRaw = sp.get("portales");
    const portals = portalsRaw
      ? portalsRaw
          .split(",")
          .map((s) => Number(s.trim()))
          .filter(Number.isFinite)
      : [];

    // -------- WHERE para fichas
    const whereParts: string[] = ["f.created_at >= ?", "f.created_at < ?"]; // < hasta (exclusivo)
    const params: Param[] = [desde, hasta];

    if (q) {
      whereParts.push(
        "(f.nombre_ficha LIKE ? OR f.frase_publicitaria LIKE ? OR f.texto_divulgacion LIKE ?)"
      );
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (ambito)               { whereParts.push("f.ambito_nivel = ?"); params.push(ambito); }
    if (tramite_tipo)         { whereParts.push("f.tramite_tipo = ?"); params.push(tramite_tipo); }
    if (complejidad)          { whereParts.push("f.complejidad = ?"); params.push(complejidad); }
    if (typeof existe_frase === "boolean") { whereParts.push("f.existe_frase = ?"); params.push(existe_frase ? 1 : 0); }
    if (ccaa_id)              { whereParts.push("f.ambito_ccaa_id = ?"); params.push(ccaa_id); }
    if (provincia_id)         { whereParts.push("f.ambito_provincia_id = ?"); params.push(provincia_id); }
    if (trabajador_id)        { whereParts.push("f.trabajador_id = ?"); params.push(trabajador_id); }
    if (trabajador_subida_id) { whereParts.push("f.trabajador_subida_id = ?"); params.push(trabajador_subida_id); }

    const whereSQL = "WHERE " + whereParts.join(" AND ");

    // Si hay filtro por portales, lo aplicamos en la agregación: la ficha cuenta si pertenece a alguno de esos portales
    // Además queremos saber si la ficha es exclusiva (1 portal) y, si lo es, a qué slug pertenece.
    // Estructura:
    //  - months CTE: lista de meses en el rango
    //  - fichas_filtradas: fichas en rango (y filtros)
    //  - fp_agg: por ficha (en el set filtrado de portales si aplica), nº de portales y slug único si n=1
    //  - agregación por mes
    const sql = `
      WITH RECURSIVE months(m) AS (
        SELECT ? AS m
        UNION ALL
        SELECT DATE_ADD(m, INTERVAL 1 MONTH) FROM months WHERE m < ?
      ),
      fichas_filtradas AS (
        SELECT f.id, f.created_at
        FROM fichas f
        ${whereSQL}
      ),
      fp_agg AS (
        SELECT
          ff.id AS ficha_id,
          DATE_FORMAT(ff.created_at, '%Y-%m') AS month,
          COUNT(DISTINCT fp.portal_id) AS n_portales,
          -- slug arbitrario si n_portales = 1 (válido para "exclusivas")
          MIN(p.slug) AS portal_unico_slug
        FROM fichas_filtradas ff
        JOIN ficha_portal fp ON fp.ficha_id = ff.id
        JOIN portales p ON p.id = fp.portal_id
        ${portals.length ? `WHERE fp.portal_id IN (${placeholders(portals.length)})` : ""}
        GROUP BY ff.id, month
      )
      SELECT
        MONTH(months.m) AS mes_index,                  -- 1..12 (para tu chart actual)
        COALESCE(SUM(CASE WHEN a.ficha_id IS NOT NULL THEN 1 ELSE 0 END), 0)                AS total,
        COALESCE(SUM(CASE WHEN a.n_portales > 1 THEN 1 ELSE 0 END), 0)                      AS varios_portales,
        COALESCE(SUM(CASE WHEN a.n_portales = 1 AND a.portal_unico_slug = 'mayores' THEN 1 ELSE 0 END), 0)        AS excl_mayores,
        COALESCE(SUM(CASE WHEN a.n_portales = 1 AND a.portal_unico_slug = 'discapacidad' THEN 1 ELSE 0 END), 0)   AS excl_discapacidad,
        COALESCE(SUM(CASE WHEN a.n_portales = 1 AND a.portal_unico_slug = 'familia' THEN 1 ELSE 0 END), 0)        AS excl_familia,
        COALESCE(SUM(CASE WHEN a.n_portales = 1 AND a.portal_unico_slug = 'mujer' THEN 1 ELSE 0 END), 0)          AS excl_mujer,
        COALESCE(SUM(CASE WHEN a.n_portales = 1 AND a.portal_unico_slug = 'salud' THEN 1 ELSE 0 END), 0)          AS excl_salud
      FROM months
      LEFT JOIN fp_agg a
        ON a.month = DATE_FORMAT(months.m, '%Y-%m')
      GROUP BY mes_index
      ORDER BY mes_index ASC;
    `;

    const rows = await prisma.$queryRawUnsafe<any[]>(
      sql,
      firstMonth, lastMonth,
      ...params,
      ...(portals.length ? portals : [])
    );

    // Construimos salida compat con tu componente: mes 1..12
    const items = rows.map((r) => ({
      mes: Number(r.mes_index || 0),
      total: Number(r.total || 0),
      exclusivas: {
        mayores: Number(r.excl_mayores || 0),
        discapacidad: Number(r.excl_discapacidad || 0),
        familia: Number(r.excl_familia || 0),
        mujer: Number(r.excl_mujer || 0),
        salud: Number(r.excl_salud || 0),
      },
      varios_portales: Number(r.varios_portales || 0),
    }));

    const total_anual = items.reduce((s, it) => s + (it.total || 0), 0);

    return NextResponse.json(serialize({ items, total_anual }));
  } catch (e: any) {
    console.error("stats/fichas-por-mes error:", e?.message, e);
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}

/* ---------------- helpers ---------------- */
function toInt(s: string | null) {
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function parseBool(s: string | null) {
  if (s === "true") return true;
  if (s === "false") return false;
  return null;
}
function firstDayOfMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0));
}
function placeholders(n: number) {
  return Array.from({ length: n }, () => "?").join(",");
}
