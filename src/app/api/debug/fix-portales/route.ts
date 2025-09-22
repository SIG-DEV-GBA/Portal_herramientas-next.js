import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/db";
import { serialize } from "@/lib/utils/serialize";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Primero verificar qué portales existen
    const portales = await prisma.portales.findMany({
      select: { id: true, slug: true, nombre: true }
    });

    console.log("Portales disponibles:", portales);

    // Encontrar fichas de prueba que no tienen portales
    const fichasSinPortales = await prisma.fichas.findMany({
      where: {
        AND: [
          {
            OR: [
              { destaque_principal: { not: null } },
              { destaque_secundario: { not: null } }
            ]
          },
          { nombre_ficha: { contains: "Ficha de prueba" } }
        ]
      },
      include: {
        ficha_portal: true
      }
    });

    console.log("Fichas de prueba encontradas:", fichasSinPortales.length);

    const results = [];

    for (const ficha of fichasSinPortales) {
      if (ficha.ficha_portal.length === 0 && portales.length > 0) {
        // Agregar al primer portal disponible
        await prisma.ficha_portal.create({
          data: {
            ficha_id: ficha.id,
            portal_id: portales[0].id
          }
        });

        results.push({
          ficha_id: ficha.id.toString(),
          nombre: ficha.nombre_ficha,
          portal_asignado: portales[0].slug,
          action: "created"
        });

        // Si la ficha tiene ambas etiquetas, agregar a un segundo portal también
        if (ficha.nombre_ficha.includes("Ambas etiquetas") && portales.length > 1) {
          await prisma.ficha_portal.create({
            data: {
              ficha_id: ficha.id,
              portal_id: portales[1].id
            }
          });

          results.push({
            ficha_id: ficha.id.toString(),
            nombre: ficha.nombre_ficha,
            portal_asignado: portales[1].slug,
            action: "created_additional"
          });
        }
      } else if (ficha.ficha_portal.length > 0) {
        results.push({
          ficha_id: ficha.id.toString(),
          nombre: ficha.nombre_ficha,
          portales_existentes: ficha.ficha_portal.length,
          action: "already_has_portales"
        });
      }
    }

    // Verificación final
    const fichasConPortales = await prisma.fichas.findMany({
      where: {
        AND: [
          {
            OR: [
              { destaque_principal: { not: null } },
              { destaque_secundario: { not: null } }
            ]
          },
          { nombre_ficha: { contains: "Ficha de prueba" } }
        ]
      },
      include: {
        ficha_portal: {
          include: {
            portales: true
          }
        }
      }
    });

    return NextResponse.json(serialize({
      message: "Relaciones de portales procesadas",
      portales_disponibles: portales,
      results,
      verificacion_final: fichasConPortales.map(f => ({
        id: f.id.toString(),
        nombre: f.nombre_ficha,
        destaque_principal: f.destaque_principal,
        destaque_secundario: f.destaque_secundario,
        portales: f.ficha_portal.map(fp => fp.portales.slug)
      }))
    }));

  } catch (error) {
    console.error("Error fixing portal relationships:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}