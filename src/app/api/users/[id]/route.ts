import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/db";
import { serialize } from "@/lib/utils/serialize";
import { requirePermission } from "@/lib/utils/api-guard";

export const runtime = "nodejs";

// GET - Obtener usuario específico (solo ADMIN)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requirePermission(req, "users", "read");
    if (error) return error;

    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const user = await prisma.user_permissions.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json(serialize({ user }));
  } catch (error) {
    console.error("Error in GET /api/users/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar usuario (solo ADMIN)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requirePermission(req, "users", "update");
    if (error) return error;

    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

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

    // Verificar que el usuario existe
    const existingUser = await prisma.user_permissions.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!existingUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Verificar que el email no está en uso por otro usuario
    const emailCheck = await prisma.user_permissions.findFirst({
      where: { 
        email,
        NOT: { id }
      },
      select: { id: true }
    });

    if (emailCheck) {
      return NextResponse.json(
        { error: "El email ya está en uso por otro usuario" },
        { status: 409 }
      );
    }

    // Actualizar usuario
    const updatedUser = await prisma.user_permissions.update({
      where: { id },
      data: { 
        email, 
        role: role as 'ADMIN' | 'EDITOR' | 'VIEWER'
      },
      select: {
        id: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true
      }
    });

    return NextResponse.json(serialize({ user: updatedUser }));
  } catch (error) {
    console.error("Error in PUT /api/users/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar usuario (solo ADMIN)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requirePermission(req, "users", "delete");
    if (error) return error;

    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Verificar que el usuario existe y eliminarlo en una sola operación
    const deletedUser = await prisma.user_permissions.delete({
      where: { id },
      select: {
        id: true,
        email: true
      }
    }).catch(() => null);

    if (!deletedUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json(serialize({ 
      message: "Usuario eliminado exitosamente",
      deletedUser
    }));
  } catch (error) {
    console.error("Error in DELETE /api/users/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}