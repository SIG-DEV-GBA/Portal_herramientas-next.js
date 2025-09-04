import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/db";
import { serialize } from "@/lib/utils/serialize";
import { requirePermission } from "@/lib/utils/api-guard";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requirePermission(_req, "fichas", "read");
  if (error) return error;

  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const ficha = await prisma.fichas.findUnique({
    where: { id },
    select: {
      id: true,
      id_ficha_subida: true,
      nombre_ficha: true,
      nombre_slug: true,
      vencimiento: true,
      fecha_redaccion: true,
      fecha_subida_web: true,
      trabajador_id: true,
      trabajador_subida_id: true,
      ambito_nivel: true,
      ambito_ccaa_id: true,
      ambito_provincia_id: true,
      ambito_municipal: true,
      tramite_tipo: true,
      complejidad: true,
      complejidad_peso: true,
      enlace_base_id: true,
      enlace_seg_override: true,
      frase_publicitaria: true,
      texto_divulgacion: true,

      destaque_principal: true,
      destaque_secundario: true,
      created_at: true,
      updated_at: true,
      // relaciones con select mínimo
      ficha_portal: {
        select: {
          portal_id: true,
          portales: { select: { id: true, nombre: true } },
        },
      },
      ficha_tematica: {
        select: {
          tematica_id: true,
          orden: true,
          tematicas: { select: { id: true, nombre: true } },
        },
      },
    },
  });

  if (!ficha) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(serialize(ficha));
}

// Endpoint PUT para actualizar una ficha completa
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requirePermission(req, "fichas", "update");
    if (error) return error;

    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const data = await req.json();

    // Verificar que la ficha existe
    const fichaExistente = await prisma.fichas.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!fichaExistente) {
      return NextResponse.json({ error: "Ficha no encontrada" }, { status: 404 });
    }

    // Preparar datos para actualización (solo campos que vienen en el payload)
    const updateData: Record<string, any> = {};

    if (data.nombre_ficha?.trim()) {
      updateData.nombre_ficha = data.nombre_ficha.trim();
    }

    if (data.ambito_nivel && ['UE', 'ESTADO', 'CCAA', 'PROVINCIA'].includes(data.ambito_nivel)) {
      updateData.ambito_nivel = data.ambito_nivel;
    }

    if (data.tramite_tipo !== undefined) {
      if (data.tramite_tipo && ['si', 'no', 'directo'].includes(data.tramite_tipo)) {
        updateData.tramite_tipo = data.tramite_tipo;
      } else {
        updateData.tramite_tipo = null;
      }
    }

    if (data.complejidad !== undefined) {
      if (data.complejidad && ['baja', 'media', 'alta'].includes(data.complejidad)) {
        updateData.complejidad = data.complejidad;
      } else {
        updateData.complejidad = null;
      }
    }

    if (data.frase_publicitaria !== undefined) {
      updateData.frase_publicitaria = data.frase_publicitaria?.trim() || null;
    }

    if (data.texto_divulgacion !== undefined) {
      updateData.texto_divulgacion = data.texto_divulgacion?.trim() || null;
    }

    if (data.destaque_principal !== undefined) {
      if (data.destaque_principal && ['nueva', 'para_publicitar'].includes(data.destaque_principal)) {
        updateData.destaque_principal = data.destaque_principal;
      } else {
        updateData.destaque_principal = null;
      }
    }

    if (data.destaque_secundario !== undefined) {
      if (data.destaque_secundario && ['nueva', 'para_publicitar'].includes(data.destaque_secundario)) {
        updateData.destaque_secundario = data.destaque_secundario;
      } else {
        updateData.destaque_secundario = null;
      }
    }

    // Procesar fechas si vienen
    if (data.fecha_redaccion !== undefined) {
      updateData.fecha_redaccion = data.fecha_redaccion ? new Date(data.fecha_redaccion) : null;
    }
    if (data.fecha_subida_web !== undefined) {
      updateData.fecha_subida_web = data.fecha_subida_web ? new Date(data.fecha_subida_web) : null;
    }
    if (data.vencimiento !== undefined) {
      updateData.vencimiento = data.vencimiento ? new Date(data.vencimiento) : null;
    }

    // Otros campos opcionales
    if (data.trabajador_id !== undefined) {
      updateData.trabajador_id = data.trabajador_id || null;
    }
    if (data.trabajador_subida_id !== undefined) {
      updateData.trabajador_subida_id = data.trabajador_subida_id || null;
    }
    if (data.ambito_ccaa_id !== undefined) {
      updateData.ambito_ccaa_id = data.ambito_ccaa_id || null;
    }
    if (data.ambito_provincia_id !== undefined) {
      updateData.ambito_provincia_id = data.ambito_provincia_id || null;
    }
    if (data.ambito_municipal !== undefined) {
      updateData.ambito_municipal = data.ambito_municipal?.trim() || null;
    }
    if (data.enlace_seg_override !== undefined) {
      updateData.enlace_seg_override = data.enlace_seg_override?.trim() || null;
    }
    if (data.enlace_base_id !== undefined) {
      updateData.enlace_base_id = data.enlace_base_id || null;
    }

    const updated = await prisma.fichas.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nombre_ficha: true,
        destaque_principal: true,
        destaque_secundario: true,
        updated_at: true
      },
    });

    return NextResponse.json(serialize(updated));

  } catch (error: unknown) {
    console.error("Error updating ficha:", error);
    
    // Error de constraint de BD
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      return NextResponse.json({ error: "Error de referencia: verifica que los IDs de trabajadores, CCAA, provincias existan" }, { status: 400 });
    }
    
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    
    return NextResponse.json(
      { error: "Error interno del servidor", details: errorMessage },
      { status: 500 }
    );
  }
}

// Endpoint DELETE para eliminar una ficha
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requirePermission(req, "fichas", "delete");
    if (error) return error;

    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    // Verificar que la ficha existe
    const fichaExistente = await prisma.fichas.findUnique({
      where: { id },
      select: { 
        id: true, 
        nombre_ficha: true,
        // Verificar si tiene relaciones
        ficha_portal: { select: { ficha_id: true, portal_id: true } },
        ficha_tematica: { select: { ficha_id: true, tematica_id: true } }
      }
    });

    if (!fichaExistente) {
      return NextResponse.json({ error: "Ficha no encontrada" }, { status: 404 });
    }

    // Eliminar en una transacción para mantener integridad
    await prisma.$transaction(async (tx) => {
      // Eliminar relaciones primero
      await tx.ficha_portal.deleteMany({
        where: { ficha_id: id }
      });
      
      await tx.ficha_tematica.deleteMany({
        where: { ficha_id: id }
      });

      // Eliminar la ficha
      await tx.fichas.delete({
        where: { id }
      });
    });

    return NextResponse.json(serialize({ 
      message: "Ficha eliminada correctamente",
      deletedFicha: {
        id: fichaExistente.id,
        nombre_ficha: fichaExistente.nombre_ficha
      }
    }));

  } catch (error: unknown) {
    console.error("Error deleting ficha:", error);
    
    // Error de constraint de BD
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      return NextResponse.json({ error: "No se puede eliminar: la ficha tiene referencias en otras tablas" }, { status: 400 });
    }
    
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    
    return NextResponse.json(
      { error: "Error interno del servidor", details: errorMessage },
      { status: 500 }
    );
  }
}
