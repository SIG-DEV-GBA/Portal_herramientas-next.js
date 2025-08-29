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

// GET - Listar todos los portales
export async function GET(req: NextRequest) {
  try {
    const { error } = await requirePermission(req, "portales", "read");
    if (error) return error;

    const portales = await prisma.portales.findMany({
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        slug: true,
        nombre: true,
      }
    });

    return NextResponse.json(serialize(portales));
  } catch (error) {
    console.error("Error in GET /api/portales:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo portal
export async function POST(req: NextRequest) {
  try {
    const { error } = await requirePermission(req, "portales", "create");
    if (error) return error;

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

    // Verificar que el slug sea único, si no, agregar número
    let counter = 1;
    let uniqueSlug = slug;
    
    while (true) {
      const existingPortal = await prisma.portales.findUnique({
        where: { slug: uniqueSlug }
      });
      
      if (!existingPortal) {
        slug = uniqueSlug;
        break;
      }
      
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    const portal = await prisma.portales.create({
      data: { slug, nombre }
    });

    return NextResponse.json(serialize(portal), { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/portales:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}