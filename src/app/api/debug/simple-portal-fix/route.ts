import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // Paso 1: Verificar portales disponibles
    const portales = await prisma.portales.findFirst({
      select: { id: true, slug: true }
    });

    if (!portales) {
      return NextResponse.json({ error: "No hay portales en la base de datos" });
    }

    // Paso 2: Buscar fichas de prueba sin portales
    const fichas = await prisma.$queryRaw`
      SELECT f.id, f.nombre_ficha, f.destaque_principal, f.destaque_secundario
      FROM fichas f
      LEFT JOIN ficha_portal fp ON fp.ficha_id = f.id
      WHERE f.nombre_ficha LIKE '%Ficha de prueba%'
        AND (f.destaque_principal IS NOT NULL OR f.destaque_secundario IS NOT NULL)
        AND fp.ficha_id IS NULL
      LIMIT 10
    `;

    // Paso 3: Agregar relación con el primer portal para cada ficha
    const results = [];
    for (const ficha of fichas as any[]) {
      try {
        await prisma.$executeRaw`
          INSERT INTO ficha_portal (ficha_id, portal_id) 
          VALUES (${ficha.id}, ${portales.id})
        `;
        results.push({
          ficha_id: ficha.id.toString(),
          nombre: ficha.nombre_ficha,
          portal_added: portales.slug
        });
      } catch (err) {
        results.push({
          ficha_id: ficha.id.toString(),
          error: err.message
        });
      }
    }

    // Paso 4: Verificar todas las fichas con destaque
    const verification = await prisma.$queryRaw`
      SELECT 
        f.id, 
        f.nombre_ficha,
        f.destaque_principal,
        f.destaque_secundario,
        COUNT(fp.portal_id) as portal_count
      FROM fichas f
      LEFT JOIN ficha_portal fp ON fp.ficha_id = f.id
      WHERE f.destaque_principal IS NOT NULL OR f.destaque_secundario IS NOT NULL
      GROUP BY f.id, f.nombre_ficha, f.destaque_principal, f.destaque_secundario
      ORDER BY f.created_at DESC
      LIMIT 20
    `;

    return NextResponse.json({
      message: "Portal relationships processed",
      portal_used: portales,
      results,
      verification
    });

  } catch (error) {
    console.error("Error in simple portal fix:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}