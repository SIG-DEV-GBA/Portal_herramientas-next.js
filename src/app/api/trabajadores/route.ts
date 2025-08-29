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

// GET - Listar todos los trabajadores
export async function GET(req: NextRequest) {
  try {
    const { error } = await requirePermission(req, "trabajadores", "read");
    if (error) return error;

    const sp = req.nextUrl.searchParams;
    const soloActivos = sp.get("solo_activos") === "true";

    const where = soloActivos ? { activo: true } : {};

    const trabajadores = await prisma.trabajadores.findMany({
      where,
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        slug: true,
        nombre: true,
        activo: true,
      }
    });

    return NextResponse.json(serialize(trabajadores));
  } catch (error) {
    console.error("Error in GET /api/trabajadores:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo trabajador
export async function POST(req: NextRequest) {
  try {
    const { error } = await requirePermission(req, "trabajadores", "create");
    if (error) return error;

    const body = await req.json();
    const { nombre, activo = true } = body;

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
      const existingTrabajador = await prisma.trabajadores.findUnique({
        where: { slug: uniqueSlug }
      });
      
      if (!existingTrabajador) {
        slug = uniqueSlug;
        break;
      }
      
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    const trabajador = await prisma.trabajadores.create({
      data: { slug, nombre, activo }
    });

    return NextResponse.json(serialize(trabajador), { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/trabajadores:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}