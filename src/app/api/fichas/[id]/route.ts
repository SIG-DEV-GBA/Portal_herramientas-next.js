import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";   // ✅
import { FichaUpdate } from "@/lib/validations/fichas";
import { serialize } from "@/lib/serialize";
import { slugify } from "@/lib/slug";

export const runtime = "nodejs";          // ✅

export async function PUT(req: NextRequest, { params }: { params: { id: string }}) {
  const id = BigInt(params.id);
  const body = await req.json();
  const parsed = FichaUpdate.safeParse(body);
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const updates: any = {
    ...(d.id_ficha_subida && { id_ficha_subida: new Prisma.Decimal(d.id_ficha_subida) }), // ✅
    ...(d.nombre_ficha && { nombre_ficha: d.nombre_ficha }),
    ...(d.nombre_ficha && !d.nombre_slug && { nombre_slug: slugify(d.nombre_ficha) }),
    ...(d.nombre_slug !== undefined && { nombre_slug: d.nombre_slug }),
    ...(d.vencimiento !== undefined && { vencimiento: d.vencimiento ? new Date(d.vencimiento) : null }),
    ...(d.fecha_redaccion !== undefined && { fecha_redaccion: d.fecha_redaccion ? new Date(d.fecha_redaccion) : null }),
    ...(d.fecha_subida_web !== undefined && { fecha_subida_web: d.fecha_subida_web ? new Date(d.fecha_subida_web) : null }),
    ...(d.trabajador_id !== undefined && { trabajador_id: d.trabajador_id }),
    ...(d.trabajador_subida_id !== undefined && { trabajador_subida_id: d.trabajador_subida_id }),
    ...(d.ambito_nivel !== undefined && { ambito_nivel: d.ambito_nivel }),
    ...(d.ambito_ccaa_id !== undefined && { ambito_ccaa_id: d.ambito_ccaa_id }),
    ...(d.ambito_provincia_id !== undefined && { ambito_provincia_id: d.ambito_provincia_id }),
    ...(d.ambito_municipal !== undefined && { ambito_municipal: d.ambito_municipal }),
    ...(d.tramite_tipo !== undefined && { tramite_tipo: d.tramite_tipo }),
    ...(d.complejidad !== undefined && { complejidad: d.complejidad }),
    ...(d.enlace_base_id !== undefined && { enlace_base_id: d.enlace_base_id }),
    ...(d.enlace_seg_override !== undefined && { enlace_seg_override: d.enlace_seg_override }),
    ...(d.frase_publicitaria !== undefined && { frase_publicitaria: d.frase_publicitaria }),
    ...(d.texto_divulgacion !== undefined && { texto_divulgacion: d.texto_divulgacion }),
    ...(d.destaque_principal !== undefined && { destaque_principal: d.destaque_principal }),
    ...(d.destaque_secundario !== undefined && { destaque_secundario: d.destaque_secundario }),
  };

  await prisma.fichas.update({ where: { id }, data: updates });
  return NextResponse.json({ ok: true });
}
