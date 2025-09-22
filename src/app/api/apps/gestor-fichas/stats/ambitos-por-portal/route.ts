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

    // --- agregación opcional
    const group = sp.get("group"); // "month" | null

    // --- filtros comunes
    const q = (sp.get("q") ?? "").trim();
    const ambito = sp.get("ambito");               // UE|ESTADO|CCAA|PROVINCIA
    const tramite_tipo = sp.get("tramite_tipo");   // no|si|directo
    const complejidad = sp.get("complejidad");     // baja|media|alta
    const ccaa_id = toInt(sp.get("ccaa_id"));
    const provincia_id = toInt(sp.get("provincia_id"));
    const trabajador_id = toInt(sp.get("trabajador_id"));
    const trabajador_subida_id = toInt(sp.get("trabajador_subida_id"));

    // Filtros de destaque
    const destaque_principal = sp.get("destaque_principal");
    const destaque_secundario = sp.get("destaque_secundario");

    // --- periodo: año/mes numérico (1..12) o rango libre
    const anio = toInt(sp.get("anio"));
    const mesNum = toInt(sp.get("mes")); // 1..12 si viene
    const created_desde = sp.get("created_desde");
    const created_hasta = sp.get("created_hasta");

    let desde: Date | null = null;
    let hasta: Date | null = null;

    if (anio) {
      if (mesNum && mesNum >= 1 && mesNum <= 12) {
        // mes concreto del año
        desde = new Date(Date.UTC(anio, mesNum - 1, 1, 0, 0, 0));
        hasta = new Date(Date.UTC(anio, mesNum, 1, 0, 0, 0)); // límite exclusivo
      } else {
        // todo el año
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
        hasta = new Date(rangeResult[0].max_date.getTime() + 24 * 60 * 60 * 1000);
      } else {
        // Fallback si no hay datos
        desde = new Date(Date.UTC(2020, 0, 1, 0, 0, 0));
        hasta = new Date(Date.UTC(2030, 0, 1, 0, 0, 0));
      }
    }

    if (created_desde || created_hasta) {
      // el rango libre tiene prioridad si viene
      desde = created_desde ? new Date(created_desde + "T00:00:00Z") : desde;
      // usamos límite inclusivo al final del día
      hasta = created_hasta ? new Date(created_hasta + "T23:59:59Z") : hasta;
    }

    // --- filtro opcional por lista de portales (?portales=1,2,3)
    const portalsRaw = sp.get("portales");
    const portals = portalsRaw
      ? portalsRaw
          .split(",")
          .map((s) => Number(s.trim()))
          .filter(Number.isFinite)
      : [];

    // --- WHERE dinámico (SQL raw para rendimiento)
    const whereParts: string[] = [];
    const params: Param[] = [];

    if (q) {
      // (Para grandes volúmenes: usar FULLTEXT MATCH ... AGAINST aprovechando tus índices ft_*)
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

    // Filtros de destaque (lógica inclusiva)
    const { generateDestaqueSqlFilters } = await import('@/lib/utils/destaque-filters');
    const destaqueFilters = generateDestaqueSqlFilters({
      destaque_principal,
      destaque_secundario
    }, 'f');
    
    whereParts.push(...destaqueFilters.whereParts);
    params.push(...destaqueFilters.params);

    if (desde) { whereParts.push("f.created_at >= ?"); params.push(desde); }
    if (hasta) { whereParts.push("f.created_at < ?");  params.push(hasta); } // exclusivo si vino por año/mes

    if (portals.length) {
      whereParts.push(`fp.portal_id IN (${placeholders(portals.length)})`);
      params.push(...portals);
    }

    const whereSQL = whereParts.length ? "WHERE " + whereParts.join(" AND ") : "";

    // --- SELECT / GROUP / ORDER
    let selectSQL = `
      p.id AS portal_id,
      p.nombre AS portal_nombre,
      f.ambito_nivel AS ambito,
      COUNT(DISTINCT f.id) AS total
    `;
    let groupSQL = "GROUP BY p.id, p.nombre, f.ambito_nivel";
    let orderSQL =
      "ORDER BY p.nombre ASC, FIELD(f.ambito_nivel,'UE','ESTADO','CCAA','PROVINCIA'), total DESC";

    if (group === "month") {
      selectSQL = `
        DATE_FORMAT(f.created_at, '%Y-%m') AS month,
        p.id AS portal_id,
        p.nombre AS portal_nombre,
        f.ambito_nivel AS ambito,
        COUNT(DISTINCT f.id) AS total
      `;
      groupSQL = "GROUP BY month, p.id, p.nombre, f.ambito_nivel";
      orderSQL =
        "ORDER BY month ASC, p.nombre ASC, FIELD(f.ambito_nivel,'UE','ESTADO','CCAA','PROVINCIA'), total DESC";
    }

    const sql = `
      SELECT ${selectSQL}
      FROM fichas f
      JOIN ficha_portal fp ON fp.ficha_id = f.id
      JOIN portales p ON p.id = fp.portal_id
      ${whereSQL}
      ${groupSQL}
      ${orderSQL};
    `;

    const rows = await prisma.$queryRawUnsafe<any[]>(sql, ...params);

    // Calcular fichas únicas en el rango
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
        total_entries: rows.length
      }
    };

    return NextResponse.json(serialize(response));
  } catch (e: any) {
    console.error("stats/ambitos-por-portal error:", e?.message, e);
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}

/* ---------- helpers ---------- */
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
function placeholders(n: number) {
  return Array.from({ length: n }, () => "?").join(",");
}
