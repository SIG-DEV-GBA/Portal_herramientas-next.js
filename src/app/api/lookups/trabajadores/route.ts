// src/app/api/lookups/trabajadores/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const soloActivos = sp.get("solo_activos") !== "false";
  const q = sp.get("q")?.trim() || "";
  let nombre = sp.get("nombre")?.trim() || "";

  // Normaliza: elimina comillas envolventes si vienen en la URL
  if ((nombre.startsWith('"') && nombre.endsWith('"')) || (nombre.startsWith("'") && nombre.endsWith("'"))) {
    nombre = nombre.slice(1, -1).trim();
  }

  const where: any = {};
  if (soloActivos) where.activo = true;

  if (nombre) {
    // match exacto (rápido). Si quieres case-insensitive en MySQL, usa COLLATE o lower():
    // where.nombre = { equals: nombre }; // (básico)
    where.nombre = nombre;
  } else if (q) {
    // búsqueda parcial
    where.nombre = { contains: q };
  }

  const trabajadores = await prisma.trabajadores.findMany({
    where,
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, activo: true },
  });

  return NextResponse.json(trabajadores);
}
