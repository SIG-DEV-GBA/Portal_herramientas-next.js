import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export const runtime = "nodejs";
export async function GET() {
  return NextResponse.json(await prisma.ccaa.findMany({ orderBy: { nombre: "asc" } }));
}
