import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/db";
import { serialize } from "@/lib/utils/serialize";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Obtener el primer portal disponible
    const portal = await prisma.portales.findFirst({
      select: { id: true, slug: true }
    });

    if (!portal) {
      return NextResponse.json({ error: "No hay portales disponibles" }, { status: 400 });
    }

    const timestamp = Date.now();
    
    // Configuración de las 12 fichas de prueba
    const fichasConfig = [
      // 4 fichas solo con "nueva"
      { nombre: "Test Nueva 1", destaque_principal: "nueva", destaque_secundario: null },
      { nombre: "Test Nueva 2", destaque_principal: "nueva", destaque_secundario: null },
      { nombre: "Test Nueva 3", destaque_principal: null, destaque_secundario: "nueva" },
      { nombre: "Test Nueva 4", destaque_principal: null, destaque_secundario: "nueva" },
      
      // 4 fichas solo con "para_publicitar"
      { nombre: "Test Publicitar 1", destaque_principal: "para_publicitar", destaque_secundario: null },
      { nombre: "Test Publicitar 2", destaque_principal: "para_publicitar", destaque_secundario: null },
      { nombre: "Test Publicitar 3", destaque_principal: null, destaque_secundario: "para_publicitar" },
      { nombre: "Test Publicitar 4", destaque_principal: null, destaque_secundario: "para_publicitar" },
      
      // 4 fichas con ambas etiquetas
      { nombre: "Test Ambas 1", destaque_principal: "nueva", destaque_secundario: "para_publicitar" },
      { nombre: "Test Ambas 2", destaque_principal: "para_publicitar", destaque_secundario: "nueva" },
      { nombre: "Test Ambas 3", destaque_principal: "nueva", destaque_secundario: "para_publicitar" },
      { nombre: "Test Ambas 4", destaque_principal: "para_publicitar", destaque_secundario: "nueva" }
    ];

    const results = [];

    for (let i = 0; i < fichasConfig.length; i++) {
      const config = fichasConfig[i];
      
      try {
        // Crear la ficha
        const ficha = await prisma.fichas.create({
          data: {
            id_ficha_subida: BigInt(timestamp + i), // ID único
            nombre_ficha: config.nombre,
            ambito_nivel: "ESTADO",
            tramite_tipo: "no",
            destaque_principal: config.destaque_principal as any,
            destaque_secundario: config.destaque_secundario as any,
            texto_divulgacion: `Texto de prueba para ${config.nombre}`,
            trabajador_id: 1,
            trabajador_subida_id: 1,
          }
        });

        // Inmediatamente crear la relación con el portal
        await prisma.ficha_portal.create({
          data: {
            ficha_id: ficha.id,
            portal_id: portal.id
          }
        });

        results.push({
          success: true,
          ficha_id: ficha.id.toString(),
          nombre: config.nombre,
          destaque_principal: config.destaque_principal,
          destaque_secundario: config.destaque_secundario,
          portal_asignado: portal.slug
        });

      } catch (error) {
        results.push({
          success: false,
          nombre: config.nombre,
          error: error.message
        });
      }
    }

    // Verificación final - contar fichas por tipo
    const verification = await prisma.$queryRaw`
      SELECT 
        'solo_nueva' as tipo,
        COUNT(*) as count
      FROM fichas f
      INNER JOIN ficha_portal fp ON fp.ficha_id = f.id
      WHERE (f.destaque_principal = 'nueva' AND f.destaque_secundario IS NULL)
         OR (f.destaque_principal IS NULL AND f.destaque_secundario = 'nueva')
      
      UNION ALL
      
      SELECT 
        'solo_para_publicitar' as tipo,
        COUNT(*) as count
      FROM fichas f
      INNER JOIN ficha_portal fp ON fp.ficha_id = f.id
      WHERE (f.destaque_principal = 'para_publicitar' AND f.destaque_secundario IS NULL)
         OR (f.destaque_principal IS NULL AND f.destaque_secundario = 'para_publicitar')
      
      UNION ALL
      
      SELECT 
        'ambas_etiquetas' as tipo,
        COUNT(*) as count
      FROM fichas f
      INNER JOIN ficha_portal fp ON fp.ficha_id = f.id
      WHERE (f.destaque_principal = 'nueva' AND f.destaque_secundario = 'para_publicitar')
         OR (f.destaque_principal = 'para_publicitar' AND f.destaque_secundario = 'nueva')
    `;

    return NextResponse.json(serialize({
      message: "12 fichas de prueba creadas exitosamente",
      portal_usado: portal,
      results,
      verification,
      resumen: {
        total_creadas: results.filter(r => r.success).length,
        errores: results.filter(r => !r.success).length
      }
    }));

  } catch (error) {
    console.error("Error creating test batch:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}