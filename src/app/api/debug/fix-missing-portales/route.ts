import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/db";

export const runtime = "nodejs";

export async function POST() {
  try {
    // 1. Verificar el problema actual
    const estadoAntes = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_fichas,
        COUNT(DISTINCT fp.ficha_id) as fichas_con_portales
      FROM fichas f
      LEFT JOIN ficha_portal fp ON fp.ficha_id = f.id
    ` as any[];

    const totalFichas = Number(estadoAntes[0].total_fichas);
    const fichasConPortales = Number(estadoAntes[0].fichas_con_portales);
    const fichasSinPortales = totalFichas - fichasConPortales;

    // 2. Obtener el primer portal disponible
    const portal = await prisma.portales.findFirst({
      select: { id: true, slug: true }
    });

    if (!portal) {
      return NextResponse.json({ error: "No hay portales disponibles" }, { status: 400 });
    }

    // 3. Asignar el portal a todas las fichas que no tienen portales
    const result = await prisma.$executeRaw`
      INSERT IGNORE INTO ficha_portal (ficha_id, portal_id)
      SELECT f.id, ${portal.id}
      FROM fichas f
      LEFT JOIN ficha_portal fp ON fp.ficha_id = f.id
      WHERE fp.ficha_id IS NULL
    `;

    // 4. Verificar el resultado
    const estadoDespues = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_fichas,
        COUNT(DISTINCT fp.ficha_id) as fichas_con_portales
      FROM fichas f
      LEFT JOIN ficha_portal fp ON fp.ficha_id = f.id
    ` as any[];

    const fichasConPortalesDespues = Number(estadoDespues[0].fichas_con_portales);

    // 5. Verificar conteo para gráficos
    const fichasParaGraficos = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT f.id) as count
      FROM fichas f
      INNER JOIN ficha_portal fp ON fp.ficha_id = f.id
    ` as any[];

    return NextResponse.json({
      message: "Corrección de portales ejecutada exitosamente",
      antes: {
        total_fichas: totalFichas,
        fichas_con_portales: fichasConPortales,
        fichas_sin_portales: fichasSinPortales
      },
      despues: {
        total_fichas: Number(estadoDespues[0].total_fichas),
        fichas_con_portales: fichasConPortalesDespues,
        fichas_sin_portales: Number(estadoDespues[0].total_fichas) - fichasConPortalesDespues
      },
      portal_usado: portal,
      registros_insertados: Number(result),
      fichas_en_graficos: Number(fichasParaGraficos[0].count)
    });

  } catch (error) {
    console.error("Error corrigiendo portales:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}