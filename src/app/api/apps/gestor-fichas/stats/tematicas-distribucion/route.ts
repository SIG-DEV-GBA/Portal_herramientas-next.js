/**
 * API Endpoint para estadísticas de distribución por temáticas
 * 
 * Este endpoint genera datos de distribución de fichas por categorías temáticas,
 * mostrando cuántas fichas están asociadas a cada temática en un período determinado.
 * 
 * Características principales:
 * - Filtrado temporal flexible (año, mes, rango personalizado)
 * - Detección automática del rango temporal si no se especifica
 * - Filtros adicionales por ámbito, complejidad, trabajador, etc.
 * - Retorna tanto fichas únicas como total de asignaciones
 * - Optimizado para consultas SQL complejas con joins
 * 
 * @author Sistema de Gestión de Fichas
 * @version 2.0
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/db";
import { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/utils/api-guard";
import { serialize } from "@/lib/utils/serialize";

export const runtime = "nodejs";

/**
 * Estructura de datos para cada fila de resultado
 * @interface Row
 * @property {bigint} tematica_id - ID único de la temática
 * @property {string} tematica_nombre - Nombre descriptivo de la temática
 * @property {bigint} total - Número de fichas asociadas a esta temática
 */
type Row = { tematica_id: bigint; tematica_nombre: string; total: bigint };

/**
 * GET /api/apps/gestor-fichas/stats/tematicas-distribucion
 * 
 * Obtiene estadísticas de distribución de fichas por temáticas
 * 
 * Query Parameters:
 * - anio: Año específico (YYYY) para filtrar datos
 * - mes: Mes específico (1-12) para filtrar datos
 * - q: Búsqueda de texto libre en contenido de fichas
 * - ambito: Filtro por ámbito territorial (UE, ESTADO, CCAA, PROVINCIA)
 * - tramite_tipo: Tipo de trámite (no, si, directo)
 * - complejidad: Nivel de complejidad (baja, media, alta)
 * - ccaa_id, provincia_id: Filtros geográficos
 * - trabajador_id: Filtro por trabajador responsable
 * - destaque_principal, destaque_secundario: Filtros por etiquetas
 * 
 * @returns {
 *   data: Array<{tematica_id, tematica_nombre, total}>,
 *   metadata: {
 *     total_unique_fichas: number,
 *     total_assignments: number,
 *     total_tematicas: number
 *   }
 * }
 */
