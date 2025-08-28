import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serialize } from "@/lib/serialize";
import { requirePermission } from "@/lib/api-guard";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requirePermission(_req, "fichas", "read");
  if (error) return error;

  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const ficha = await prisma.fichas.findUnique({
    where: { id },
    select: {
      id: true,
      id_ficha_subida: true,
      nombre_ficha: true,
      nombre_slug: true,
      vencimiento: true,
      fecha_redaccion: true,
      fecha_subida_web: true,
      trabajador_id: true,
      trabajador_subida_id: true,
      ambito_nivel: true,
      ambito_ccaa_id: true,
      ambito_provincia_id: true,
      ambito_municipal: true,
      tramite_tipo: true,
      complejidad: true,
      complejidad_peso: true,
      enlace_base_id: true,
      enlace_seg_override: true,
      frase_publicitaria: true,
      texto_divulgacion: true,
      existe_frase: true,
      destaque_principal: true,
      destaque_secundario: true,
      created_at: true,
      updated_at: true,
      // relaciones con select mínimo
      ficha_portal: {
        select: {
          portal_id: true,
          portales: { select: { id: true, nombre: true } },
        },
      },
      ficha_tematica: {
        select: {
          tematica_id: true,
          orden: true,
          tematicas: { select: { id: true, nombre: true } },
        },
      },
    },
  });

  if (!ficha) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(serialize(ficha));
}

// (Opcional) Esqueleto PUT con select mínimo
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requirePermission(req, "fichas", "update");
  if (error) return error;

  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const data = await req.json();

  // TODO: validar con Zod y construir "data" solo de campos presentes.
  // Evita sobrescribir a null si el campo no viene en el payload.

  const updated = await prisma.fichas.update({
    where: { id },
    data: {
      // ... campos validados
    },
    select: { id: true, updated_at: true },
  });

  return NextResponse.json(serialize(updated));
}
