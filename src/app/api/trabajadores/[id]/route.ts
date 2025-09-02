import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/db";
import { serialize } from "@/lib/utils/serialize";
import { requirePermission } from "@/lib/utils/api-guard";

// Función para generar slug a partir del nombre
function generateSlug(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remover acentos
    .replace(/[^a-z0-9\s-]/g, "") // Solo letras, números, espacios y guiones
    .trim()
    .replace(/\s+/g, "-") // Reemplazar espacios con guiones
    .replace(/-+/g, "-"); // Eliminar guiones múltiples
}

export const runtime = "nodejs";

// PUT - Actualizar trabajador
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requirePermission(req, "trabajadores", "update");
    if (error) return error;

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();
    const { nombre, activo } = body;

    if (!nombre) {
      return NextResponse.json(
        { error: "Nombre es requerido" },
        { status: 400 }
      );
    }

    // Generar slug automáticamente
    let slug = generateSlug(nombre);

    // Verificar que el trabajador existe
    const existingTrabajador = await prisma.trabajadores.findUnique({
      where: { id }
    });

    if (!existingTrabajador) {
      return NextResponse.json(
        { error: "Trabajador no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el slug sea único (excepto para el trabajador actual), si no, agregar número
    let counter = 1;
    let uniqueSlug = slug;
    
    while (true) {
      const duplicateSlug = await prisma.trabajadores.findUnique({
        where: { slug: uniqueSlug }
      });
      
      if (!duplicateSlug || duplicateSlug.id === id) {
        slug = uniqueSlug;
        break;
      }
      
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    const trabajador = await prisma.trabajadores.update({
      where: { id },
      data: { slug, nombre, activo: Boolean(activo) }
    });

    return NextResponse.json(serialize(trabajador));
  } catch (error) {
    console.error("Error in PUT /api/trabajadores/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar trabajador
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requirePermission(req, "trabajadores", "delete");
    if (error) return error;

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Verificar que el trabajador existe
    const existingTrabajador = await prisma.trabajadores.findUnique({
      where: { id }
    });

    if (!existingTrabajador) {
      return NextResponse.json(
        { error: "Trabajador no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si tiene fichas asociadas como redactor
    const fichasRedactorCount = await prisma.fichas.count({
      where: { trabajador_id: id }
    });

    // Verificar si tiene fichas asociadas como subidor
    const fichasSubidorCount = await prisma.fichas.count({
      where: { trabajador_subida_id: id }
    });

    const totalFichas = fichasRedactorCount + fichasSubidorCount;

    if (totalFichas > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar el trabajador porque tiene ${totalFichas} fichas asociadas` },
        { status: 400 }
      );
    }

    await prisma.trabajadores.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/trabajadores/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}