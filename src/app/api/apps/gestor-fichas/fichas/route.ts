/**
 * API Endpoint para la gestión de fichas de ayudas
 * 
 * Este endpoint maneja las operaciones CRUD principales para las fichas:
 * - GET: Obtener lista paginada de fichas con filtros avanzados
 * - POST: Crear nuevas fichas con validaciones y relaciones
 * 
 * Características principales:
 * - Paginación con cursor para mejor rendimiento
 * - Filtros dinámicos por múltiples criterios
 * - Validación de permisos mediante API guard
 * - Gestión de relaciones many-to-many con portales y temáticas
 * - Búsqueda por texto libre y filtros específicos
 * - Ordenación personalizable por columnas
 * 
 * @author Sistema de Gestión de Fichas
 * @version 2.0
 */
// src/app/api/apps/gestor-fichas/fichas/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/db";
import { serialize } from "@/lib/utils/serialize";
import { requirePermission } from "@/lib/utils/api-guard";

export const runtime = "nodejs";

/**
 * Campos seleccionados para la vista de lista de fichas
 * Optimizado para rendimiento - solo campos necesarios para la interfaz
 */
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

/**
 * GET /api/apps/gestor-fichas/fichas
 * 
 * Obtiene una lista paginada de fichas con filtros opcionales
 * 
 * Query Parameters:
 * - take: Número de elementos por página (máx 100, default 20)
 * - skip: Número de elementos a saltar (para paginación offset)
 * - cursor_id, cursor_created_at: Para paginación con cursor (recomendado)
 * - withRelations: Incluir datos relacionados (portales, temáticas, etc.)
 * - withCount: Incluir contador total de resultados
 * - orderBy: Ordenación en formato "campo:dirección" (ej: "vencimiento:asc")
 * - q: Búsqueda de texto libre en nombre, frase publicitaria y divulgación
 * - nombre, q_nombre: Filtros por nombre de ficha (exacto o parcial)
 * - ambito: Filtro por ámbito territorial (UE, ESTADO, CCAA, PROVINCIA)
 * - tramite_tipo: Tipo de trámite (no, si, directo)
 * - anio: Filtro por año de creación (YYYY)
 * - mes: Filtro por mes específico (YYYY-MM)
 * - created_desde, created_hasta: Rango de fechas personalizado
 * - ccaa_id, provincia_id: Filtros por localización específica
 * - complejidad: Nivel de complejidad (baja, media, alta)
 * - trabajador_id, trabajador_nombre: Filtros por trabajador responsable
 * - destaque_principal, destaque_secundario: Filtros por etiquetas de destaque
 * 
 * @returns Lista paginada de fichas con metadatos de paginación
 */
