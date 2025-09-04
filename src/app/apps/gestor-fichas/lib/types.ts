// Tipos de dominio (enums de filtros / ficha)
export type Ambito = "UE" | "ESTADO" | "CCAA" | "PROVINCIA" | "";
export type TramiteTipo = "si" | "no" | "directo" | "";
export type Complejidad = "baja" | "media" | "alta" | "";
export type DestaqueTipo = "nueva" | "para_publicitar";

/** Entidad Ficha (campos mínimos + algunos opcionales comunes en la UI) */
export type Ficha = {
  id: string;                       // bigint -> string serializada
  id_ficha_subida: string;          // decimal(20,0) -> string
  nombre_ficha: string;

  ambito_nivel: Exclude<Ambito, "">;
  ambito_ccaa_id: number | null;
  ambito_provincia_id: number | null;
  ambito_municipal?: string | null;

  created_at: string;               // ISO
  updated_at: string;               // ISO

  // --- opcionales útiles en tablas/vistas (no rompen nada si no vienen):
  nombre_slug?: string | null;
  vencimiento?: string | null;      // date ISO
  fecha_redaccion?: string | null;  // date ISO
  fecha_subida_web?: string | null; // date ISO
  tramite_tipo?: Exclude<TramiteTipo, ""> | null;
  complejidad?: Exclude<Complejidad, ""> | null;
  existe_frase?: boolean | null;
  enlace_base_id?: number | null;
  enlace_seg_override?: string | null;
  frase_publicitaria?: string | null;
  trabajador_id?: number | null;
  trabajador_subida_id?: number | null;
  destaque_principal?: DestaqueTipo | null;
  destaque_secundario?: DestaqueTipo | null;

  // Relaciones opcionales (cuando usas withRelations=true)
  trabajadores?: { id: number; nombre: string; slug: string } | null;
  trabajadores_trabajador_subida_idTotrabajadores?: { id: number; nombre: string; slug: string } | null;
  ccaa?: { id: number; nombre: string; codigo_ine: string | null } | null;
  provincias?: { id: number; nombre: string; codigo_ine: string | null } | null;
  enlaces_base?: { id: number; nombre: string; base_url: string } | null;
  ficha_portal?: { portales: { id: number; slug: string; nombre: string } }[];
  ficha_tematica?: { tematicas: { id: number; slug: string; nombre: string } }[];
};

/** Respuesta genérica de listados */
export type ApiList<T = Ficha> = { items: T[]; total: number };

/** Filtros aplicables a /api/apps/gestor-fichas/fichas y endpoints de stats */
export type Filters = {
  q?: string;

  ambito?: Ambito;
  ccaa_id?: string;
  provincia_id?: string;
  provincia_principal?: string;  // Filtro principal de provincia (inclusivo)

  tramite_tipo?: TramiteTipo;
  complejidad?: Complejidad;
  
  tematica_id?: string;

  trabajador_id?: string;
  trabajador_subida_id?: string;

  anio?: string;        // "2025"
  mes?: string;         // "1".."12" o ""

  created_desde?: string;  // "YYYY-MM-DD"
  created_hasta?: string;  // "YYYY-MM-DD"

  take?: string;
  page?: string;

  /** opcional si lo usas en filtros avanzados */
  existe_frase?: "" | "true" | "false";
  
  /** filtros por etiquetas de destaque */
  destaque_principal?: "" | "true" | "false";
  destaque_secundario?: "" | "true" | "false";
};

// ==========================
// Respuestas de /api/apps/gestor-fichas/stats/*
// ==========================

export type ResFichasPorMes = {
  items: {
    mes: number;            // 1..12
    total: number;
    exclusivas?: any;
    varios_portales?: number;
  }[];
  total_anual: number;
};

export type ResPortalesPorMes = {
  items: {
    mes: number;
    mayores: number;
    discapacidad: number;
    familia: number;
    mujer: number;
    salud: number;
    total_mes: number;
  }[];
  totales: {
    mayores: number;
    discapacidad: number;
    familia: number;
    mujer: number;
    salud: number;
  };
  total_global: number;
};

export type ResAmbitosPorPortal = {
  por_portal: Record<
    "mayores" | "discapacidad" | "familia" | "mujer" | "salud",
    { estado: number; ccaa: number; provincia: number; municipal: number; total: number }
  >;
};

export type ResTramiteOnline = {
  por_portal: Record<
    "mayores" | "discapacidad" | "familia" | "mujer" | "salud",
    { directo: number; si: number; no: number; total: number }
  >;
  total: { directo: number; si: number; no: number; total: number };
};
