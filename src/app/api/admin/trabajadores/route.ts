import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/db";
import { serialize } from "@/lib/utils/serialize";
import { requirePermission } from "@/lib/utils/api-guard";

export const runtime = "nodejs";

// GET - Listar trabajadores con paginación
export async function GET(req: NextRequest) {
  try {
    const { error } = await requirePermission(req, "admin", "read");
    if (error) return error;

    const sp = req.nextUrl.searchParams;
    const take = Math.min(Number(sp.get("take") ?? 20), 100);
    const skip = Math.max(Number(sp.get("skip") ?? 0), 0);
    const soloActivos = sp.get("solo_activos") === "true";

    const where = soloActivos ? { activo: true } : {};

    const [trabajadores, total] = await Promise.all([
      prisma.trabajadores.findMany({
        where,
        select: {
          id: true,
          slug: true,
          nombre: true,
          activo: true
        },
        orderBy: { nombre: "asc" },
        take,
        skip
      }),
      prisma.trabajadores.count({ where })
    ]);

    return NextResponse.json(serialize({ 
      trabajadores, 
      total,
      take,
      skip 
    }));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Crear nuevo trabajador
export async function POST(req: NextRequest) {
  try {
    const { error } = await requirePermission(req, "admin", "write");
    if (error) return error;

    const { nombre, activo = true } = await req.json();

    if (!nombre?.trim()) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
    }

    // Generar slug único
    const slug = nombre.toLowerCase()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 60);

    const trabajador = await prisma.trabajadores.create({
      data: {
        nombre: nombre.trim(),
        slug,
        activo
      }
    });

    return NextResponse.json(serialize({ trabajador }));
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Ya existe un trabajador con ese nombre" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}