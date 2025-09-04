import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/db";
import { serialize } from "@/lib/utils/serialize";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  try {
    // Obtener todos los redactores únicos que no sean null ni vacíos
    const redactores = await prisma.fichas.findMany({
      where: {
        redactor: {
          not: null,
          not: ""
        }
      },
      select: {
        redactor: true
      },
      distinct: ['redactor']
    });

    // Extraer solo los nombres únicos y filtrar nulls
    const nombresRedactores = redactores
      .map(r => r.redactor)
      .filter(Boolean)
      .sort();

    return NextResponse.json(serialize(nombresRedactores));
  } catch (error) {
    console.error("Error fetching redactores:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}