import { z } from "zod";

// util para fechas "YYYY-MM-DD" opcionales
const zDateOpt = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const FichaCreate = z.object({
  id_ficha_subida: z.string().min(1),         // DECIMAL -> string
  nombre_ficha: z.string().min(3),
  nombre_slug: z.string().min(3).optional(),

  ambito_nivel: z.enum(["UE","ESTADO","CCAA","PROVINCIA"]),
  ambito_ccaa_id: z.number().int().positive().optional(),
  ambito_provincia_id: z.number().int().positive().optional(),
  ambito_municipal: z.string().max(150).optional(),

  enlace_base_id: z.number().int().positive().default(1),

  // opcionales
  vencimiento: zDateOpt,
  fecha_redaccion: zDateOpt,
  fecha_subida_web: zDateOpt,
  trabajador_id: z.number().int().positive().optional(),
  trabajador_subida_id: z.number().int().positive().optional(),
  tramite_tipo: z.enum(["no","si","directo"]).optional(),
  complejidad: z.enum(["baja","media","alta"]).optional(),
  enlace_seg_override: z.string().max(120).optional(),
  frase_publicitaria: z.string().max(300).optional(),
  texto_divulgacion: z.string().optional(),
  destaque_principal: z.enum(["novedad","destacable"]).optional(),
  destaque_secundario: z.enum(["novedad","destacable"]).optional(),

  // relaciones (si las quieres en el POST)
  portales_ids: z.array(z.number().int().positive()).optional(),
  tematicas: z.array(z.object({
    tematica_id: z.number().int().positive(),
    orden: z.number().int().optional()
  })).optional()
}).superRefine((v, ctx) => {
  if (v.ambito_nivel === "CCAA" && !v.ambito_ccaa_id)
    ctx.addIssue({ path:["ambito_ccaa_id"], code:"custom", message:"Requerido si ambito_nivel = CCAA" });
  if (v.ambito_nivel === "PROVINCIA" && !v.ambito_provincia_id)
    ctx.addIssue({ path:["ambito_provincia_id"], code:"custom", message:"Requerido si ambito_nivel = PROVINCIA" });
});

export const FichaUpdate = FichaCreate.partial();
