import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/db";
import { serialize } from "@/lib/utils/serialize";
import { requirePermission } from "@/lib/utils/api-guard";

export const runtime = "nodejs";

// GET - Listar usuarios con permisos
export async function GET(req: NextRequest) {
  try {
    const { error } = await requirePermission(req, "admin", "read");
    if (error) return error;

    const users = await prisma.user_permissions.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true
      },
      orderBy: [
        { role: "asc" }, // ADMIN primero
        { email: "asc" }
      ]
    });

    return NextResponse.json(serialize({ users }));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Crear nuevo usuario
export async function POST(req: NextRequest) {
  try {
    const { error } = await requirePermission(req, "admin", "write");
    if (error) return error;

    const { email, role } = await req.json();

    if (!email || !role) {
      return NextResponse.json({ error: "Email y role son requeridos" }, { status: 400 });
    }

    if (!["ADMIN", "EDITOR", "VIEWER"].includes(role)) {
      return NextResponse.json({ error: "Role inválido" }, { status: 400 });
    }

    const user = await prisma.user_permissions.create({
      data: { email, role }
    });

    return NextResponse.json(serialize({ user }));
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Este email ya tiene permisos asignados" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}