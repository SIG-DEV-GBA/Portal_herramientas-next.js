/**
 * Utility functions for handling destaque filters in both Prisma and raw SQL queries
 */

export interface DestaqueFilters {
  destaque_principal?: string | null;
  destaque_secundario?: string | null;
}

/**
 * Generates SQL WHERE conditions for destaque filters (used in raw SQL queries)
 */
export function generateDestaqueSqlFilters(
  filters: DestaqueFilters,
  tableAlias: string = 'f'
): { whereParts: string[]; params: string[] } {
  const whereParts: string[] = [];
  const params: string[] = [];

  const { destaque_principal, destaque_secundario } = filters;


  // Filtros de destaque
  if (destaque_principal === "nueva") {
    // Todas las fichas nuevas (incluye las que también son para publicitar)
    whereParts.push(`(${tableAlias}.destaque_principal = 'nueva' OR ${tableAlias}.destaque_secundario = 'nueva')`);
  } else if (destaque_principal === "para_publicitar") {
    // Todas las fichas para publicitar (incluye las que también son nuevas)
    whereParts.push(`(${tableAlias}.destaque_principal = 'para_publicitar' OR ${tableAlias}.destaque_secundario = 'para_publicitar')`);
  } else if (destaque_principal === "ambas") {
    // Solo fichas que tienen ambas etiquetas
    whereParts.push(`((${tableAlias}.destaque_principal = 'nueva' AND ${tableAlias}.destaque_secundario = 'para_publicitar') OR (${tableAlias}.destaque_principal = 'para_publicitar' AND ${tableAlias}.destaque_secundario = 'nueva'))`);
  } else if (destaque_principal === "sin_etiquetas") {
    // Fichas sin ninguna etiqueta de destaque
    whereParts.push(`${tableAlias}.destaque_principal IS NULL AND ${tableAlias}.destaque_secundario IS NULL`);
  }
  
  // Los filtros secundarios ya no son necesarios con el nuevo diseño simplificado

  return { whereParts, params };
}

/**
 * Generates Prisma WHERE conditions for destaque filters
 */
export function generateDestaquePrismaFilters(
  filters: DestaqueFilters
): Record<string, any>[] {
  const conditions: Record<string, any>[] = [];

  const { destaque_principal, destaque_secundario } = filters;
  

  if (destaque_principal === "nueva") {
    // Todas las fichas nuevas (incluye las que también son para publicitar)
    conditions.push({
      OR: [
        { destaque_principal: "nueva" },
        { destaque_secundario: "nueva" }
      ]
    });
  } else if (destaque_principal === "para_publicitar") {
    // Todas las fichas para publicitar (incluye las que también son nuevas)
    conditions.push({
      OR: [
        { destaque_principal: "para_publicitar" },
        { destaque_secundario: "para_publicitar" }
      ]
    });
  } else if (destaque_principal === "ambas") {
    // Solo fichas que tienen ambas etiquetas
    conditions.push({
      OR: [
        {
          AND: [
            { destaque_principal: "nueva" },
            { destaque_secundario: "para_publicitar" }
          ]
        },
        {
          AND: [
            { destaque_principal: "para_publicitar" },
            { destaque_secundario: "nueva" }
          ]
        }
      ]
    });
  } else if (destaque_principal === "sin_etiquetas") {
    // Fichas sin ninguna etiqueta de destaque
    conditions.push({
      AND: [
        { destaque_principal: null },
        { destaque_secundario: null }
      ]
    });
  }

  // Los filtros secundarios ya no son necesarios con el nuevo diseño simplificado

  return conditions;
}