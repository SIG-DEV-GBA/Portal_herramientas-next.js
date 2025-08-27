import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serialize } from "@/lib/serialize";
import { requirePermission } from "@/lib/api-guard";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { error } = await requirePermission(req, "fichas", "read");
  if (error) return error;

  const sp = req.nextUrl.searchParams;

  // básicos
  const q = sp.get("q") ?? "";
  const take = Math.min(Number(sp.get("take") ?? 20), 100);
  const skip = Number(sp.get("skip") ?? 0);

  // orden
  const orderStr = sp.get("orderBy") ?? "created_at:desc";
  const [orderField, orderDir] = orderStr.split(":");
  const orderBy: any = {};
  if (orderField) orderBy[orderField] = (orderDir === "asc" ? "asc" : "desc");

  // filtros simples
  const ambito = sp.get("ambito") as "UE"|"ESTADO"|"CCAA"|"PROVINCIA"|null;
  const ccaa_id = sp.get("ccaa_id");          // number
  const provincia_id = sp.get("provincia_id");// number
  const trabajador_id = sp.get("trabajador_id");
  const trabajador_subida_id = sp.get("trabajador_subida_id");
  const tramite_tipo = sp.get("tramite_tipo") as "no"|"si"|"directo"|null;
  const complejidad = sp.get("complejidad") as "baja"|"media"|"alta"|null;
  const existe_frase = sp.get("existe_frase"); // "true"|"false"|null
  const destaque = sp.get("destaque") as "novedad"|"destacable"|null;

  // fechas
  const created_desde  = sp.get("created_desde");
  const created_hasta  = sp.get("created_hasta");
  const updated_desde  = sp.get("updated_desde");
  const updated_hasta  = sp.get("updated_hasta");
  const venc_desde     = sp.get("vencimiento_desde");
  const venc_hasta     = sp.get("vencimiento_hasta");

  // where base
  const where: any = {};

  if (q) {
    where.OR = [
      { nombre_ficha: { contains: q } },
      { frase_publicitaria: { contains: q } },
      { texto_divulgacion: { contains: q } },
    ];
  }
  if (ambito) where.ambito_nivel = ambito;
  if (ccaa_id) where.ambito_ccaa_id = Number(ccaa_id);
  if (provincia_id) where.ambito_provincia_id = Number(provincia_id);
  if (trabajador_id) where.trabajador_id = Number(trabajador_id);
  if (trabajador_subida_id) where.trabajador_subida_id = Number(trabajador_subida_id);
  if (tramite_tipo) where.tramite_tipo = tramite_tipo;
  if (complejidad) where.complejidad = complejidad;
  if (existe_frase === "true")  where.existe_frase = true;
  if (existe_frase === "false") where.existe_frase = false;
  if (destaque) {
    where.OR = (where.OR ?? []).concat([
      { destaque_principal: destaque },
      { destaque_secundario: destaque },
    ]);
  }

  // rangos de fecha
  if (created_desde || created_hasta) {
    where.created_at = {};
    if (created_desde) where.created_at.gte = new Date(created_desde + "T00:00:00Z");
    if (created_hasta) where.created_at.lte = new Date(created_hasta + "T23:59:59Z");
  }
  if (updated_desde || updated_hasta) {
    where.updated_at = {};
    if (updated_desde) where.updated_at.gte = new Date(updated_desde + "T00:00:00Z");
    if (updated_hasta) where.updated_at.lte = new Date(updated_hasta + "T23:59:59Z");
  }
  if (venc_desde || venc_hasta) {
    where.vencimiento = {};
    if (venc_desde) where.vencimiento.gte = new Date(venc_desde + "T00:00:00Z");
    if (venc_hasta) where.vencimiento.lte = new Date(venc_hasta + "T23:59:59Z");
  }

  // modo dinámico: filters=<json url-encoded>
  // ej: filters={"AND":[{"complejidad":"media"},{"OR":[{"ambito_nivel":"CCAA"},{"ambito_nivel":"ESTADO"}]}]}
  const filtersRaw = sp.get("filters");
  if (filtersRaw) {
    try {
      const json = JSON.parse(filtersRaw);
      // muy básico: mezclamos con AND
      where.AND = (where.AND ?? []).concat(json);
    } catch {}
  }

  const [items, total] = await Promise.all([
    prisma.fichas.findMany({
      where,
      take, skip,
      orderBy,
      include: {
        ficha_portal: { include: { portales: true } },
        ficha_tematica: { include: { tematicas: true } },
      },
    }),
    prisma.fichas.count({ where }),
  ]);

  return NextResponse.json(serialize({ items, total }));
}
