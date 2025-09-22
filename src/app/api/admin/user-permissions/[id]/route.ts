import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/db";
import { serialize } from "@/lib/utils/serialize";
import { requirePermission } from "@/lib/utils/api-guard";

export const runtime = "nodejs";

// PUT - Cambiar rol de usuario
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, user: currentUser } = await requirePermission(req, "admin", "write");
    if (error) return error;

    const { role } = await req.json();
    const userId = Number(params.id);

    if (!role || !["ADMIN", "EDITOR", "VIEWER"].includes(role)) {
      return NextResponse.json({ error: "Role inválido" }, { status: 400 });
    }

    // Verificar que el usuario existe
    const targetUser = await prisma.user_permissions.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Evitar que un admin se quite permisos a sí mismo
    if (targetUser.email === currentUser.email && targetUser.role === "ADMIN" && role !== "ADMIN") {
      return NextResponse.json({ 
        error: "No puedes quitarte permisos de ADMIN a ti mismo" 
      }, { status: 403 });
    }

    // Verificar que no se elimine el último admin
    if (targetUser.role === "ADMIN" && role !== "ADMIN") {
      const adminCount = await prisma.user_permissions.count({
        where: { role: "ADMIN" }
      });
      
      if (adminCount <= 1) {
        return NextResponse.json({ 
          error: "Debe existir al menos un ADMIN en el sistema" 
        }, { status: 403 });
      }
    }

    const updatedUser = await prisma.user_permissions.update({
      where: { id: userId },
      data: { role }
    });

    return NextResponse.json(serialize({ user: updatedUser }));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Eliminar usuario
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, user: currentUser } = await requirePermission(req, "admin", "write");
    if (error) return error;

    const userId = Number(params.id);

    const targetUser = await prisma.user_permissions.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Evitar que un admin se elimine a sí mismo
    if (targetUser.email === currentUser.email) {
      return NextResponse.json({ 
        error: "No puedes eliminar tu propio acceso" 
      }, { status: 403 });
    }

    // Verificar que no se elimine el último admin
    if (targetUser.role === "ADMIN") {
      const adminCount = await prisma.user_permissions.count({
        where: { role: "ADMIN" }
      });
      
      if (adminCount <= 1) {
        return NextResponse.json({ 
          error: "No se puede eliminar el último ADMIN del sistema" 
        }, { status: 403 });
      }
    }

    await prisma.user_permissions.delete({
      where: { id: userId }
    });

    return NextResponse.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}