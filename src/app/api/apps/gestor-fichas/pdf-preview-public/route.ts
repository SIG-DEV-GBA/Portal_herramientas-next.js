import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    console.log("=== PUBLIC PDF PREVIEW CALLED ===");
    console.log("URL:", request.url);

    const { searchParams } = new URL(request.url);
    
    // Extract filters from URL params
    const filters = {
      q: searchParams.get("q") || "",
      anio: searchParams.get("anio") || "",
      mes: searchParams.get("mes") || "",
      ambito: searchParams.get("ambito") || "",
      ccaa_id: searchParams.get("ccaa_id") || "",
      provincia_id: searchParams.get("provincia_id") || "",
      provincia_principal: searchParams.get("provincia_principal") || "",
      tramite_tipo: searchParams.get("tramite_tipo") || "",
      complejidad: searchParams.get("complejidad") || "",
      tematica_id: searchParams.get("tematica_id") || "",
      trabajador_id: searchParams.get("trabajador_id") || "",
      trabajador_subida_id: searchParams.get("trabajador_subida_id") || "",
      created_desde: searchParams.get("created_desde") || "",
      created_hasta: searchParams.get("created_hasta") || "",
      destaque_principal: searchParams.get("destaque_principal") || "",
      destaque_secundario: searchParams.get("destaque_secundario") || "",
    };

    // Get PDF configuration
    const configParam = searchParams.get("config");
    const config = configParam ? JSON.parse(configParam) : {
      includeCharts: true,
      includeTable: false,
      includeFiltersInfo: true,
      orientation: "landscape",
      chartTypes: ["fichas-por-mes", "portales-por-mes"]
    };

    console.log("Filters:", filters);
    console.log("Config:", config);

    // Get basic stats
    const stats = await getBasicStats(filters);
    
    // Get chart data if charts are enabled
    let chartData = {};
    if (config.includeCharts) {
      chartData = await getChartData(filters, config);
    }
    
    // Generate HTML page
    const html = generateHTMLPage({
      filters,
      config,
      stats,
      chartData
    });

    console.log("✅ HTML generated successfully");

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });

  } catch (error) {
    console.error("Error generating public PDF preview:", error);
    return NextResponse.json(
      { error: "Error generando vista previa PDF", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function getBasicStats(filters: Record<string, string | null>) {
  try {
    // Build date range
    let dateStart: Date | undefined;
    let dateEnd: Date | undefined;

    if (filters.created_desde && filters.created_hasta) {
      dateStart = new Date(filters.created_desde);
      dateEnd = new Date(filters.created_hasta + "T23:59:59");
    } else if (filters.anio) {
      const year = parseInt(filters.anio);
      if (filters.mes) {
        const month = parseInt(filters.mes);
        dateStart = new Date(year, month - 1, 1);
        dateEnd = new Date(year, month, 0, 23, 59, 59);
      } else {
        dateStart = new Date(year, 0, 1);
        dateEnd = new Date(year, 11, 31, 23, 59, 59);
      }
    } else {
      // Sin filtros de fecha - obtener rango completo de la BD
      const rangeResult = await prisma.$queryRaw<Array<{min_date: Date, max_date: Date}>>`
        SELECT 
          MIN(created_at) as min_date,
          MAX(created_at) as max_date 
        FROM fichas
      `;
      
      if (rangeResult.length > 0 && rangeResult[0].min_date && rangeResult[0].max_date) {
        dateStart = rangeResult[0].min_date;
        dateEnd = new Date(rangeResult[0].max_date.getTime() + 24 * 60 * 60 * 1000);
      } else {
        // Fallback si no hay datos
        dateStart = new Date(2020, 0, 1);
        dateEnd = new Date(2030, 11, 31, 23, 59, 59);
      }
    }

    // Build complete where clause with ALL filters
    const whereClause: Record<string, unknown> = {};
    
    if (dateStart && dateEnd) {
      whereClause.created_at = {
        gte: dateStart,
        lte: dateEnd,
      };
    }

    // Apply all other filters
    if (filters.q) {
      whereClause.OR = [
        { nombre_ficha: { contains: filters.q } },
        { frase_publicitaria: { contains: filters.q } },
        { texto_divulgacion: { contains: filters.q } }
      ];
    }
    if (filters.ambito) whereClause.ambito_nivel = filters.ambito;
    if (filters.tramite_tipo) whereClause.tramite_tipo = filters.tramite_tipo;
    if (filters.complejidad) whereClause.complejidad = filters.complejidad;
    if (filters.ccaa_id) whereClause.ambito_ccaa_id = parseInt(filters.ccaa_id);
    if (filters.provincia_id) whereClause.ambito_provincia_id = parseInt(filters.provincia_id);
    if (filters.provincia_principal) whereClause.provincia_principal = filters.provincia_principal;
    if (filters.tematica_id) {
      whereClause.ficha_tematica = {
        some: { tematica_id: parseInt(filters.tematica_id) }
      };
    }
    if (filters.trabajador_id) whereClause.trabajador_id = parseInt(filters.trabajador_id);
    if (filters.trabajador_subida_id) whereClause.trabajador_subida_id = parseInt(filters.trabajador_subida_id);
    if (filters.destaque_principal) whereClause.destaque_principal = filters.destaque_principal;
    if (filters.destaque_secundario) whereClause.destaque_secundario = filters.destaque_secundario;

    console.log('getBasicStats whereClause:', JSON.stringify(whereClause, null, 2));

    // Get stats with the complete filter
    const total = await prisma.fichas.count({ where: whereClause });
    
    // For tramites online, we need to apply all filters PLUS tramite_tipo = 'si'
    const tramitesOnlineWhereClause = { 
      ...whereClause, 
      tramite_tipo: 'si' 
    };
    const tramitesOnline = await prisma.fichas.count({
      where: tramitesOnlineWhereClause
    });

    // Count total portales (this doesn't need filtering since it's a count of available portales)
    const portales = await prisma.portales.count();

    console.log(`getBasicStats results: total=${total}, tramitesOnline=${tramitesOnline}, portales=${portales}`);

    const periodo = dateStart && dateEnd ? 
      `${dateStart.toLocaleDateString('es-ES')} - ${dateEnd.toLocaleDateString('es-ES')}` :
      'Todos los periodos';

    return {
      total,
      tramitesOnline,
      portales,
      periodo
    };
  } catch (error) {
    console.error("Error getting basic stats:", error);
    return {
      total: 0,
      tramitesOnline: 0,
      portales: 5,
      periodo: 'Error obteniendo datos'
    };
  }
}

async function getChartData(filters: Record<string, string | null>, config: Record<string, unknown>) {
  const chartData: Record<string, unknown> = {};
  
  try {
    // Get data for requested chart types using direct database queries
    if (config.chartTypes?.includes('fichas-por-mes')) {
      try {
        chartData.fichasPorMes = await getFichasPorMesData(filters);
      } catch (error) {
        console.error('Error fetching fichas-por-mes data:', error);
      }
    }
    
    if (config.chartTypes?.includes('portales-por-mes')) {
      try {
        chartData.portales = await getPortalesData(filters);
      } catch (error) {
        console.error('Error fetching portales data:', error);
      }
    }
    
    if (config.chartTypes?.includes('tematicas-distribucion') || !config.chartTypes) {
      try {
        chartData.tematicas = await getTematicasData(filters);
      } catch (error) {
        console.error('Error fetching tematicas data:', error);
      }
    }
    
    if (config.chartTypes?.includes('tramite-online') || !config.chartTypes) {
      try {
        chartData.tramiteOnline = await getTramiteOnlineData(filters);
      } catch (error) {
        console.error('Error fetching tramite online data:', error);
      }
    }
    
  } catch (error) {
    console.error('Error getting chart data:', error);
  }
  
  return chartData;
}

async function getFichasPorMesData(filters: Record<string, string | null>) {
  try {
    // Build date range
    let dateStart: Date | undefined;
    let dateEnd: Date | undefined;

    if (filters.created_desde && filters.created_hasta) {
      dateStart = new Date(filters.created_desde);
      dateEnd = new Date(filters.created_hasta + "T23:59:59");
    } else if (filters.anio) {
      const year = parseInt(filters.anio);
      if (filters.mes) {
        const month = parseInt(filters.mes);
        dateStart = new Date(year, month - 1, 1);
        dateEnd = new Date(year, month, 0, 23, 59, 59);
      } else {
        dateStart = new Date(year, 0, 1);
        dateEnd = new Date(year, 11, 31, 23, 59, 59);
      }
    } else {
      // Sin filtros de fecha - obtener rango completo de la BD
      const rangeResult = await prisma.$queryRaw<Array<{min_date: Date, max_date: Date}>>`
        SELECT 
          MIN(created_at) as min_date,
          MAX(created_at) as max_date 
        FROM fichas
      `;
      
      if (rangeResult.length > 0 && rangeResult[0].min_date && rangeResult[0].max_date) {
        dateStart = rangeResult[0].min_date;
        dateEnd = new Date(rangeResult[0].max_date.getTime() + 24 * 60 * 60 * 1000);
      } else {
        // Fallback si no hay datos
        dateStart = new Date(2020, 0, 1);
        dateEnd = new Date(2030, 11, 31, 23, 59, 59);
      }
    }

    // Build complete where clause with ALL filters
    const whereClause: Record<string, unknown> = {};
    
    if (dateStart && dateEnd) {
      whereClause.created_at = {
        gte: dateStart,
        lte: dateEnd,
      };
    }

    // Apply all other filters
    if (filters.q) {
      whereClause.OR = [
        { nombre_ficha: { contains: filters.q } },
        { frase_publicitaria: { contains: filters.q } },
        { texto_divulgacion: { contains: filters.q } }
      ];
    }
    if (filters.ambito) whereClause.ambito_nivel = filters.ambito;
    if (filters.tramite_tipo) whereClause.tramite_tipo = filters.tramite_tipo;
    if (filters.complejidad) whereClause.complejidad = filters.complejidad;
    if (filters.ccaa_id) whereClause.ambito_ccaa_id = parseInt(filters.ccaa_id);
    if (filters.provincia_id) whereClause.ambito_provincia_id = parseInt(filters.provincia_id);
    if (filters.provincia_principal) whereClause.provincia_principal = filters.provincia_principal;
    if (filters.tematica_id) {
      whereClause.ficha_tematica = {
        some: { tematica_id: parseInt(filters.tematica_id) }
      };
    }
    if (filters.trabajador_id) whereClause.trabajador_id = parseInt(filters.trabajador_id);
    if (filters.trabajador_subida_id) whereClause.trabajador_subida_id = parseInt(filters.trabajador_subida_id);
    if (filters.destaque_principal) whereClause.destaque_principal = filters.destaque_principal;
    if (filters.destaque_secundario) whereClause.destaque_secundario = filters.destaque_secundario;

    console.log('getFichasPorMesData whereClause:', JSON.stringify(whereClause, null, 2));

    const fichas = await prisma.fichas.findMany({
      where: whereClause,
      select: { created_at: true }
    });

    console.log(`getFichasPorMesData found ${fichas.length} fichas`);

    // Group by month
    const monthlyData: { [key: string]: number } = {};
    fichas.forEach(ficha => {
      const month = ficha.created_at.toISOString().substring(0, 7); // YYYY-MM
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    });

    // Generate all months for the year(s) in the date range
    const allMonths: Array<{periodo: string, total: string}> = [];
    
    if (dateStart && dateEnd) {
      const startYear = dateStart.getFullYear();
      const startMonth = dateStart.getMonth();
      const endYear = dateEnd.getFullYear();
      const endMonth = dateEnd.getMonth();
      
      // Iterate through all months in the range
      for (let year = startYear; year <= endYear; year++) {
        const monthStart = year === startYear ? startMonth : 0;
        const monthEnd = year === endYear ? endMonth : 11;
        
        for (let month = monthStart; month <= monthEnd; month++) {
          const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
          const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          const monthName = monthNames[month];
          
          allMonths.push({
            periodo: monthName,
            total: (monthlyData[monthKey] || 0).toString()
          });
        }
      }
    }

    return allMonths;
  } catch (error) {
    console.error('Error in getFichasPorMesData:', error);
    return [];
  }
}

async function getPortalesData(filters: Record<string, string | null>) {
  try {
    // Build date range
    let dateStart: Date | undefined;
    let dateEnd: Date | undefined;

    if (filters.created_desde && filters.created_hasta) {
      dateStart = new Date(filters.created_desde);
      dateEnd = new Date(filters.created_hasta + "T23:59:59");
    } else if (filters.anio) {
      const year = parseInt(filters.anio);
      if (filters.mes) {
        const month = parseInt(filters.mes);
        dateStart = new Date(year, month - 1, 1);
        dateEnd = new Date(year, month, 0, 23, 59, 59);
      } else {
        dateStart = new Date(year, 0, 1);
        dateEnd = new Date(year, 11, 31, 23, 59, 59);
      }
    } else {
      // Sin filtros de fecha - obtener rango completo de la BD
      const rangeResult = await prisma.$queryRaw<Array<{min_date: Date, max_date: Date}>>`
        SELECT 
          MIN(created_at) as min_date,
          MAX(created_at) as max_date 
        FROM fichas
      `;
      
      if (rangeResult.length > 0 && rangeResult[0].min_date && rangeResult[0].max_date) {
        dateStart = rangeResult[0].min_date;
        dateEnd = new Date(rangeResult[0].max_date.getTime() + 24 * 60 * 60 * 1000);
      } else {
        // Fallback si no hay datos
        dateStart = new Date(2020, 0, 1);
        dateEnd = new Date(2030, 11, 31, 23, 59, 59);
      }
    }

    // Build where clause for fichas (same as other functions)
    const fichasWhereClause: Record<string, unknown> = {};
    
    if (dateStart && dateEnd) {
      fichasWhereClause.created_at = {
        gte: dateStart,
        lte: dateEnd,
      };
    }

    // Apply all other filters to fichas
    if (filters.q) {
      fichasWhereClause.OR = [
        { nombre_ficha: { contains: filters.q } },
        { frase_publicitaria: { contains: filters.q } },
        { texto_divulgacion: { contains: filters.q } }
      ];
    }
    if (filters.ambito) fichasWhereClause.ambito_nivel = filters.ambito;
    if (filters.tramite_tipo) fichasWhereClause.tramite_tipo = filters.tramite_tipo;
    if (filters.complejidad) fichasWhereClause.complejidad = filters.complejidad;
    if (filters.ccaa_id) fichasWhereClause.ambito_ccaa_id = parseInt(filters.ccaa_id);
    if (filters.provincia_id) fichasWhereClause.ambito_provincia_id = parseInt(filters.provincia_id);
    if (filters.provincia_principal) fichasWhereClause.provincia_principal = filters.provincia_principal;
    if (filters.tematica_id) {
      fichasWhereClause.ficha_tematica = {
        some: { tematica_id: parseInt(filters.tematica_id) }
      };
    }
    if (filters.trabajador_id) fichasWhereClause.trabajador_id = parseInt(filters.trabajador_id);
    if (filters.trabajador_subida_id) fichasWhereClause.trabajador_subida_id = parseInt(filters.trabajador_subida_id);
    if (filters.destaque_principal) fichasWhereClause.destaque_principal = filters.destaque_principal;
    if (filters.destaque_secundario) fichasWhereClause.destaque_secundario = filters.destaque_secundario;

    console.log('getPortalesData fichasWhereClause:', JSON.stringify(fichasWhereClause, null, 2));

    // Get portales with filtered ficha counts
    const portales = await prisma.portales.findMany({
      select: {
        id: true,
        nombre: true,
        slug: true,
        _count: {
          select: {
            ficha_portal: {
              where: {
                fichas: fichasWhereClause
              }
            }
          }
        }
      },
      orderBy: [
        {
          slug: 'asc'
        },
        {
          nombre: 'asc'
        }
      ]
    });

    console.log('getPortalesData portales found:', portales.map(p => ({ nombre: p.nombre, count: p._count.ficha_portal })));

    return portales.map(portal => ({
      nombre: portal.nombre,
      total: portal._count.ficha_portal.toString()
    }));
  } catch (error) {
    console.error('Error in getPortalesData:', error);
    return [];
  }
}

async function getTematicasData(filters: Record<string, string | null>) {
  try {
    // Build date range
    let dateStart: Date | undefined;
    let dateEnd: Date | undefined;

    if (filters.created_desde && filters.created_hasta) {
      dateStart = new Date(filters.created_desde);
      dateEnd = new Date(filters.created_hasta + "T23:59:59");
    } else if (filters.anio) {
      const year = parseInt(filters.anio);
      if (filters.mes) {
        const month = parseInt(filters.mes);
        dateStart = new Date(year, month - 1, 1);
        dateEnd = new Date(year, month, 0, 23, 59, 59);
      } else {
        dateStart = new Date(year, 0, 1);
        dateEnd = new Date(year, 11, 31, 23, 59, 59);
      }
    } else {
      // Sin filtros de fecha - obtener rango completo de la BD
      const rangeResult = await prisma.$queryRaw<Array<{min_date: Date, max_date: Date}>>`
        SELECT 
          MIN(created_at) as min_date,
          MAX(created_at) as max_date 
        FROM fichas
      `;
      
      if (rangeResult.length > 0 && rangeResult[0].min_date && rangeResult[0].max_date) {
        dateStart = rangeResult[0].min_date;
        dateEnd = new Date(rangeResult[0].max_date.getTime() + 24 * 60 * 60 * 1000);
      } else {
        // Fallback si no hay datos
        dateStart = new Date(2020, 0, 1);
        dateEnd = new Date(2030, 11, 31, 23, 59, 59);
      }
    }

    // Build complete where clause with ALL filters
    const fichasWhereClause: Record<string, unknown> = {};
    
    if (dateStart && dateEnd) {
      fichasWhereClause.created_at = { gte: dateStart, lte: dateEnd };
    }

    // Apply all other filters to fichas
    if (filters.q) {
      fichasWhereClause.OR = [
        { nombre_ficha: { contains: filters.q } },
        { frase_publicitaria: { contains: filters.q } },
        { texto_divulgacion: { contains: filters.q } }
      ];
    }
    if (filters.ambito) fichasWhereClause.ambito_nivel = filters.ambito;
    if (filters.tramite_tipo) fichasWhereClause.tramite_tipo = filters.tramite_tipo;
    if (filters.complejidad) fichasWhereClause.complejidad = filters.complejidad;
    if (filters.ccaa_id) fichasWhereClause.ambito_ccaa_id = parseInt(filters.ccaa_id);
    if (filters.provincia_id) fichasWhereClause.ambito_provincia_id = parseInt(filters.provincia_id);
    if (filters.provincia_principal) fichasWhereClause.provincia_principal = filters.provincia_principal;
    if (filters.trabajador_id) fichasWhereClause.trabajador_id = parseInt(filters.trabajador_id);
    if (filters.trabajador_subida_id) fichasWhereClause.trabajador_subida_id = parseInt(filters.trabajador_subida_id);
    if (filters.destaque_principal) fichasWhereClause.destaque_principal = filters.destaque_principal;
    if (filters.destaque_secundario) fichasWhereClause.destaque_secundario = filters.destaque_secundario;
    // Note: Don't filter by tematica_id here since we want to see distribution across all tematicas

    console.log('getTematicasData fichasWhereClause:', JSON.stringify(fichasWhereClause, null, 2));

    // Get tematicas with filtered ficha counts
    const tematicas = await prisma.tematicas.findMany({
      select: {
        id: true,
        nombre: true,
        _count: {
          select: {
            ficha_tematica: {
              where: {
                fichas: fichasWhereClause
              }
            }
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    console.log('getTematicasData tematicas found:', tematicas.map(t => ({ nombre: t.nombre, count: t._count.ficha_tematica })));

    return tematicas
      .map(tematica => ({
        tematica_nombre: tematica.nombre,
        total: tematica._count.ficha_tematica.toString()
      }))
      .filter(t => parseInt(t.total) > 0)
      .sort((a, b) => parseInt(b.total) - parseInt(a.total));
  } catch (error) {
    console.error('Error in getTematicasData:', error);
    return [];
  }
}

async function getTramiteOnlineData(filters: Record<string, string | null>) {
  try {
    // Build date range (same logic as other functions)
    let dateStart: Date | undefined;
    let dateEnd: Date | undefined;

    if (filters.created_desde && filters.created_hasta) {
      dateStart = new Date(filters.created_desde);
      dateEnd = new Date(filters.created_hasta + "T23:59:59");
    } else if (filters.anio) {
      const year = parseInt(filters.anio);
      if (filters.mes) {
        const month = parseInt(filters.mes);
        dateStart = new Date(year, month - 1, 1);
        dateEnd = new Date(year, month, 0, 23, 59, 59);
      } else {
        dateStart = new Date(year, 0, 1);
        dateEnd = new Date(year, 11, 31, 23, 59, 59);
      }
    } else {
      // Sin filtros de fecha - obtener rango completo de la BD
      const rangeResult = await prisma.$queryRaw<Array<{min_date: Date, max_date: Date}>>`
        SELECT 
          MIN(created_at) as min_date,
          MAX(created_at) as max_date 
        FROM fichas
      `;
      
      if (rangeResult.length > 0 && rangeResult[0].min_date && rangeResult[0].max_date) {
        dateStart = rangeResult[0].min_date;
        dateEnd = new Date(rangeResult[0].max_date.getTime() + 24 * 60 * 60 * 1000);
      } else {
        // Fallback si no hay datos
        dateStart = new Date(2020, 0, 1);
        dateEnd = new Date(2030, 11, 31, 23, 59, 59);
      }
    }

    // Build complete where clause with ALL filters
    const whereClause: Record<string, unknown> = {};
    
    if (dateStart && dateEnd) {
      whereClause.created_at = {
        gte: dateStart,
        lte: dateEnd
      };
    }

    // Apply all other filters
    if (filters.q) {
      whereClause.OR = [
        { nombre_ficha: { contains: filters.q } },
        { frase_publicitaria: { contains: filters.q } },
        { texto_divulgacion: { contains: filters.q } }
      ];
    }
    if (filters.ambito) whereClause.ambito_nivel = filters.ambito;
    // Note: Don't filter by tramite_tipo here since we want to see distribution across all tramite types
    if (filters.complejidad) whereClause.complejidad = filters.complejidad;
    if (filters.ccaa_id) whereClause.ambito_ccaa_id = parseInt(filters.ccaa_id);
    if (filters.provincia_id) whereClause.ambito_provincia_id = parseInt(filters.provincia_id);
    if (filters.provincia_principal) whereClause.provincia_principal = filters.provincia_principal;
    if (filters.tematica_id) {
      whereClause.ficha_tematica = {
        some: { tematica_id: parseInt(filters.tematica_id) }
      };
    }
    if (filters.trabajador_id) whereClause.trabajador_id = parseInt(filters.trabajador_id);
    if (filters.trabajador_subida_id) whereClause.trabajador_subida_id = parseInt(filters.trabajador_subida_id);
    if (filters.destaque_principal) whereClause.destaque_principal = filters.destaque_principal;
    if (filters.destaque_secundario) whereClause.destaque_secundario = filters.destaque_secundario;

    console.log('getTramiteOnlineData whereClause:', JSON.stringify(whereClause, null, 2));

    const tramiteStats = await prisma.fichas.groupBy({
      by: ['tramite_tipo'],
      where: whereClause,
      _count: {
        _all: true
      }
    });

    console.log('getTramiteOnlineData stats found:', tramiteStats);

    return tramiteStats.map(stat => ({
      tramite_tipo: stat.tramite_tipo || 'sin definir',
      total: stat._count._all.toString()
    }));
  } catch (error) {
    console.error('Error in getTramiteOnlineData:', error);
    return [];
  }
}

function generateLineChartSVG(data: Array<{periodo?: string, nombre?: string, total: string}>, title: string): string {
  if (!data || data.length === 0) {
    return `<div class="chart-placeholder">No hay datos disponibles para ${title}</div>`;
  }

  const width = 600;
  const height = 300;
  const padding = 50;
  
  const maxValue = Math.max(...data.map(d => parseInt(d.total) || 0));
  const minValue = Math.min(...data.map(d => parseInt(d.total) || 0));
  const range = maxValue - minValue || 1;
  
  const points = data.map((d, i) => {
    const x = padding + (i * (width - 2 * padding)) / (data.length - 1 || 1);
    const y = height - padding - ((parseInt(d.total) - minValue) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background: white;">
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Grid lines -->
      ${Array.from({length: 5}, (_, i) => {
        const y = padding + (i * (height - 2 * padding)) / 4;
        return `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>`;
      }).join('')}
      
      <!-- Line -->
      <polyline points="${points}" fill="none" stroke="url(#lineGradient)" stroke-width="3"/>
      
      <!-- Points -->
      ${data.map((d, i) => {
        const x = padding + (i * (width - 2 * padding)) / (data.length - 1 || 1);
        const y = height - padding - ((parseInt(d.total) - minValue) / range) * (height - 2 * padding);
        return `<circle cx="${x}" cy="${y}" r="4" fill="#1d4ed8"/>`;
      }).join('')}
      
      <!-- Labels -->
      ${data.map((d, i) => {
        const x = padding + (i * (width - 2 * padding)) / (data.length - 1 || 1);
        return `<text x="${x}" y="${height - 20}" text-anchor="middle" font-size="10" fill="#6b7280">${d.periodo || d.nombre}</text>`;
      }).join('')}
      
      <!-- Values -->
      ${data.map((d, i) => {
        const x = padding + (i * (width - 2 * padding)) / (data.length - 1 || 1);
        const y = height - padding - ((parseInt(d.total) - minValue) / range) * (height - 2 * padding);
        return `<text x="${x}" y="${y - 10}" text-anchor="middle" font-size="10" fill="#1f2937" font-weight="bold">${d.total}</text>`;
      }).join('')}
      
      <!-- Y-axis labels -->
      ${Array.from({length: 5}, (_, i) => {
        const value = minValue + (i * range) / 4;
        const y = height - padding - (i * (height - 2 * padding)) / 4;
        return `<text x="${padding - 10}" y="${y + 3}" text-anchor="end" font-size="10" fill="#6b7280">${Math.round(value)}</text>`;
      }).join('')}
    </svg>
  `;
}

function generateBarChartSVG(data: Array<{nombre?: string, total: string}>, title: string): string {
  if (!data || data.length === 0) {
    return `<div class="chart-placeholder">No hay datos disponibles para ${title}</div>`;
  }

  const width = 600;
  const height = 300;
  const padding = 50;
  
  const maxValue = Math.max(...data.map(d => parseInt(d.total) || 0));
  const barWidth = (width - 2 * padding) / data.length * 0.8;
  const barSpacing = (width - 2 * padding) / data.length * 0.2;

  const colors = [
    { light: '#3b82f6', dark: '#1d4ed8' }, // Blue
    { light: '#22c55e', dark: '#16a34a' }, // Green
    { light: '#f59e0b', dark: '#d97706' }, // Amber
    { light: '#ef4444', dark: '#dc2626' }, // Red
    { light: '#8b5cf6', dark: '#7c3aed' }, // Violet
    { light: '#06b6d4', dark: '#0891b2' }, // Cyan
    { light: '#f97316', dark: '#ea580c' }, // Orange
    { light: '#ec4899', dark: '#db2777' }, // Pink
    { light: '#84cc16', dark: '#65a30d' }, // Lime
    { light: '#6366f1', dark: '#4f46e5' }  // Indigo
  ];

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background: white;">
      <defs>
        ${data.map((d, i) => {
          const color = colors[i % colors.length];
          return `
            <linearGradient id="barGradient${i}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:${color.light};stop-opacity:0.8" />
              <stop offset="100%" style="stop-color:${color.dark};stop-opacity:1" />
            </linearGradient>
          `;
        }).join('')}
      </defs>
      
      <!-- Grid lines -->
      ${Array.from({length: 5}, (_, i) => {
        const y = padding + (i * (height - 2 * padding)) / 4;
        return `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>`;
      }).join('')}
      
      <!-- Bars -->
      ${data.map((d, i) => {
        const x = padding + barSpacing/2 + i * (barWidth + barSpacing);
        const barHeight = ((parseInt(d.total) || 0) / maxValue) * (height - 2 * padding);
        const y = height - padding - barHeight;
        
        return `
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="url(#barGradient${i})" rx="2"/>
          <text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle" font-size="10" fill="#1f2937" font-weight="bold">${d.total}</text>
          <text x="${x + barWidth/2}" y="${height - 20}" text-anchor="middle" font-size="9" fill="#6b7280">${(d.nombre || '').substring(0, 10)}${d.nombre?.length > 10 ? '...' : ''}</text>
        `;
      }).join('')}
      
      <!-- Y-axis labels -->
      ${Array.from({length: 5}, (_, i) => {
        const value = (i * maxValue) / 4;
        const y = height - padding - (i * (height - 2 * padding)) / 4;
        return `<text x="${padding - 10}" y="${y + 3}" text-anchor="end" font-size="10" fill="#6b7280">${Math.round(value)}</text>`;
      }).join('')}
    </svg>
  `;
}

function generateDonutChartSVG(data: Array<{tramite_tipo?: string, nombre?: string, total: string}>, title: string): string {
  if (!data || data.length === 0) {
    return `<div class="chart-placeholder">No hay datos disponibles para ${title}</div>`;
  }

  const size = 400;
  const center = size / 2;
  const outerRadius = size / 2 - 80;
  const innerRadius = outerRadius * 0.5; // Donut hole
  const explodeDistance = 8; // Distance to separate slices
  
  const total = data.reduce((sum, d) => sum + (parseInt(d.total) || 0), 0);
  if (total === 0) return `<div class="chart-placeholder">No hay datos disponibles para ${title}</div>`;
  
  const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];
  
  let currentAngle = 0;
  const slices = data.map((d, i) => {
    const value = parseInt(d.total) || 0;
    const percentage = (value / total) * 100;
    const angle = (value / total) * 360;
    
    if (angle === 0) return '';
    
    const startAngle = currentAngle * Math.PI / 180;
    const endAngle = (currentAngle + angle) * Math.PI / 180;
    const midAngle = (startAngle + endAngle) / 2;
    
    // Calculate explode offset
    const explodeX = Math.cos(midAngle) * explodeDistance;
    const explodeY = Math.sin(midAngle) * explodeDistance;
    
    // Outer arc points
    const x1 = center + explodeX + outerRadius * Math.cos(startAngle);
    const y1 = center + explodeY + outerRadius * Math.sin(startAngle);
    const x2 = center + explodeX + outerRadius * Math.cos(endAngle);
    const y2 = center + explodeY + outerRadius * Math.sin(endAngle);
    
    // Inner arc points
    const x3 = center + explodeX + innerRadius * Math.cos(endAngle);
    const y3 = center + explodeY + innerRadius * Math.sin(endAngle);
    const x4 = center + explodeX + innerRadius * Math.cos(startAngle);
    const y4 = center + explodeY + innerRadius * Math.sin(startAngle);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    const pathData = [
      `M ${x1} ${y1}`, // Move to start of outer arc
      `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}`, // Outer arc
      `L ${x3} ${y3}`, // Line to start of inner arc
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`, // Inner arc (reverse)
      'Z' // Close path
    ].join(' ');
    
    const color = colors[i % colors.length];
    
    // Label position (middle of the slice, outside)
    const labelRadius = outerRadius + 25;
    const labelX = center + explodeX + labelRadius * Math.cos(midAngle);
    const labelY = center + explodeY + labelRadius * Math.sin(midAngle);
    
    currentAngle += angle;
    
    return `
      <path d="${pathData}" fill="${color}" stroke="white" stroke-width="2"/>
      <text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="11" fill="#1f2937" font-weight="bold">${percentage.toFixed(1)}%</text>
    `;
  }).join('');

  // Generate legend
  const legendItems = data.map((d, i) => {
    const color = colors[i % colors.length];
    const tramiteLabel = d.tramite_tipo === 'si' ? 'Con trámite' : 
                        d.tramite_tipo === 'no' ? 'Sin trámite' : 
                        d.tramite_tipo === 'directo' ? 'Trámite directo' : 
                        d.tramite_tipo || 'Sin definir';
    return `
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <div style="width: 16px; height: 16px; background-color: ${color}; margin-right: 8px; border-radius: 2px;"></div>
        <span style="font-size: 12px; color: #374151;">${tramiteLabel}: <strong>${d.total}</strong> fichas</span>
      </div>
    `;
  }).join('');

  return `
    <div style="display: flex; align-items: center; gap: 30px;">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="background: white;">
        ${slices}
        
        <!-- Center text -->
        <text x="${center}" y="${center - 5}" text-anchor="middle" font-size="14" fill="#6b7280" font-weight="bold">TOTAL</text>
        <text x="${center}" y="${center + 15}" text-anchor="middle" font-size="20" fill="#1f2937" font-weight="bold">${total}</text>
      </svg>
      
      <div style="flex: 1;">
        <h4 style="margin: 0 0 15px 0; font-size: 14px; color: #374151; font-weight: bold;">Distribución</h4>
        ${legendItems}
      </div>
    </div>
  `;
}

function generatePieChartSVG(data: Array<{tematica_nombre?: string, nombre?: string, total: string}>, title: string): string {
  if (!data || data.length === 0) {
    return `<div class="chart-placeholder">No hay datos disponibles para ${title}</div>`;
  }

  const size = 300;
  const center = size / 2;
  const radius = size / 2 - 50;
  
  const total = data.reduce((sum, d) => sum + (parseInt(d.total) || 0), 0);
  if (total === 0) return `<div class="chart-placeholder">No hay datos disponibles para ${title}</div>`;
  
  const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];
  
  const explodeDistance = 6; // Distance to separate slices
  
  let currentAngle = 0;
  const slices = data.map((d, i) => {
    const value = parseInt(d.total) || 0;
    const percentage = (value / total) * 100;
    const angle = (value / total) * 360;
    
    if (angle === 0) return '';
    
    const startAngle = currentAngle * Math.PI / 180;
    const endAngle = (currentAngle + angle) * Math.PI / 180;
    const midAngle = (startAngle + endAngle) / 2;
    
    // Calculate explode offset
    const explodeX = Math.cos(midAngle) * explodeDistance;
    const explodeY = Math.sin(midAngle) * explodeDistance;
    
    // Recalculate center with explode offset
    const explodedCenterX = center + explodeX;
    const explodedCenterY = center + explodeY;
    
    const x1 = explodedCenterX + radius * Math.cos(startAngle);
    const y1 = explodedCenterY + radius * Math.sin(startAngle);
    const x2 = explodedCenterX + radius * Math.cos(endAngle);
    const y2 = explodedCenterY + radius * Math.sin(endAngle);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    const pathData = [
      `M ${explodedCenterX} ${explodedCenterY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    const labelX = explodedCenterX + (radius * 0.7) * Math.cos(midAngle);
    const labelY = explodedCenterY + (radius * 0.7) * Math.sin(midAngle);
    
    currentAngle += angle;
    
    return `
      <path d="${pathData}" fill="${colors[i % colors.length]}" stroke="white" stroke-width="2"/>
      ${percentage >= 5 ? `<text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="10" fill="white" font-weight="bold">${percentage.toFixed(0)}%</text>` : ''}
    `;
  });

  const legend = data.map((d, i) => {
    const value = parseInt(d.total) || 0;
    const percentage = (value / total) * 100;
    return `
      <div style="display: flex; align-items: center; margin-bottom: 5px; font-size: 11px;">
        <div style="width: 12px; height: 12px; background: ${colors[i % colors.length]}; margin-right: 8px; border-radius: 2px;"></div>
        <span style="color: #374151;">${d.tematica_nombre || d.nombre}: ${value} (${percentage.toFixed(1)}%)</span>
      </div>
    `;
  }).join('');

  return `
    <div style="display: flex; align-items: center; gap: 20px;">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="background: white;">
        ${slices.join('')}
      </svg>
      <div style="flex: 1;">
        ${legend}
      </div>
    </div>
  `;
}

function generateHTMLPage({ filters, config, stats, chartData }: {
  filters: Record<string, string | null>,
  config: Record<string, unknown>,
  stats: Record<string, unknown>,
  chartData: Record<string, unknown>
}) {
  const currentDate = new Date().toLocaleDateString('es-ES');
  const currentTime = new Date().toLocaleTimeString('es-ES');
  
  const documentType = config.includeCharts && !config.includeTable ? 'INFORME DE INSIGHTS' : 
                      config.includeTable && !config.includeCharts ? 'JUSTIFICANTE DE AYUDAS' : 
                      'INFORME COMPLETO';

  // Get active filters for display
  const activeFilters = Object.entries(filters)
    .filter(([key, value]) => value && value !== '')
    .map(([key, value]) => {
      const labels: Record<string, string> = {
        q: 'Búsqueda',
        anio: 'Año',
        mes: 'Mes',
        ambito: 'Ámbito',
        ccaa_id: 'Comunidad Autónoma',
        provincia_id: 'Provincia',
        tramite_tipo: 'Trámite Online',
        complejidad: 'Complejidad',
        tematica_id: 'Temática',
        trabajador_id: 'Redactor',
        trabajador_subida_id: 'Subido por'
      };
      
      return `<div class="filter-item"><strong>${labels[key] || key}:</strong> <span class="filter-value">${value}</span></div>`;
    });

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${documentType} - Portal Solidaridad Intergeneracional</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #2d3748;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .page {
            width: ${config.orientation === 'landscape' ? '297mm' : '210mm'};
            min-height: ${config.orientation === 'landscape' ? '210mm' : '297mm'};
            padding: 15mm;
            margin: 0 auto;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding: 20px;
            background: linear-gradient(135deg, #8E8D29 0%, #D17C22 100%);
            color: white;
            border-radius: 8px;
        }
        
        .header h1 {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .header .subtitle {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .header .date {
            font-size: 11px;
            margin-top: 10px;
            opacity: 0.8;
        }
        
        .stats-dashboard {
            display: flex;
            gap: 15px;
            margin-bottom: 25px;
        }
        
        .stat-card {
            flex: 1;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .stat-card.primary {
            background: #eff6ff;
            border-color: #3b82f6;
        }
        
        .stat-card.success {
            background: #f0fdf4;
            border-color: #22c55e;
        }
        
        .stat-card.warning {
            background: #fefce8;
            border-color: #eab308;
        }
        
        .stat-value {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
        }
        
        .stat-label {
            font-size: 11px;
            color: #6b7280;
            margin-top: 5px;
            text-transform: uppercase;
            font-weight: 600;
        }
        
        .filters-section {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 25px;
        }
        
        .filters-title {
            font-size: 14px;
            font-weight: bold;
            color: #92400e;
            margin-bottom: 10px;
        }
        
        .filters-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 8px;
        }
        
        .filter-item {
            font-size: 11px;
            color: #78716c;
        }
        
        .filter-value {
            font-weight: 600;
            color: #1c1917;
        }
        
        .charts-section {
            margin-bottom: 30px;
        }
        
        .chart-container {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .chart-title {
            font-size: 16px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 15px;
            text-align: center;
        }
        
        .chart-placeholder {
            width: 100%;
            height: 300px;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #f8fafc;
            border: 2px dashed #cbd5e1;
            border-radius: 8px;
            color: #64748b;
            font-size: 18px;
            text-align: center;
        }
        
    </style>
</head>
<body>
    <div class="page">
        <!-- Header -->
        <div class="header">
            <h1>${documentType}</h1>
            <div class="subtitle">Portal Solidaridad Intergeneracional</div>
            <div class="date">Generado el ${currentDate} a las ${currentTime}</div>
        </div>

        <!-- Stats Dashboard -->
        <div class="stats-dashboard">
            <div class="stat-card primary">
                <div class="stat-value">${(stats.total as number)?.toLocaleString() || 0}</div>
                <div class="stat-label">Fichas Totales</div>
            </div>
            <div class="stat-card success">
                <div class="stat-value">${stats.portales || 0}</div>
                <div class="stat-label">Portales Activos</div>
            </div>
            <div class="stat-card warning">
                <div class="stat-value">${stats.tramitesOnline || 0}</div>
                <div class="stat-label">Trámites Online</div>
            </div>
        </div>

        <!-- Filters Section -->
        <div class="filters-section">
            <div class="filters-title">🔍 CRITERIOS DE ANÁLISIS</div>
            <div class="filters-grid">
                ${activeFilters.length > 0 ? activeFilters.join('') : '<div class="filter-item"><span class="filter-value">Sin filtros aplicados - Mostrando todos los datos</span></div>'}
            </div>
        </div>
        
        <!-- Charts Section -->
        ${config.includeCharts ? `
        <div class="charts-section">
            ${(config.chartTypes as string[])?.includes('fichas-por-mes') ? `
            <div class="chart-container">
                <div class="chart-title">📈 Evolución de Fichas por Mes</div>
                ${generateLineChartSVG(chartData.fichasPorMes as Array<{periodo?: string, nombre?: string, total: string}> || [], 'Evolución de Fichas por Mes')}
            </div>
            ` : ''}

            ${(config.chartTypes as string[])?.includes('portales-por-mes') ? `
            <div class="chart-container">
                <div class="chart-title">🍰 Distribución por Portales</div>
                ${generateBarChartSVG(chartData.portales as Array<{nombre?: string, total: string}> || [], 'Distribución por Portales')}
            </div>
            ` : ''}

            ${(config.chartTypes as string[])?.includes('tematicas-distribucion') || (!config.chartTypes) ? `
            <div class="chart-container">
                <div class="chart-title">🏷️ Distribución por Temáticas</div>
                ${generatePieChartSVG(chartData.tematicas as Array<{tematica_nombre?: string, nombre?: string, total: string}> || [], 'Distribución por Temáticas')}
            </div>
            ` : ''}

            ${(config.chartTypes as string[])?.includes('tramite-online') ? `
            <div class="chart-container">
                <div class="chart-title">💻 Distribución por Tipo de Trámite</div>
                ${generateDonutChartSVG(chartData.tramiteOnline as Array<{tramite_tipo?: string, nombre?: string, total: string}> || [], 'Distribución por Tipo de Trámite')}
            </div>
            ` : ''}
        </div>
        ` : ''}

    </div>
</body>
</html>`;
}