export async function GET(req: NextRequest) {
  try {
    // Validar permisos de acceso
    const { error } = await requirePermission(req, "fichas", "read");
    if (error) return error;

  const sp = req.nextUrl.searchParams;

  // =====================  CONFIGURACIÓN DE PAGINACIÓN  =====================
  const take = Math.min(Number(sp.get("take") ?? 20), 100);
  const skip = Math.max(Number(sp.get("skip") ?? 0), 0);

  // keyset pagination (recomendada para páginas profundas)
  const cursorId = sp.get("cursor_id");                // string | null
  const cursorCreatedAt = sp.get("cursor_created_at"); // ISO string | null

  // relaciones / count opcionales
  const withRelations = sp.get("withRelations") === "true";
  const withCount = sp.get("withCount") === "true";

  // =====================  CONFIGURACIÓN DE ORDENACIÓN  =====================
  // Procesa el parámetro orderBy para ordenación dinámica por columnas válidas 
  const orderByParam = sp.get("orderBy"); // e.g., "vencimiento:asc" or "created_at:desc"
  let orderBy = [
    { created_at: "desc" as const },
    { id: "desc" as const },
  ];

  if (orderByParam) {
    const [field, direction] = orderByParam.split(":");
    const validFields = ["created_at", "nombre_ficha", "vencimiento", "fecha_redaccion", "fecha_subida_web"];
    const validDirections = ["asc", "desc"];
    
    if (validFields.includes(field) && validDirections.includes(direction)) {
      orderBy = [
        { [field]: direction as "asc" | "desc" },
        { id: "desc" as const }, // Secondary sort for consistency
      ];
    }
  }

  // =====================  PROCESAMIENTO DE FILTROS  =====================
  // Construye dinámicamente las condiciones WHERE basadas en los parámetros de consulta
  const where: Record<string, any> = {};

  // Filtro de búsqueda general por texto libre
  // Busca en los campos principales de contenido de la ficha
  const q = (sp.get("q") ?? "").trim();
  if (q) {
    where.OR = [
      { nombre_ficha: { contains: q } },
      { frase_publicitaria: { contains: q } },
      { texto_divulgacion: { contains: q } },
    ];
  }

  // Filtros específicos por nombre de ficha
  // Permite búsqueda exacta (optimizada) o parcial (flexible)
  const nombre = (sp.get("nombre") ?? "").trim();
  const q_nombre = (sp.get("q_nombre") ?? "").trim();
  if (nombre) {
    where.nombre_ficha = nombre; // exacto (rápido)
  } else if (q_nombre) {
    where.nombre_ficha = { contains: q_nombre }; // parcial
  }

  // Filtro por ámbito territorial de aplicación
  const ambito = sp.get("ambito") as "UE" | "ESTADO" | "CCAA" | "PROVINCIA" | null;
  if (ambito) where.ambito_nivel = ambito;

  // Filtro por modalidad de tramitación (online, presencial, directo)
  const tramite_tipo = sp.get("tramite_tipo") as "no" | "si" | "directo" | null;
  if (tramite_tipo) where.tramite_tipo = tramite_tipo;

  // Filtro temporal por año completo
  // Convierte año a rango de fechas UTC para evitar problemas de zona horaria
  const anio = sp.get("anio");
  let anioDesde: Date | null = null;
  let anioHasta: Date | null = null;
  if (anio && /^\d{4}$/.test(anio)) {
    const Y = Number(anio);
    anioDesde = new Date(Date.UTC(Y, 0, 1, 0, 0, 0)); // 1 enero
    anioHasta = new Date(Date.UTC(Y, 11, 31, 23, 59, 59)); // 31 diciembre
  }

  // Filtro temporal por mes específico
  // Calcula automáticamente el primer y último día del mes
  const mes = sp.get("mes");
  let mesDesde: Date | null = null;
  let mesHasta: Date | null = null;
  if (mes && /^\d{4}-\d{2}$/.test(mes)) {
    const [Y, M] = mes.split("-").map(Number);
    // UTC para evitar desfases de TZ
    mesDesde = new Date(Date.UTC(Y, M - 1, 1, 0, 0, 0));
    mesHasta = new Date(Date.UTC(Y, M, 0, 23, 59, 59)); // último día del mes
  }

  // Filtro por rango de fechas personalizado
  // Permite definir períodos específicos de análisis
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

  // Filtros por localización geográfica y otros campos específicos
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

  // Filtros por trabajador responsable
  // Permite búsqueda por ID específico o por nombre (subconsulta)
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

  // Filtro por trabajador que realizó la carga de la ficha
  const trabajador_subida_id = sp.get("trabajador_subida_id");
  if (trabajador_subida_id) {
    where.trabajador_subida_id = Number(trabajador_subida_id);
  }

  // Sistema de filtros por etiquetas de destaque
  // Utiliza lógica especializada para combinaciones de etiquetas
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
    console.log('DEBUG - Final where object:', JSON.stringify(where, null, 2));
  }

  // =====================  CONSTRUCCIÓN DE CONSULTA  =====================
  // Ensambla la consulta final con todos los filtros y configuraciones
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

  // Implementación de paginación con cursor para mejor rendimiento
  // Evita problemas de desplazamiento en datasets grandes
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

  // =====================  EJECUCIÓN DE CONSULTAS  =====================
  // Ejecuta consultas en paralelo para optimizar rendimiento
  const [items, total] = await Promise.all([
    prisma.fichas.findMany(baseQuery),
    withCount ? prisma.fichas.count({ where }) : Promise.resolve(0),
  ]);

  // Carga optimizada de relaciones mediante consultas separadas
  // Evita N+1 queries y mejora el rendimiento general
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

  // Generación de cursor para la siguiente página
  // Permite navegación eficiente en datasets grandes
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

/**
 * POST /api/apps/gestor-fichas/fichas
 * 
 * Crea una nueva ficha de ayuda con validaciones completas
 * 
 * Características:
 * - Validación de campos obligatorios y formatos
 * - Generación automática de slug único para URLs amigables
 * - Verificación de unicidad del ID de ficha subida
 * - Gestión automática de relaciones many-to-many
 * - Procesamiento de fechas y transformación de datos
 * - Manejo robusto de errores con mensajes específicos
 * 
 * Body (JSON):
 * {
 *   "nombre_ficha": string (requerido),
 *   "id_ficha_subida": string (requerido, único),
 *   "ambito_nivel": "UE"|"ESTADO"|"CCAA"|"PROVINCIA" (requerido),
 *   "trabajador_id": number (opcional),
 *   "tramite_tipo": "online"|"presencial"|"directo" (opcional),
 *   "complejidad": "baja"|"media"|"alta" (opcional),
 *   "portales": number[] (opcional),
 *   "tematicas": Array<{id: number, orden?: number}> (opcional),
 *   "fecha_redaccion": string ISO date (opcional),
 *   "vencimiento": string ISO date (opcional),
 *   ...
 * }
 * 
 * @returns Datos de la ficha creada con ID asignado
 */
export async function POST(req: NextRequest) {
  try {
    // Validar permisos de creación
    const { error } = await requirePermission(req, "fichas", "create");
    if (error) return error;

    const data = await req.json();

    // =====================  VALIDACIONES DE ENTRADA  =====================
    // Verificar que los campos obligatorios estén presentes y sean válidos
    if (!data.nombre_ficha?.trim()) {
      return NextResponse.json({ error: "El nombre de la ficha es obligatorio" }, { status: 400 });
    }

    if (!data.id_ficha_subida?.trim()) {
      return NextResponse.json({ error: "El ID de ficha subida es obligatorio" }, { status: 400 });
    }

    if (!data.ambito_nivel || !['UE', 'ESTADO', 'CCAA', 'PROVINCIA'].includes(data.ambito_nivel)) {
      return NextResponse.json({ error: "El ámbito territorial es obligatorio y debe ser válido" }, { status: 400 });
    }

    // Validación de unicidad del ID de ficha subida
    // Previene duplicados en el sistema
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

    // =====================  GENERACIÓN DE SLUG ÚNICO  =====================
    // Crear slug URL-friendly a partir del nombre de la ficha
    let baseSlug = data.nombre_ficha.trim().toLowerCase()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e') 
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);

    // Asegurar unicidad del slug con sistema de contadores automático
    let nombre_slug = baseSlug;
    let counter = 1;
    let slugExists = true;
    
    while (slugExists) {
      const existingSlug = await prisma.fichas.findFirst({
        where: { nombre_slug },
        select: { id: true }
      });
      
      if (!existingSlug) {
        slugExists = false;
      } else {
        nombre_slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // =====================  PREPARACIÓN DE DATOS  =====================
    // Construir objeto con datos validados y transformados
    const fichaData: Record<string, any> = {
      id_ficha_subida: data.id_ficha_subida, // Prisma manejará la conversión a Decimal
      nombre_ficha: data.nombre_ficha.trim(),
      nombre_slug,
      ambito_nivel: data.ambito_nivel,
      trabajador_id: data.trabajador_id || null,
      trabajador_subida_id: data.trabajador_subida_id || null,
      tramite_tipo: data.tramite_tipo ? (() => {
        // Transformar valores del frontend a esquema de base de datos
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

    // Agregar campos opcionales solo cuando tienen valores válidos
    // Evita insertar nulls innecesarios en la base de datos
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

    // Conversión y validación de campos de fecha
    // Asegurar formato ISO correcto para almacenamiento
    if (data.fecha_redaccion) {
      fichaData.fecha_redaccion = new Date(data.fecha_redaccion);
    }
    if (data.fecha_subida_web) {
      fichaData.fecha_subida_web = new Date(data.fecha_subida_web);
    }
    if (data.vencimiento) {
      fichaData.vencimiento = new Date(data.vencimiento);
    }

    // =====================  CREACIÓN DE FICHA PRINCIPAL  =====================
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

    // =====================  GESTIÓN DE RELACIONES  =====================
    // Crear relaciones many-to-many con portales
    if (data.portales && Array.isArray(data.portales) && data.portales.length > 0) {
      const portalRelations = data.portales.map((portalId: number) => ({
        ficha_id: Number(nuevaFicha.id),
        portal_id: portalId
      }));

      await prisma.ficha_portal.createMany({
        data: portalRelations
      });
    }

    // Crear relaciones many-to-many con temáticas (con orden)
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
    
    // =====================  MANEJO DE ERRORES ESPECÍFICOS  =====================
    // Error de violación de constraint de unicidad
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
    
    // Error de validación de tipos de datos
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2000') {
      return NextResponse.json({ error: "Datos inválidos proporcionados" }, { status: 400 });
    }
    
    // Error de integridad referencial (foreign keys inválidas)
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
