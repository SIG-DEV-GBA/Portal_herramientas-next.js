import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export const runtime = "nodejs";
export async function GET() {
  const tematicas = await prisma.tematicas.findMany({ orderBy: { nombre: "asc" } });
  return NextResponse.json(tematicas, {
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=60'
    }
  });
}
