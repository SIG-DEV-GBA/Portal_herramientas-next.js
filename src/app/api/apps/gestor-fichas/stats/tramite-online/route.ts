// src/app/api/apps/gestor-fichas/stats/tramite-online/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/db";
import { requirePermission } from "@/lib/utils/api-guard";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { error } = await requirePermission(req, "fichas", "read");
  if (error) return error;

  const sp = req.nextUrl.searchParams;

  // --- filtros comunes
  const where: any = {};
  const q = sp.get("q")?.trim();
  if (q) {
    where.OR = [
      { nombre_ficha: { contains: q } },
      { frase_publicitaria: { contains: q } },
      { texto_divulgacion: { contains: q } },
    ];
  }

  const ambito = sp.get("ambito");
  if (ambito) where.ambito_nivel = ambito;

  const ccaa_id = sp.get("ccaa_id");
  if (ccaa_id) where.ambito_ccaa_id = Number(ccaa_id);

  const provincia_id = sp.get("provincia_id");
  if (provincia_id) {
    const { getProvinciaInclusiveFilter } = await import('@/lib/utils/provincia-filter');
    const provinciaFilter = await getProvinciaInclusiveFilter(Number(provincia_id));
    if (provinciaFilter) {
      where.OR = provinciaFilter.OR;
    }
  }

  const trabajador_id = sp.get("trabajador_id");
  if (trabajador_id) where.trabajador_id = Number(trabajador_id);

  const trabajador_subida_id = sp.get("trabajador_subida_id");
  if (trabajador_subida_id) where.trabajador_subida_id = Number(trabajador_subida_id);

  // Filtros de destaque (lógica inclusiva)
  const destaque_principal_filter = sp.get("destaque_principal");
  const destaque_secundario_filter = sp.get("destaque_secundario");
  
  const { generateDestaquePrismaFilters } = await import('@/lib/utils/destaque-filters');
  const destaqueConditions = generateDestaquePrismaFilters({
    destaque_principal: destaque_principal_filter,
    destaque_secundario: destaque_secundario_filter
  });
  
  // Aplicar condiciones de destaque si existen
  if (destaqueConditions.length > 0) {
    if (destaqueConditions.length === 1) {
      // Una sola condición
      Object.assign(where, destaqueConditions[0]);
    } else {
      // Múltiples condiciones - deben cumplirse todas (AND)
      where.AND = [
        ...(where.AND || []),
        ...destaqueConditions
      ];
    }
  }

  // --- periodo: anio/mes ó rango libre created_desde/hasta
  const anio = Number(sp.get("anio"));
  const mes = Number(sp.get("mes"));
  const created_desde = sp.get("created_desde");
  const created_hasta = sp.get("created_hasta");

  if (Number.isFinite(anio) && anio > 0) {
    const from = new Date(Date.UTC(anio, mes && mes >= 1 && mes <= 12 ? mes - 1 : 0, 1, 0, 0, 0));
    const to = new Date(
      Date.UTC(
        mes && mes >= 1 && mes <= 12 ? anio : anio + 1,
        mes && mes >= 1 && mes <= 12 ? mes : 0,
        mes && mes >= 1 && mes <= 12 ? 1 : 1,
        0, 0, 0
      ),
    );
    if (!where.created_at) where.created_at = {};
    where.created_at.gte = from;
    where.created_at.lt = to;
  }

  if (created_desde || created_hasta) {
    if (!where.created_at) where.created_at = {};
    if (created_desde) where.created_at.gte = new Date(created_desde + "T00:00:00Z");
    if (created_hasta) where.created_at.lte = new Date(created_hasta + "T23:59:59Z");
  }

  // --- groupBy tramite_tipo
  // enum en BD: 'no' | 'si' | 'directo'
  const rows = await prisma.fichas.groupBy({
    by: ["tramite_tipo"],
    _count: { _all: true },
    where,
  });

  const countBy: Record<"directo" | "si" | "no", number> = { directo: 0, si: 0, no: 0 };
  for (const r of rows) {
    const k = (r.tramite_tipo ?? "") as "directo" | "si" | "no";
    if (k === "directo" || k === "si" || k === "no") {
      countBy[k] = r._count._all;
    }
  }
  const total = countBy.directo + countBy.si + countBy.no;

  // La respuesta sigue tu tipo ResTramiteOnline (solo usamos total en el front)
  return NextResponse.json({
    por_portal: {}, // reservado por si luego lo necesitas
    total: { ...countBy, total },
  });
}
