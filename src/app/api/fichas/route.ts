// src/app/api/fichas/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serialize } from "@/lib/serialize";
import { requirePermission } from "@/lib/api-guard";

export const runtime = "nodejs";

// Campos mínimos para lista
const selectList = {
  id: true,
  id_ficha_subida: true,
  nombre_ficha: true,
  nombre_slug: true,
  ambito_nivel: true,
  ambito_ccaa_id: true,
  ambito_provincia_id: true,
  created_at: true,
  updated_at: true,
  vencimiento: true,
  tramite_tipo: true,
  complejidad: true,
  existe_frase: true,
  enlace_base_id: true,
} as const;

export async function GET(req: NextRequest) {
  const { error } = await requirePermission(req, "fichas", "read");
  if (error) return error;

  const sp = req.nextUrl.searchParams;

  // --- paginación
  const take = Math.min(Number(sp.get("take") ?? 20), 100);
  const skip = Math.max(Number(sp.get("skip") ?? 0), 0);

  // keyset pagination (recomendada para páginas profundas)
  const cursorId = sp.get("cursor_id");                // string | null
  const cursorCreatedAt = sp.get("cursor_created_at"); // ISO string | null

  // relaciones / count opcionales
  const withRelations = sp.get("withRelations") === "true";
  const withCount = sp.get("withCount") === "true";

  // --- orden (indexado)
  const orderBy = [
    { created_at: "desc" as const },
    { id: "desc" as const },
  ];

  // =====================  FILTROS  =====================
  const where: any = {};

  // 0) Texto libre (en nombre_ficha / frase_publicitaria / texto_divulgacion)
  const q = (sp.get("q") ?? "").trim();
  if (q) {
    where.OR = [
      { nombre_ficha: { contains: q } },
      { frase_publicitaria: { contains: q } },
      { texto_divulgacion: { contains: q } },
    ];
  }

  // 1) Nombre de la ayuda (exacto / parcial)
  const nombre = (sp.get("nombre") ?? "").trim();
  const q_nombre = (sp.get("q_nombre") ?? "").trim();
  if (nombre) {
    where.nombre_ficha = nombre; // exacto (rápido)
  } else if (q_nombre) {
    where.nombre_ficha = { contains: q_nombre }; // parcial
  }

  // 2) Ámbito
  const ambito = sp.get("ambito") as "UE" | "ESTADO" | "CCAA" | "PROVINCIA" | null;
  if (ambito) where.ambito_nivel = ambito;

  // 3) Tipo de trámite
  const tramite_tipo = sp.get("tramite_tipo") as "no" | "si" | "directo" | null;
  if (tramite_tipo) where.tramite_tipo = tramite_tipo;

  // 4) Mes (YYYY-MM) => rango [inicio_mes, fin_mes]
  const mes = sp.get("mes");
  let mesDesde: Date | null = null;
  let mesHasta: Date | null = null;
  if (mes && /^\d{4}-\d{2}$/.test(mes)) {
    const [Y, M] = mes.split("-").map(Number);
    // UTC para evitar desfases de TZ
    mesDesde = new Date(Date.UTC(Y, M - 1, 1, 0, 0, 0));
    mesHasta = new Date(Date.UTC(Y, M, 0, 23, 59, 59)); // último día del mes
  }

  // 5) Rango de fechas libre (created_at)
  const created_desde = sp.get("created_desde"); // YYYY-MM-DD
  const created_hasta = sp.get("created_hasta");
  const rangoDesde = created_desde ? new Date(created_desde + "T00:00:00Z") : null;
  const rangoHasta = created_hasta ? new Date(created_hasta + "T23:59:59Z") : null;

  if (mesDesde || mesHasta || rangoDesde || rangoHasta) {
    where.created_at = {};
    const d1 = mesDesde ?? rangoDesde;
    const d2 = mesHasta ?? rangoHasta;
    if (d1) where.created_at.gte = d1;
    if (d2) where.created_at.lte = d2;
  }

  // 6) Localización / otros campos
  const ccaa_id = sp.get("ccaa_id");
  if (ccaa_id) where.ambito_ccaa_id = Number(ccaa_id);

  const provincia_id = sp.get("provincia_id");
  if (provincia_id) where.ambito_provincia_id = Number(provincia_id);

  const existe_frase = sp.get("existe_frase");
  if (existe_frase === "true") where.existe_frase = true;
  if (existe_frase === "false") where.existe_frase = false;

  const complejidad = sp.get("complejidad") as "baja" | "media" | "alta" | null;
  if (complejidad) where.complejidad = complejidad;

  // 7) Trabajador (por id o por nombre)
  const trabajador_id = sp.get("trabajador_id");
  const trabajador_nombre_raw = (sp.get("trabajador_nombre") ?? "").trim();
  let trabajador_nombre = trabajador_nombre_raw;
  // limpia comillas si vienen en la URL
  if (
    (trabajador_nombre.startsWith('"') && trabajador_nombre.endsWith('"')) ||
    (trabajador_nombre.startsWith("'") && trabajador_nombre.endsWith("'"))
  ) {
    trabajador_nombre = trabajador_nombre.slice(1, -1).trim();
  }

  if (trabajador_id) {
    where.trabajador_id = Number(trabajador_id);
  } else if (trabajador_nombre) {
    // subconsulta para obtener IDs por nombre (parcial)
    const mats = await prisma.trabajadores.findMany({
      where: { nombre: { contains: trabajador_nombre } },
      select: { id: true },
    });
    const ids = mats.map((m) => m.id);
    if (ids.length === 0) {
      // no hay coincidencias → devolvemos vacío de forma inmediata
      return NextResponse.json(serialize({ items: [], total: withCount ? 0 : undefined, nextCursor: null }));
    }
    where.trabajador_id = { in: ids };
  }

  // =====================  QUERY BASE  =====================
  const baseQuery: any = { where, orderBy, select: selectList };

  if (withRelations) {
    baseQuery.include = {
      ficha_portal: { include: { portales: { select: { id: true, nombre: true } } } },
      ficha_tematica: { include: { tematicas: { select: { id: true, nombre: true } } } },
    };
    delete baseQuery.select;
  }

  // --- keyset emulado por condición (sin PK compuesta)
  if (cursorId && cursorCreatedAt) {
    const cId = Number(cursorId);
    const cAt = new Date(cursorCreatedAt);
    baseQuery.where = {
      AND: [
        where,
        {
          OR: [
            { created_at: { lt: cAt } },
            { AND: [{ created_at: cAt }, { id: { lt: cId } }] },
          ],
        },
      ],
    };
  } else {
    baseQuery.skip = skip; // compat con paginación clásica
  }
  baseQuery.take = take;

  // =====================  EJECUCIÓN  =====================
  const [items, total] = await Promise.all([
    prisma.fichas.findMany(baseQuery),
    withCount ? prisma.fichas.count({ where }) : Promise.resolve(0),
  ]);

  // nextCursor para keyset (si hay más)
  let nextCursor: { cursor_id: string; cursor_created_at: string } | null = null;
  if (items.length === take) {
    const last: any = items[items.length - 1];
    nextCursor = {
      cursor_id: String(last.id),
      cursor_created_at: new Date(last.created_at).toISOString(),
    };
  }

  return NextResponse.json(serialize({ items, total: withCount ? total : undefined, nextCursor }));
}
