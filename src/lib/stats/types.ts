export type Ficha = {
  id: string;
  id_ficha_subida: string;
  nombre_ficha: string;
  ambito_nivel: "UE" | "ESTADO" | "CCAA" | "PROVINCIA";
  ambito_ccaa_id: number | null;
  ambito_provincia_id: number | null;
  created_at: string;
  updated_at: string;
};

export type ApiList = { items: Ficha[]; total: number };

export type Filters = {
  q?: string;
  ambito?: string;
  ccaa_id?: string;
  provincia_id?: string;
  tramite_tipo?: string; // si|no|directo
  trabajador_id?: string;
  anio?: string;
  mes?: string;
  created_desde?: string;
  created_hasta?: string;
  take?: string;
  page?: string;
};

// Respuestas de /api/stats/*
export type ResFichasPorMes = {
  items: { mes: number; total: number; exclusivas?: any; varios_portales?: number }[];
  total_anual: number;
};

export type ResPortalesPorMes = {
  items: { mes: number; mayores: number; discapacidad: number; familia: number; mujer: number; salud: number; total_mes: number }[];
  totales: { mayores: number; discapacidad: number; familia: number; mujer: number; salud: number };
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
