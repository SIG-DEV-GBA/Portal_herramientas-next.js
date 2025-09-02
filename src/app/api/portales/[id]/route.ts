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

// PUT - Actualizar portal
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requirePermission(req, "portales", "update");
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

    // Verificar que el portal existe
    const existingPortal = await prisma.portales.findUnique({
      where: { id }
    });

    if (!existingPortal) {
      return NextResponse.json(
        { error: "Portal no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el slug sea único (excepto para el portal actual), si no, agregar número
    let counter = 1;
    let uniqueSlug = slug;
    
    while (true) {
      const duplicateSlug = await prisma.portales.findUnique({
        where: { slug: uniqueSlug }
      });
      
      if (!duplicateSlug || duplicateSlug.id === id) {
        slug = uniqueSlug;
        break;
      }
      
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    const portal = await prisma.portales.update({
      where: { id },
      data: { slug, nombre }
    });

    return NextResponse.json(serialize(portal));
  } catch (error) {
    console.error("Error in PUT /api/portales/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar portal
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requirePermission(req, "portales", "delete");
    if (error) return error;

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Verificar que el portal existe
    const existingPortal = await prisma.portales.findUnique({
      where: { id }
    });

    if (!existingPortal) {
      return NextResponse.json(
        { error: "Portal no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si tiene fichas asociadas
    const fichasCount = await prisma.ficha_portal.count({
      where: { portal_id: id }
    });

    if (fichasCount > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar el portal porque tiene ${fichasCount} fichas asociadas` },
        { status: 400 }
      );
    }

    await prisma.portales.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/portales/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}