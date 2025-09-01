import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serialize } from "@/lib/serialize";
import { requirePermission } from "@/lib/api-guard";

export const runtime = "nodejs";

// GET - Listar usuarios (solo ADMIN)
export async function GET(req: NextRequest) {
  try {
    const { error } = await requirePermission(req, "users", "read");
    if (error) return error;

    const users = await prisma.user_permissions.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true
      }
    });

    return NextResponse.json(serialize({ users }));
  } catch (error) {
    console.error("Error in GET /api/users:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo usuario (solo ADMIN)
export async function POST(req: NextRequest) {
  try {
    const { error } = await requirePermission(req, "users", "create");
    if (error) return error;

    const body = await req.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email y rol son requeridos" },
        { status: 400 }
      );
    }

    if (!["ADMIN", "EDITOR", "VIEWER"].includes(role)) {
      return NextResponse.json(
        { error: "Rol inválido. Debe ser ADMIN, EDITOR o VIEWER" },
        { status: 400 }
      );
    }

    // Verificar que el email no existe
    const existingUser = await prisma.user_permissions.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "El usuario ya existe" },
        { status: 409 }
      );
    }

    // Crear usuario
    const newUser = await prisma.user_permissions.create({
      data: { email, role: role as 'ADMIN' | 'EDITOR' | 'VIEWER' },
      select: {
        id: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true
      }
    });

    return NextResponse.json(serialize({ user: newUser }), { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/users:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}