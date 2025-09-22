import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/db";
import { serialize } from "@/lib/utils/serialize";
import { requirePermission } from "@/lib/utils/api-guard";

export const runtime = "nodejs";

// PUT - Actualizar trabajador
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requirePermission(req, "admin", "write");
    if (error) return error;

    const { nombre, activo } = await req.json();
    const trabajadorId = Number(params.id);

    if (!nombre?.trim()) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
    }

    // Verificar que el trabajador existe
    const trabajadorExistente = await prisma.trabajadores.findUnique({
      where: { id: trabajadorId }
    });

    if (!trabajadorExistente) {
      return NextResponse.json({ error: "Trabajador no encontrado" }, { status: 404 });
    }

    // Generar nuevo slug si cambió el nombre
    let slug = trabajadorExistente.slug;
    if (nombre.trim() !== trabajadorExistente.nombre) {
      slug = nombre.toLowerCase()
        .replace(/[áàäâ]/g, 'a')
        .replace(/[éèëê]/g, 'e')
        .replace(/[íìïî]/g, 'i')
        .replace(/[óòöô]/g, 'o')
        .replace(/[úùüû]/g, 'u')
        .replace(/ñ/g, 'n')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 60);
    }

    const trabajadorActualizado = await prisma.trabajadores.update({
      where: { id: trabajadorId },
      data: {
        nombre: nombre.trim(),
        slug,
        ...(typeof activo === 'boolean' && { activo })
      }
    });

    return NextResponse.json(serialize({ trabajador: trabajadorActualizado }));
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Ya existe un trabajador con ese nombre" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Eliminar trabajador
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requirePermission(req, "admin", "write");
    if (error) return error;

    const trabajadorId = Number(params.id);

    // Verificar que el trabajador existe
    const trabajador = await prisma.trabajadores.findUnique({
      where: { id: trabajadorId }
    });

    if (!trabajador) {
      return NextResponse.json({ error: "Trabajador no encontrado" }, { status: 404 });
    }

    // Verificar si tiene fichas asignadas
    const fichasAsignadas = await prisma.fichas.count({
      where: {
        OR: [
          { trabajador_id: trabajadorId },
          { trabajador_subida_id: trabajadorId }
        ]
      }
    });

    if (fichasAsignadas > 0) {
      return NextResponse.json({ 
        error: `No se puede eliminar. El trabajador tiene ${fichasAsignadas} fichas asignadas. Desactívalo en su lugar.` 
      }, { status: 409 });
    }

    await prisma.trabajadores.delete({
      where: { id: trabajadorId }
    });

    return NextResponse.json({ message: "Trabajador eliminado correctamente" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}