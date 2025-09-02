import { prisma } from '../database/db';

/**
 * Obtiene los filtros de provincia inclusivos para Prisma
 * Incluye: PROVINCIA específica, CCAA que contiene la provincia, ESTADO
 */
export async function getProvinciaInclusiveFilter(provincia_id: number) {
  const provinciaData = await prisma.provincias.findUnique({
    where: { id: provincia_id },
    select: { ccaa_id: true }
  });
  
  if (!provinciaData) return null;
  
  return {
    OR: [
      { ambito_provincia_id: provincia_id }, // PROVINCIA específica
      { 
        AND: [
          { ambito_nivel: 'CCAA' as const },
          { ambito_ccaa_id: provinciaData.ccaa_id }
        ]
      }, // CCAA que contiene la provincia
      { ambito_nivel: 'ESTADO' as const } // ESTADO (aplica a toda España)
    ]
  };
}

/**
 * Para raw SQL queries - obtiene la condición WHERE inclusiva
 */
export async function getProvinciaInclusiveWhere(provincia_id: number) {
  const provinciaData = await prisma.provincias.findUnique({
    where: { id: provincia_id },
    select: { ccaa_id: true }
  });
  
  if (!provinciaData) return null;
  
  return {
    condition: `(
      f.ambito_provincia_id = ? OR 
      (f.ambito_nivel = 'CCAA' AND f.ambito_ccaa_id = ?) OR 
      f.ambito_nivel = 'ESTADO'
    )`,
    params: [provincia_id, provinciaData.ccaa_id]
  };
}