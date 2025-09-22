import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Contar todas las fichas con destaque que tienen portales
    const fichasConDestaque = await prisma.$queryRaw`
      SELECT 
        f.id,
        f.nombre_ficha,
        f.destaque_principal,
        f.destaque_secundario,
        COUNT(fp.portal_id) as num_portales,
        GROUP_CONCAT(p.slug) as portales_slugs
      FROM fichas f
      LEFT JOIN ficha_portal fp ON fp.ficha_id = f.id
      LEFT JOIN portales p ON p.id = fp.portal_id
      WHERE (f.destaque_principal IS NOT NULL OR f.destaque_secundario IS NOT NULL)
      GROUP BY f.id, f.nombre_ficha, f.destaque_principal, f.destaque_secundario
      ORDER BY f.created_at DESC
    `;

    // Conteos por tipo
    const conteos = await prisma.$queryRaw`
      SELECT 
        'total_con_destaque' as tipo,
        COUNT(*) as count
      FROM fichas f
      INNER JOIN ficha_portal fp ON fp.ficha_id = f.id
      WHERE (f.destaque_principal IS NOT NULL OR f.destaque_secundario IS NOT NULL)
      
      UNION ALL
      
      SELECT 
        'solo_nueva' as tipo,
        COUNT(*) as count
      FROM fichas f
      INNER JOIN ficha_portal fp ON fp.ficha_id = f.id
      WHERE (f.destaque_principal = 'nueva' OR f.destaque_secundario = 'nueva')
        AND NOT ((f.destaque_principal = 'nueva' AND f.destaque_secundario = 'para_publicitar') 
                 OR (f.destaque_principal = 'para_publicitar' AND f.destaque_secundario = 'nueva'))
      
      UNION ALL
      
      SELECT 
        'solo_para_publicitar' as tipo,
        COUNT(*) as count
      FROM fichas f
      INNER JOIN ficha_portal fp ON fp.ficha_id = f.id
      WHERE (f.destaque_principal = 'para_publicitar' OR f.destaque_secundario = 'para_publicitar')
        AND NOT ((f.destaque_principal = 'nueva' AND f.destaque_secundario = 'para_publicitar') 
                 OR (f.destaque_principal = 'para_publicitar' AND f.destaque_secundario = 'nueva'))
      
      UNION ALL
      
      SELECT 
        'ambas_etiquetas' as tipo,
        COUNT(*) as count
      FROM fichas f
      INNER JOIN ficha_portal fp ON fp.ficha_id = f.id
      WHERE (f.destaque_principal = 'nueva' AND f.destaque_secundario = 'para_publicitar')
         OR (f.destaque_principal = 'para_publicitar' AND f.destaque_secundario = 'nueva')
      
      UNION ALL
      
      SELECT 
        'todas_nueva_inclusivo' as tipo,
        COUNT(*) as count
      FROM fichas f
      INNER JOIN ficha_portal fp ON fp.ficha_id = f.id
      WHERE (f.destaque_principal = 'nueva' OR f.destaque_secundario = 'nueva')
      
      UNION ALL
      
      SELECT 
        'todas_para_publicitar_inclusivo' as tipo,
        COUNT(*) as count
      FROM fichas f
      INNER JOIN ficha_portal fp ON fp.ficha_id = f.id
      WHERE (f.destaque_principal = 'para_publicitar' OR f.destaque_secundario = 'para_publicitar')
    `;

    return NextResponse.json({
      message: "Debug de fichas con destaque",
      fichas_detalle: fichasConDestaque,
      conteos_por_tipo: conteos,
      total_fichas_encontradas: (fichasConDestaque as any[]).length
    });

  } catch (error) {
    console.error("Error en debug:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}