import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/db";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const ccaa_id = req.nextUrl.searchParams.get("ccaa_id");
  const where = ccaa_id ? { ccaa_id: Number(ccaa_id) } : {};
  return NextResponse.json(await prisma.provincias.findMany({ where, orderBy: { nombre: "asc" } }));
}
