import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Buscar el primer portal
    const portal = await prisma.portales.findFirst();
    if (!portal) {
      return NextResponse.json({ error: "No portal found" });
    }

    // Buscar fichas con destaque que no tienen portales
    const count = await prisma.$executeRaw`
      INSERT INTO ficha_portal (ficha_id, portal_id)
      SELECT DISTINCT f.id, ${portal.id}
      FROM fichas f
      LEFT JOIN ficha_portal fp ON fp.ficha_id = f.id
      WHERE (f.destaque_principal IS NOT NULL OR f.destaque_secundario IS NOT NULL)
        AND fp.ficha_id IS NULL
      LIMIT 20
    `;

    return NextResponse.json({
      message: "Portal relationships added",
      portal_id: portal.id,
      portal_slug: portal.slug,
      rows_affected: count
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}