export async function GET(req: NextRequest) {
  try {
    // Validar permisos de acceso a las estadísticas
    const { error } = await requirePermission(req, "fichas", "read");
    if (error) return error;

    // =====================  EXTRACCIÓN DE PARÁMETROS  =====================
    const sp = req.nextUrl.searchParams;
    const anioStr = sp.get("anio");
    const mesStr  = sp.get("mes"); // "01".."12" opcional

    const anio = toInt(anioStr);
    const mes = toInt(mesStr);

    // =====================  DETERMINACIÓN DE RANGO TEMPORAL  =====================
    // Calcula el rango de fechas based en los parámetros de entrada
    // Si no se especifican filtros temporales, usa el rango completo de la BD
    let desde: Date;
    let hasta: Date;

    if (anio && mes && mes >= 1 && mes <= 12) {
      // Caso 1: Año y mes específicos - filtro preciso de período
      desde = new Date(Date.UTC(anio, mes - 1, 1, 0, 0, 0));
      hasta = mes === 12
        ? new Date(Date.UTC(anio + 1, 0, 1, 0, 0, 0))
        : new Date(Date.UTC(anio, mes, 1, 0, 0, 0));
    } else if (anio) {
      // Caso 2: Solo año especificado - incluir todo el año completo
      desde = new Date(Date.UTC(anio, 0, 1, 0, 0, 0));
      hasta = new Date(Date.UTC(anio + 1, 0, 1, 0, 0, 0));
    } else if (mes && mes >= 1 && mes <= 12) {
      // Caso 3: Solo mes sin año - obtener rango completo y filtrar por mes
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
      // Nota: se añadirá filtro adicional por mes en la consulta SQL
    } else {
      // Caso 4: Sin restricciones temporales - analizar todo el dataset disponible
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

    // =====================  EXTRACCIÓN DE FILTROS ADICIONALES  =====================
    // Obtener todos los filtros opcionales para refinar la consulta
    const q = (sp.get("q") ?? "").trim();
    const ambito = sp.get("ambito");
    const tramite_tipo = sp.get("tramite_tipo");
    const complejidad = sp.get("complejidad");
    const ccaa_id = toInt(sp.get("ccaa_id"));
    const provincia_id = toInt(sp.get("provincia_id"));
    const provincia_principal = toInt(sp.get("provincia_principal"));
    const trabajador_id = toInt(sp.get("trabajador_id"));
    const trabajador_subida_id = toInt(sp.get("trabajador_subida_id"));

    // Filtros de destaque
    const destaque_principal = sp.get("destaque_principal");
    const destaque_secundario = sp.get("destaque_secundario");


    // =====================  CONSTRUCCIÓN DE CONDICIONES WHERE  =====================
    // Construcción segura de cláusulas WHERE usando Prisma.sql para prevenir inyección SQL
    let where = Prisma.sql`WHERE f.created_at >= ${desde} AND f.created_at < ${hasta}`;
    
    // Filtro adicional por mes cuando se especifica mes sin año
    if (mes && mes >= 1 && mes <= 12 && !anio) {
      where = Prisma.sql`${where} AND MONTH(f.created_at) = ${mes}`;
    }

    if (q) {
      const like = `%${q}%`;
      where = Prisma.sql`${where} AND (f.nombre_ficha LIKE ${like} OR f.frase_publicitaria LIKE ${like} OR f.texto_divulgacion LIKE ${like})`;
    }
    if (ambito)               where = Prisma.sql`${where} AND f.ambito_nivel = ${ambito}`;
    if (tramite_tipo)         where = Prisma.sql`${where} AND f.tramite_tipo = ${tramite_tipo}`;
    if (complejidad)          where = Prisma.sql`${where} AND f.complejidad = ${complejidad}`;


    if (ccaa_id)              where = Prisma.sql`${where} AND f.ambito_ccaa_id = ${ccaa_id}`;
    if (provincia_id)         where = Prisma.sql`${where} AND f.ambito_provincia_id = ${provincia_id}`;
    if (provincia_principal) {
      // Implementación de filtro inclusivo por provincia principal
      // Incluye fichas de la provincia, su CCAA y nivel estatal
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

    // =====================  CONSULTA PRINCIPAL DE DISTRIBUCIÓN  =====================
    // Consulta optimizada que cuenta fichas por temática usando JOINs eficientes
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

    // =====================  CONSULTA DE METADATOS  =====================
    // Obtener el número total de fichas únicas que cumplen los criterios
    // Esto permite distinguir entre fichas únicas y asignaciones totales
    const uniqueFichasResult = await prisma.$queryRaw<Array<{total_unique: bigint}>>`
      SELECT COUNT(DISTINCT f.id) as total_unique
      FROM fichas f
      ${where}
    `;
    

    // =====================  CONSTRUCCIÓN DE RESPUESTA  =====================
    // Estructura de respuesta con datos y metadatos para el frontend
    const response = {
      data: rows,
      metadata: {
        total_unique_fichas: Number(uniqueFichasResult[0]?.total_unique || 0), // Fichas únicas
        total_assignments: rows.reduce((sum, row) => sum + Number(row.total), 0), // Total asignaciones
        total_tematicas: rows.length // Número de temáticas con datos
      }
    };

    return NextResponse.json(serialize(response));
  } catch (e: any) {
    console.error("stats/tematicas-distribucion error:", e?.message, e);
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}

// =====================  FUNCIONES AUXILIARES  =====================

/**
 * Convierte string a entero con validación
 * @param s String a convertir
 * @returns Número entero válido o null si no es convertible
 */
function toInt(s: string | null) { 
  if (!s) return null; 
  const n = Number(s); 
  return Number.isFinite(n) ? n : null; 
}

/**
 * Convierte string a booleano con validación estricta
 * @param s String a convertir ("true" o "false")
 * @returns Boolean o null si no es válido
 */
function parseBool(s: string | null) { 
  if (s==="true") return true; 
  if (s==="false") return false; 
  return null; 
}
