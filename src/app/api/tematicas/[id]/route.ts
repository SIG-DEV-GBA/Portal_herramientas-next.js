import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serialize } from "@/lib/serialize";
import { requirePermission } from "@/lib/api-guard";

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

// PUT - Actualizar temática
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requirePermission(req, "tematicas", "update");
    if (error) return error;

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();
    const { nombre } = body;

    if (!nombre) {
      return NextResponse.json(
        { error: "Nombre es requerido" },
        { status: 400 }
      );
    }

    // Generar slug automáticamente
    let slug = generateSlug(nombre);

    // Verificar que la temática existe
    const existingTematica = await prisma.tematicas.findUnique({
      where: { id }
    });

    if (!existingTematica) {
      return NextResponse.json(
        { error: "Temática no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el slug sea único (excepto para la temática actual), si no, agregar número
    let counter = 1;
    let uniqueSlug = slug;
    
    while (true) {
      const duplicateSlug = await prisma.tematicas.findUnique({
        where: { slug: uniqueSlug }
      });
      
      if (!duplicateSlug || duplicateSlug.id === id) {
        slug = uniqueSlug;
        break;
      }
      
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    // Verificar que el nombre sea único (excepto para la temática actual)
    const duplicateNombre = await prisma.tematicas.findUnique({
      where: { nombre }
    });

    if (duplicateNombre && duplicateNombre.id !== id) {
      return NextResponse.json(
        { error: "Ya existe una temática con ese nombre" },
        { status: 400 }
      );
    }

    const tematica = await prisma.tematicas.update({
      where: { id },
      data: { slug, nombre }
    });

    return NextResponse.json(serialize(tematica));
  } catch (error) {
    console.error("Error in PUT /api/tematicas/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar temática
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requirePermission(req, "tematicas", "delete");
    if (error) return error;

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Verificar que la temática existe
    const existingTematica = await prisma.tematicas.findUnique({
      where: { id }
    });

    if (!existingTematica) {
      return NextResponse.json(
        { error: "Temática no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si tiene fichas asociadas
    const fichasCount = await prisma.ficha_tematica.count({
      where: { tematica_id: id }
    });

    if (fichasCount > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar la temática porque tiene ${fichasCount} fichas asociadas` },
        { status: 400 }
      );
    }

    await prisma.tematicas.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/tematicas/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}