// src/app/api/apps/gestor-fichas/fichas/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/db";
import { serialize } from "@/lib/utils/serialize";
import { requirePermission } from "@/lib/utils/api-guard";

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
  ambito_municipal: true,
  created_at: true,
  updated_at: true,
  vencimiento: true,
  fecha_redaccion: true,
  fecha_subida_web: true,
  trabajador_id: true,
  trabajador_subida_id: true,
  tramite_tipo: true,
  complejidad: true,
  enlace_base_id: true,
  enlace_seg_override: true,
  frase_publicitaria: true,
  destaque_principal: true,
  destaque_secundario: true,
} as const;

export async function GET(req: NextRequest) {
  try {
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
  const where: Record<string, any> = {};

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

  // 4) Año (YYYY) => rango [inicio_año, fin_año]
  const anio = sp.get("anio");
  let anioDesde: Date | null = null;
  let anioHasta: Date | null = null;
  if (anio && /^\d{4}$/.test(anio)) {
    const Y = Number(anio);
    anioDesde = new Date(Date.UTC(Y, 0, 1, 0, 0, 0)); // 1 enero
    anioHasta = new Date(Date.UTC(Y, 11, 31, 23, 59, 59)); // 31 diciembre
  }

  // 5) Mes (YYYY-MM) => rango [inicio_mes, fin_mes]
  const mes = sp.get("mes");
  let mesDesde: Date | null = null;
  let mesHasta: Date | null = null;
  if (mes && /^\d{4}-\d{2}$/.test(mes)) {
    const [Y, M] = mes.split("-").map(Number);
    // UTC para evitar desfases de TZ
    mesDesde = new Date(Date.UTC(Y, M - 1, 1, 0, 0, 0));
    mesHasta = new Date(Date.UTC(Y, M, 0, 23, 59, 59)); // último día del mes
  }

  // 6) Rango de fechas libre (created_at)
  const created_desde = sp.get("created_desde"); // YYYY-MM-DD
  const created_hasta = sp.get("created_hasta");
  const rangoDesde = created_desde ? new Date(created_desde + "T00:00:00Z") : null;
  const rangoHasta = created_hasta ? new Date(created_hasta + "T23:59:59Z") : null;

  if (anioDesde || anioHasta || mesDesde || mesHasta || rangoDesde || rangoHasta) {
    where.created_at = {};
    const d1 = anioDesde ?? mesDesde ?? rangoDesde;
    const d2 = anioHasta ?? mesHasta ?? rangoHasta;
    if (d1) where.created_at.gte = d1;
    if (d2) where.created_at.lte = d2;
  }

  // 7) Localización / otros campos
  const ccaa_id = sp.get("ccaa_id");
  if (ccaa_id) where.ambito_ccaa_id = Number(ccaa_id);

  const provincia_id = sp.get("provincia_id");
  if (provincia_id) {
    where.ambito_provincia_id = Number(provincia_id); // Filtro restrictivo original
  }

  const provincia_principal = sp.get("provincia_principal");
  if (provincia_principal) {
    const { getProvinciaInclusiveFilter } = await import('@/lib/utils/provincia-filter');
    const provinciaFilter = await getProvinciaInclusiveFilter(Number(provincia_principal));
    if (provinciaFilter) {
      where.OR = provinciaFilter.OR;
    }
  }

  const complejidad = sp.get("complejidad") as "baja" | "media" | "alta" | null;
  if (complejidad) where.complejidad = complejidad;

  // 8) Trabajador (por id o por nombre)
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
  const baseQuery: Record<string, any> = { where, orderBy, select: selectList };

  if (withRelations) {
    baseQuery.include = {
      ficha_portal: { include: { portales: { select: { id: true, nombre: true, slug: true } } } },
      ficha_tematica: { include: { tematicas: { select: { id: true, nombre: true, slug: true } } } },
      ccaa: { select: { id: true, nombre: true, codigo_ine: true } },
      provincias: { select: { id: true, nombre: true, codigo_ine: true } },
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

  // Si necesitamos relaciones, obtener trabajadores y enlaces base por separado
  if (withRelations && items.length > 0) {
    const trabajadorIds = [...new Set(
      items.flatMap(item => [item.trabajador_id, item.trabajador_subida_id].filter(Boolean))
    )];
    
    const enlaceBaseIds = [...new Set(
      items.map(item => item.enlace_base_id).filter(Boolean)
    )];
    
    const [trabajadores, enlacesBase] = await Promise.all([
      trabajadorIds.length > 0 ? prisma.trabajadores.findMany({
        where: { id: { in: trabajadorIds } },
        select: { id: true, nombre: true, slug: true }
      }) : Promise.resolve([]),
      
      enlaceBaseIds.length > 0 ? prisma.enlaces_base.findMany({
        where: { id: { in: enlaceBaseIds } },
        select: { id: true, nombre: true, base_url: true }
      }) : Promise.resolve([])
    ]);
    
    const trabajadoresMap = new Map(trabajadores.map(t => [t.id, t]));
    const enlacesBaseMap = new Map(enlacesBase.map(e => [e.id, e]));
    
    // Añadir trabajadores y enlaces base a cada item
    items.forEach((item: Record<string, any>) => {
      if (item.trabajador_id) {
        item.trabajadores = trabajadoresMap.get(item.trabajador_id) || null;
      }
      if (item.trabajador_subida_id) {
        item.trabajadores_trabajador_subida_idTotrabajadores = trabajadoresMap.get(item.trabajador_subida_id) || null;
      }
      if (item.enlace_base_id) {
        item.enlaces_base = enlacesBaseMap.get(item.enlace_base_id) || null;
      }
    });
  }

  // nextCursor para keyset (si hay más)
  let nextCursor: { cursor_id: string; cursor_created_at: string } | null = null;
  if (items.length === take) {
    const last = items[items.length - 1] as Record<string, any>;
    nextCursor = {
      cursor_id: String(last.id),
      cursor_created_at: new Date(last.created_at).toISOString(),
    };
  }

  return NextResponse.json(serialize({ items, total: withCount ? total : undefined, nextCursor }));
  } catch (error) {
    console.error("Error in /api/apps/gestor-fichas/fichas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error } = await requirePermission(req, "fichas", "create");
    if (error) return error;

    const data = await req.json();

    // Validación básica de campos obligatorios
    if (!data.nombre_ficha?.trim()) {
      return NextResponse.json({ error: "El nombre de la ficha es obligatorio" }, { status: 400 });
    }

    if (!data.id_ficha_subida?.trim()) {
      return NextResponse.json({ error: "El ID de ficha subida es obligatorio" }, { status: 400 });
    }

    if (!data.ambito_nivel || !['UE', 'ESTADO', 'CCAA', 'PROVINCIA'].includes(data.ambito_nivel)) {
      return NextResponse.json({ error: "El ámbito territorial es obligatorio y debe ser válido" }, { status: 400 });
    }

    // Verificar que el ID de ficha subida no existe ya
    const fichaExistente = await prisma.fichas.findFirst({
      where: { id_ficha_subida: data.id_ficha_subida.trim() },
      select: { id: true, nombre_ficha: true }
    });

    if (fichaExistente) {
      return NextResponse.json({ 
        error: `El ID "${data.id_ficha_subida.trim()}" ya existe en el sistema. Por favor, usa un ID único diferente.`, 
        details: `Este ID ya está en uso por la ficha: "${fichaExistente.nombre_ficha}"` 
      }, { status: 409 });
    }

    // Preparar datos para inserción
    const fichaData: Record<string, any> = {
      id_ficha_subida: data.id_ficha_subida, // Prisma manejará la conversión a Decimal
      nombre_ficha: data.nombre_ficha.trim(),
      nombre_slug: data.nombre_ficha.trim().toLowerCase()
        .replace(/[áàäâ]/g, 'a')
        .replace(/[éèëê]/g, 'e') 
        .replace(/[íìïî]/g, 'i')
        .replace(/[óòöô]/g, 'o')
        .replace(/[úùüû]/g, 'u')
        .replace(/ñ/g, 'n')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 100),
      ambito_nivel: data.ambito_nivel,
      trabajador_id: data.trabajador_id || null,
      trabajador_subida_id: data.trabajador_subida_id || null,
      tramite_tipo: data.tramite_tipo ? (() => {
        // Mapear valores del frontend a valores de BD
        switch(data.tramite_tipo) {
          case 'online': return 'si';
          case 'presencial': return 'no';
          case 'directo': return 'directo';
          default: return null;
        }
      })() : null,
      complejidad: data.complejidad && ['baja', 'media', 'alta'].includes(data.complejidad) ? data.complejidad : null,
      frase_publicitaria: data.frase_publicitaria?.trim() || null,
      texto_divulgacion: data.texto_divulgacion?.trim() || null,
      enlace_seg_override: data.enlace_seg_override?.trim() || null
    };

    // Solo agregar campos opcionales si tienen valores
    if (data.ambito_ccaa_id) {
      fichaData.ambito_ccaa_id = data.ambito_ccaa_id;
    }
    if (data.ambito_provincia_id) {
      fichaData.ambito_provincia_id = data.ambito_provincia_id;
    }
    if (data.ambito_municipal?.trim()) {
      fichaData.ambito_municipal = data.ambito_municipal.trim();
    }
    if (data.destaque_principal === true) {
      fichaData.destaque_principal = 'nueva';
    }
    if (data.destaque_secundario === true) {
      fichaData.destaque_secundario = 'para_publicitar';
    }
    if (data.enlace_base_id) {
      fichaData.enlace_base_id = data.enlace_base_id;
    }

    // Procesar fechas si vienen
    if (data.fecha_redaccion) {
      fichaData.fecha_redaccion = new Date(data.fecha_redaccion);
    }
    if (data.fecha_subida_web) {
      fichaData.fecha_subida_web = new Date(data.fecha_subida_web);
    }
    if (data.vencimiento) {
      fichaData.vencimiento = new Date(data.vencimiento);
    }

    // Crear la ficha principal
    const nuevaFicha = await prisma.fichas.create({
      data: fichaData,
      select: {
        id: true,
        nombre_ficha: true,
        nombre_slug: true,
        created_at: true,
        updated_at: true
      }
    });

    // Gestionar relaciones con portales si vienen
    if (data.portales && Array.isArray(data.portales) && data.portales.length > 0) {
      const portalRelations = data.portales.map((portalId: number) => ({
        ficha_id: Number(nuevaFicha.id),
        portal_id: portalId
      }));

      await prisma.ficha_portal.createMany({
        data: portalRelations
      });
    }

    // Gestionar relaciones con temáticas si vienen
    if (data.tematicas && Array.isArray(data.tematicas) && data.tematicas.length > 0) {
      const tematicaRelations = data.tematicas.map((item: any, index: number) => ({
        ficha_id: Number(nuevaFicha.id),
        tematica_id: typeof item === 'object' ? item.id : item,
        orden: typeof item === 'object' ? (item.orden || index + 1) : index + 1
      }));

      await prisma.ficha_tematica.createMany({
        data: tematicaRelations
      });
    }

    return NextResponse.json(serialize(nuevaFicha), { status: 201 });

  } catch (error: unknown) {
    console.error("Error creating ficha:", error);
    
    // Error de duplicado (constraint única)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      const meta = (error as any).meta;
      if (meta?.target?.includes('uq_fichas_id_ficha_subida')) {
        return NextResponse.json({ 
          error: "Ya existe una ficha con ese ID", 
          details: "El ID de ficha subida debe ser único en el sistema" 
        }, { status: 409 });
      }
      return NextResponse.json({ error: "Violación de constraint única en la base de datos" }, { status: 409 });
    }
    
    // Error de validación de Prisma
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2000') {
      return NextResponse.json({ error: "Datos inválidos proporcionados" }, { status: 400 });
    }
    
    // Error de constraint de BD
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      return NextResponse.json({ error: "Error de referencia: verifica que los IDs de trabajadores, CCAA, provincias existan" }, { status: 400 });
    }
    
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    console.error("Full error details:", error);
    
    return NextResponse.json(
      { error: "Error interno del servidor", details: errorMessage },
      { status: 500 }
    );
  }
}
