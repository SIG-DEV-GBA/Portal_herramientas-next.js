import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export const runtime = "nodejs";
export async function GET() {
  const portales = await prisma.portales.findMany({ orderBy: { nombre: "asc" } });
  return NextResponse.json(portales, {
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=60'
    }
  });
}
