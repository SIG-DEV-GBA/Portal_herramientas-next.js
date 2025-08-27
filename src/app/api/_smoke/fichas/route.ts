import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { serialize } from "@/lib/serialize";
const prisma = new PrismaClient();

export async function GET() {
  // fallback por si el editor aún no refrescó tipos
  const fichas = (prisma as any).fichas ?? (prisma as any).ficha;
  const rows = await fichas.findMany({
    orderBy: { created_at: "desc" },
    take: 5,
    include: {
      ficha_portal: { include: { portales: true } },
      ficha_tematica: { include: { tematicas: true } },
    },
  });
  return NextResponse.json(serialize(rows));
}
