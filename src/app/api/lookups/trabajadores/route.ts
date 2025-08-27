// src/app/api/lookups/trabajadores/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  // por defecto solo activos; si pasas ?solo_activos=false te trae todos
  const soloActivos = sp.get("solo_activos") !== "false";
  const q = sp.get("q")?.trim();

  const where: any = {};
  if (soloActivos) where.activo = true;           // ✅ Boolean, no 1/0
  if (q) where.nombre = { contains: q };

  const trabajadores = await prisma.trabajadores.findMany({
    where,
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, activo: true },
  });

  return NextResponse.json(trabajadores);
}
