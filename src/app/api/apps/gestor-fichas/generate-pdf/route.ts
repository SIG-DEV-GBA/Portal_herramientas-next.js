import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/db";
import { requirePermission } from "@/lib/utils/api-guard";
import { jsPDF } from 'jspdf';
import type { PDFConfig } from "@/app/apps/gestor-fichas/components/pdf/PDFConfigModal";

export const runtime = "nodejs";

// Configuración del generador de gráficas
const chartWidth = 800;
const chartHeight = 400;

// Función para obtener datos de gráficas directamente desde la base de datos
async function fetchChartData(chartType: string, filters: FilterParams, req: NextRequest) {
  try {
    console.log(`=== FETCHING CHART DATA DIRECTLY: ${chartType} ===`);
    
    switch (chartType) {
      case 'fichas-por-mes':
        return await getFichasPorMesData(filters);
      case 'portales-por-mes':
        return await getPortalesPorMesData(filters);
      case 'ambitos-por-portal':
        return await getAmbitosPorPortalData(filters);
      case 'tramite-online':
        return await getTramiteOnlineData(filters);
      default:
        console.log(`Unknown chart type: ${chartType}`);
        return null;
    }
  } catch (error) {
    console.error(`Error fetching ${chartType} data:`, error);
    return null;
  }
}

// Función para generar resumen estadístico de fichas por mes (sin gráfica)
async function generateFichasPorMesChart(data: any): Promise<Buffer | null> {
  // Chart generation not implemented - showing data summary instead
  console.log('Chart generation not implemented - showing data summary instead');
  return null;
}

// Función para generar resumen estadístico de portales por mes (sin gráfica)
async function generatePortalesPorMesChart(data: any): Promise<Buffer | null> {
  // Chart generation not implemented - showing data summary instead
  console.log('Chart generation not implemented - showing data summary instead');
  return null;
}

export async function GET(req: NextRequest) {
  try {
    console.log("=== PDF GENERATION STARTED ===");
    
    const { error } = await requirePermission(req, "fichas", "read");
    if (error) {
      console.log("Permission error:", error);
      return error;
    }

    const sp = req.nextUrl.searchParams;
    const configJson = sp.get("config");
    
    if (!configJson) {
      console.log("Missing PDF configuration");
      return NextResponse.json(
        { error: "Missing PDF configuration" },
        { status: 400 }
      );
    }

    console.log("=== CONFIGURATION ===");
    console.log("Config JSON:", configJson);
    const config: PDFConfig = JSON.parse(configJson);
    console.log("Parsed config:", JSON.stringify(config, null, 2));
    console.log("Config includeCharts property:", config.includeCharts);
    console.log("Config chartTypes property:", config.chartTypes);
    console.log("Config chartTypes type:", typeof config.chartTypes);
    console.log("Config chartTypes isArray:", Array.isArray(config.chartTypes));
    
    // Extract filters from URL params
    const filters = {
      q: sp.get("q") ?? "",
      ambito: sp.get("ambito") ?? "",
      ccaa_id: sp.get("ccaa_id") ?? "",
      provincia_id: sp.get("provincia_id") ?? "",
      provincia_principal: sp.get("provincia_principal") ?? "",
      tramite_tipo: sp.get("tramite_tipo") ?? "",
      complejidad: sp.get("complejidad") ?? "",
      tematica_id: sp.get("tematica_id") ?? "",
      trabajador_id: sp.get("trabajador_id") ?? "",
      trabajador_subida_id: sp.get("trabajador_subida_id") ?? "",
      anio: sp.get("anio") ?? "",
      mes: sp.get("mes") ?? "",
      created_desde: sp.get("created_desde") ?? "",
      created_hasta: sp.get("created_hasta") ?? "",
      destaque_principal: sp.get("destaque_principal") ?? "",
      destaque_secundario: sp.get("destaque_secundario") ?? "",
    };

    console.log("=== FILTERS EXTRACTED ===");
    console.log("Filters:", JSON.stringify(filters, null, 2));

    // Create PDF with professional styling
    console.log("Creating professional PDF document with orientation:", config.orientation);
    const doc = new jsPDF({
      orientation: config.orientation === 'landscape' ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // Set encoding for proper UTF-8 support
    doc.setFont('helvetica', 'normal');
    
    // Get page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    
    console.log("PDF document created successfully");

    // ENCABEZADO MODERNO Y PROFESIONAL
    // Fondo degradado simulado con múltiples rectángulos
    doc.setFillColor(209, 124, 34); // Principal
    doc.rect(0, 0, pageWidth, 45, 'F');
    doc.setFillColor(189, 104, 14); // Degradado
    doc.rect(0, 35, pageWidth, 10, 'F');
    
    // TÍTULO PRINCIPAL
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORME DE FICHAS', margin, 22);
    
    // SUBTÍTULO
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Sistema de Gestión Documental`, margin, 32);
    
    // FECHA EN ESQUINA DERECHA
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    const fechaActual = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
    doc.text(`Generado: ${fechaActual}`, pageWidth - 60, 22);
    doc.text(`${new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}`, pageWidth - 60, 32);
    
    // Reset text color for body
    doc.setTextColor(51, 51, 51); // Dark gray
    
    let yPosition = 60; // Más espacio después del nuevo encabezado

    // Helper function to add a new page with header
    const addNewPageWithHeader = () => {
      doc.addPage();
      // Encabezado simplificado para páginas siguientes
      doc.setFillColor(209, 124, 34);
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORME DE FICHAS', margin, 18);
      doc.setTextColor(51, 51, 51);
      yPosition = 40;
    };

    // Helper function to check if we need a new page
    const checkNewPage = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - margin - 10) {
        addNewPageWithHeader();
        return true;
      }
      return false;
    };

    // Professional Filter Information Section
    if (config.includeFiltersInfo) {
      checkNewPage(40);
      
      // Section header with background
      doc.setFillColor(240, 248, 255); // Light blue background
      doc.rect(margin - 5, yPosition - 5, maxWidth + 10, 25, 'F');
      doc.setDrawColor(59, 130, 246); // Blue border
      doc.setLineWidth(0.5);
      doc.rect(margin - 5, yPosition - 5, maxWidth + 10, 25, 'S');
      
      doc.setTextColor(59, 130, 246);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('FILTROS APLICADOS', margin, yPosition + 8);
      
      yPosition += 30;
      
      const activeFilters = [];
      if (filters.q) activeFilters.push(`• Búsqueda: "${filters.q}"`);
      if (filters.anio) activeFilters.push(`• Año: ${filters.anio}`);
      if (filters.mes) activeFilters.push(`• Mes: ${filters.mes}`);
      if (filters.ambito) activeFilters.push(`• Ámbito: ${filters.ambito}`);
      if (filters.tramite_tipo) activeFilters.push(`• Trámite: ${filters.tramite_tipo}`);
      if (filters.complejidad) activeFilters.push(`• Complejidad: ${filters.complejidad}`);
      if (filters.ccaa_id) activeFilters.push(`• CCAA ID: ${filters.ccaa_id}`);
      if (filters.provincia_id) activeFilters.push(`• Provincia ID: ${filters.provincia_id}`);
      
      doc.setTextColor(51, 51, 51);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      if (activeFilters.length === 0) {
        doc.text('Sin filtros específicos aplicados', margin + 10, yPosition);
        yPosition += 12;
      } else {
        activeFilters.forEach(filter => {
          checkNewPage(12);
          doc.text(filter, margin + 10, yPosition);
          yPosition += 12;
        });
      }
      yPosition += 15;
    }

    // Professional Charts Section with Real Data
    console.log("=== CHECKING CHARTS SECTION ===");
    console.log("Include charts:", config.includeCharts);
    console.log("Chart types:", config.chartTypes);
    console.log("Chart types length:", config.chartTypes ? config.chartTypes.length : 'undefined');
    console.log("Chart types is array?", Array.isArray(config.chartTypes));
    console.log("Full config object:", JSON.stringify(config, null, 2));
    
    if (config.includeCharts && config.chartTypes && config.chartTypes.length > 0) {
      console.log("=== STARTING CHARTS SECTION ===");
      checkNewPage(40);
      
      // Section header
      doc.setFillColor(253, 230, 138); // Light yellow background
      doc.rect(margin - 5, yPosition - 5, maxWidth + 10, 25, 'F');
      doc.setDrawColor(245, 158, 11); // Yellow border
      doc.setLineWidth(0.5);
      doc.rect(margin - 5, yPosition - 5, maxWidth + 10, 25, 'S');
      
      doc.setTextColor(245, 158, 11);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('ANÁLISIS ESTADÍSTICO', margin, yPosition + 8);
      
      yPosition += 35;

      // Generate real charts for each selected type
      for (const chartType of config.chartTypes) {
        checkNewPage(120); // Reserve space for chart and description
        
        console.log(`Generating chart: ${chartType}`);
        
        let chartTitle = '';
        let chartDescription = '';
        
        switch (chartType) {
          case 'fichas-por-mes':
            chartTitle = 'Evolución Mensual de Fichas';
            chartDescription = 'Distribución temporal del registro de fichas a lo largo del año, mostrando tendencias y patrones estacionales.';
            break;
          case 'portales-por-mes':
            chartTitle = 'Distribución por Portal';
            chartDescription = 'Análisis comparativo de la actividad entre diferentes portales web durante el período seleccionado.';
            break;
          case 'ambitos-por-portal':
            chartTitle = 'Cobertura por Ámbito Administrativo';
            chartDescription = 'Desglose de fichas por nivel administrativo (UE, Estado, CCAA, Provincial) en cada portal.';
            break;
          case 'tramite-online':
            chartTitle = 'Digitalización de Trámites';
            chartDescription = 'Proporción de trámites disponibles online versus presenciales, indicador de transformación digital.';
            break;
          default:
            chartTitle = 'Análisis Estadístico';
            chartDescription = 'Gráfica de datos estadísticos del sistema.';
        }

        // Chart title with professional styling
        doc.setTextColor(51, 51, 51);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(chartTitle, margin, yPosition);
        yPosition += 10;
        
        // Chart description
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(102, 102, 102);
        const descriptionLines = doc.splitTextToSize(chartDescription, maxWidth);
        doc.text(descriptionLines, margin, yPosition);
        yPosition += descriptionLines.length * 5 + 10;
        
        // Generate and embed real chart
        try {
          console.log(`=== FETCHING CHART DATA: ${chartType} ===`);
          const chartData = await fetchChartData(chartType, filters, req);
          console.log(`Chart data received:`, JSON.stringify(chartData, null, 2));
          let chartBuffer: Buffer | null = null;
          
          if (chartData) {
            switch (chartType) {
              case 'fichas-por-mes':
                chartBuffer = await generateFichasPorMesChart(chartData);
                break;
              case 'portales-por-mes':
                chartBuffer = await generatePortalesPorMesChart(chartData);
                break;
            }
          }
          
          if (chartBuffer) {
            const chartImageData = `data:image/png;base64,${chartBuffer.toString('base64')}`;
            const chartWidth = config.orientation === 'landscape' ? 120 : 90;
            const chartHeight = config.orientation === 'landscape' ? 60 : 45;
            
            // Center the chart
            const chartX = (pageWidth - chartWidth) / 2;
            doc.addImage(chartImageData, 'PNG', chartX, yPosition, chartWidth, chartHeight);
            yPosition += chartHeight + 20;
          } else {
            // Show statistical summary instead of chart
            const summaryHeight = 120; // Much bigger to show all the data
            const summaryWidth = maxWidth - 20;
            
            doc.setDrawColor(209, 124, 34);
            doc.setFillColor(254, 249, 195);
            doc.rect(margin + 10, yPosition, summaryWidth, summaryHeight, 'FD');
            
            // VISUALIZACIÓN ESTADÍSTICA MEJORADA - MÁS PROFESIONAL
            if (chartData) {
              try {
                if (chartType === 'fichas-por-mes' && chartData.items) {
                const total = chartData.items.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
                
                // TÍTULO PRINCIPAL
                doc.setTextColor(31, 41, 55);
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text(`EVOLUCION MENSUAL DE FICHAS`, margin + 15, yPosition + 18);
                
                // MÉTRICA PRINCIPAL
                doc.setTextColor(209, 124, 34);
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text(`${total}`, margin + 15, yPosition + 35);
                doc.setTextColor(75, 85, 99);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text(`fichas totales`, margin + 35, yPosition + 35);
                
                // DESGLOSE POR MESES (2 columnas)
                let yPos = yPosition + 48;
                let xCol1 = margin + 15;
                let xCol2 = margin + 100;
                const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                
                doc.setTextColor(75, 85, 99);
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                
                chartData.items.forEach((item: any, index: number) => {
                  if (item.total > 0) {
                    const x = index % 2 === 0 ? xCol1 : xCol2;
                    // ARREGLAR: usar mes_index correctamente y verificar que existe
                    const mesIndex = item.mes_index || (index + 1);
                    const mesNombre = meses[mesIndex - 1] || `Mes ${mesIndex}`;
                    console.log(`Mes item:`, { mes_index: item.mes_index, mesNombre, total: item.total });
                    doc.text(`${mesNombre}: ${item.total}`, x, yPos);
                    if (index % 2 === 1) yPos += 10;
                  }
                });
                
              } else if (chartType === 'portales-por-mes' && Array.isArray(chartData)) {
                // TÍTULO PRINCIPAL
                doc.setTextColor(31, 41, 55);
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text(`DISTRIBUCION POR PORTALES`, margin + 15, yPosition + 18);
                
                // CALCULAR TOTALES
                console.log(`=== PROCESSING PORTALES DATA ===`);
                const portalCounts = {};
                chartData.forEach((item: any) => {
                  console.log(`Portal item:`, { portal_nombre: item.portal_nombre, total: item.total });
                  if (item.total > 0) {
                    if (!portalCounts[item.portal_nombre]) {
                      portalCounts[item.portal_nombre] = 0;
                    }
                    portalCounts[item.portal_nombre] += item.total;
                  }
                });
                console.log(`Portal counts:`, portalCounts);
                
                const portalesActivos = Object.keys(portalCounts).length;
                const totalFichas = Object.values(portalCounts).reduce((sum, count) => sum + count, 0);
                
                // MÉTRICAS PRINCIPALES
                doc.setTextColor(209, 124, 34);
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text(`${portalesActivos}`, margin + 15, yPosition + 35);
                doc.setTextColor(75, 85, 99);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text(`portales activos`, margin + 35, yPosition + 35);
                
                doc.setTextColor(209, 124, 34);
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text(`${totalFichas}`, margin + 120, yPosition + 35);
                doc.setTextColor(75, 85, 99);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text(`fichas distribuidas`, margin + 140, yPosition + 35);
                
                // LISTA DE PORTALES
                let yPos = yPosition + 50;
                doc.setTextColor(75, 85, 99);
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                
                Object.entries(portalCounts)
                  .sort(([,a], [,b]) => b - a) // Ordenar por cantidad descendente
                  .slice(0, 6) // Máximo 6 portales
                  .forEach(([portal, count]) => {
                    doc.text(`• ${portal}: ${count} fichas`, margin + 15, yPos);
                    yPos += 10;
                  });
                
              } else {
                // DATOS GENÉRICOS
                doc.setTextColor(75, 85, 99);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text('DATOS ESTADISTICOS DISPONIBLES', margin + 15, yPosition + 25);
                doc.text('Consulte la aplicacion web para ver analisis detallados', margin + 15, yPosition + 40);
              }
              } catch (chartProcessingError) {
                console.error(`PDF: Error processing chart data for ${chartType}:`, chartProcessingError);
                doc.setTextColor(239, 68, 68);
                doc.setFontSize(10);
                doc.text('Error al procesar datos de grafica', margin + 15, yPosition + 25);
              }
            } else {
              console.log(`WARNING: No chart data received for ${chartType}`);
              doc.setTextColor(156, 163, 175);
              doc.setFontSize(10);
              doc.setFont('helvetica', 'italic');
              doc.text('No se pudieron obtener datos estadisticos', margin + 15, yPosition + 40);
              doc.text('Verifique los filtros aplicados', margin + 15, yPosition + 55);
            }
            
            yPosition += summaryHeight + 20;
          }
        } catch (error) {
          console.error(`Error generating ${chartType} chart:`, error);
          // Error placeholder
          const chartHeight = 40;
          doc.setDrawColor(239, 68, 68);
          doc.setFillColor(254, 226, 226);
          doc.rect(margin + 10, yPosition, maxWidth - 20, chartHeight, 'FD');
          doc.setTextColor(239, 68, 68);
          doc.setFontSize(10);
          doc.text(`Error al generar gráfica: ${chartType}`, margin + 15, yPosition + chartHeight/2);
          yPosition += chartHeight + 15;
        }
      }
    } else {
      console.log("=== CHARTS SECTION SKIPPED ===");
      console.log("Reasons:");
      console.log("- includeCharts:", config.includeCharts);
      console.log("- chartTypes exists:", !!config.chartTypes);
      console.log("- chartTypes length:", config.chartTypes ? config.chartTypes.length : 'N/A');
      if (!config.includeCharts) {
        console.log("- Charts disabled by user configuration");
      }
      if (!config.chartTypes || config.chartTypes.length === 0) {
        console.log("- No chart types specified or empty array");
      }
    }

    // Professional Table Section with Complete Data
    if (config.includeTable) {
      console.log("Starting professional table section");
      
      // Start new page for table if needed
      addNewPageWithHeader();
      
      // Section header
      doc.setFillColor(220, 252, 231); // Light green background
      doc.rect(margin - 5, yPosition - 5, maxWidth + 10, 25, 'F');
      doc.setDrawColor(34, 197, 94); // Green border
      doc.setLineWidth(0.5);
      doc.rect(margin - 5, yPosition - 5, maxWidth + 10, 25, 'S');
      
      doc.setTextColor(34, 197, 94);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('REGISTRO DETALLADO DE FICHAS', margin, yPosition + 8);
      
      yPosition += 35;

      // Fetch comprehensive data for the table
      console.log("=== FETCHING FICHAS DATA ===");
      const fichasData = await getComprehensiveFichasForPDF(filters);
      console.log("=== FICHAS DATA RETRIEVED ===");
      console.log(`Found ${fichasData.length} fichas for PDF`);
      if (fichasData.length > 0) {
        // Convert BigInt to string for logging
        const sampleFicha = { ...fichasData[0] };
        if (sampleFicha.id && typeof sampleFicha.id === 'bigint') {
          sampleFicha.id = sampleFicha.id.toString();
        }
        console.log("Sample ficha:", JSON.stringify(sampleFicha, null, 2));
      }
      
      if (fichasData.length > 0) {
        // DISEÑO DE TARJETAS PROFESIONALES - MOSTRAR TODAS LAS FICHAS ENCONTRADAS
        const fichasToShow = fichasData; // Mostrar TODAS las fichas, no limitar
        
        fichasToShow.forEach((ficha, index) => {
          checkNewPage(85); // Mucho más espacio para cada tarjeta con toda la información
          
          // Tarjeta con sombra y bordes redondeados (simulados)
          const cardHeight = 75; // Aumentado para más contenido
          const cardWidth = maxWidth;
          
          // Fondo de la tarjeta con gradiente simulado
          doc.setFillColor(255, 255, 255);
          doc.rect(margin, yPosition, cardWidth, cardHeight, 'F');
          
          // Borde de la tarjeta
          doc.setDrawColor(209, 124, 34);
          doc.setLineWidth(0.8);
          doc.rect(margin, yPosition, cardWidth, cardHeight, 'S');
          
          // Banda de color izquierda para categoría
          const colorMap = {
            'UE': [72, 85, 156],        // Azul UE
            'ESTADO': [34, 197, 94],    // Verde Estado
            'CCAA': [245, 158, 11],     // Amarillo CCAA
            'PROVINCIAL': [239, 68, 68] // Rojo Provincial
          };
          const color = colorMap[ficha.ambito_nivel] || [156, 163, 175]; // Gris por defecto
          doc.setFillColor(color[0], color[1], color[2]);
          doc.rect(margin, yPosition, 4, cardHeight, 'F');
          
          // Contenido de la tarjeta
          let cardY = yPosition + 8;
          
          // TÍTULO DE LA FICHA (grande y prominente)
          doc.setTextColor(31, 41, 55);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          const nombreFicha = (ficha.nombre_ficha || 'Sin nombre').substring(0, 80);
          doc.text(nombreFicha, margin + 8, cardY);
          cardY += 12;
          
          // LÍNEA 1: ID y Fecha
          doc.setTextColor(75, 85, 99);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(`ID: ${ficha.id}`, margin + 8, cardY);
          const fecha = ficha.created_at ? new Date(ficha.created_at).toLocaleDateString('es-ES') : 'Sin fecha';
          doc.text(`Fecha: ${fecha}`, margin + 80, cardY);
          cardY += 10;
          
          // LÍNEA 2: Ámbito, Trámite y Complejidad
          doc.text(`Ambito: ${ficha.ambito_nivel}`, margin + 8, cardY);
          doc.text(`Tramite: ${ficha.tramite_tipo}`, margin + 80, cardY);
          if (config.orientation === 'landscape') {
            doc.text(`Complejidad: ${ficha.complejidad}`, margin + 150, cardY);
          }
          cardY += 10;
          
          // LÍNEA 3: Información geográfica
          if (ficha.ccaa_nombre !== 'Sin especificar' || ficha.provincia_nombre !== 'Sin especificar') {
            doc.text(`CCAA: ${ficha.ccaa_nombre}`, margin + 8, cardY);
            if (config.orientation === 'landscape') {
              doc.text(`Provincia: ${ficha.provincia_nombre}`, margin + 120, cardY);
            }
            cardY += 10;
          }
          
          // LÍNEA 4: Trabajadores
          if (ficha.trabajador_nombre !== 'Sin asignar' || ficha.trabajador_subida_nombre !== 'Sistema') {
            doc.text(`Redactor: ${ficha.trabajador_nombre}`, margin + 8, cardY);
            if (config.orientation === 'landscape') {
              doc.text(`Subido por: ${ficha.trabajador_subida_nombre}`, margin + 120, cardY);
            }
            cardY += 10;
          }
          
          // LÍNEA 5: Portales y Temáticas
          if (ficha.portales_nombres !== 'Sin portales') {
            doc.setTextColor(107, 114, 128);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            const portalesTexto = `Portales: ${ficha.portales_nombres.substring(0, 80)}${ficha.portales_nombres.length > 80 ? '...' : ''}`;
            doc.text(portalesTexto, margin + 8, cardY);
            cardY += 8;
          }
          
          if (ficha.tematicas_nombres !== 'Sin tematicas') {
            doc.setTextColor(107, 114, 128);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            const tematicasTexto = `Tematicas: ${ficha.tematicas_nombres.substring(0, 80)}${ficha.tematicas_nombres.length > 80 ? '...' : ''}`;
            doc.text(tematicasTexto, margin + 8, cardY);
            cardY += 8;
          }
          
          // DESCRIPCIÓN (si existe)
          if (ficha.frase_publicitaria) {
            doc.setTextColor(107, 114, 128);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            const descripcion = `Descripcion: ${ficha.frase_publicitaria.substring(0, 100)}${ficha.frase_publicitaria.length > 100 ? '...' : ''}`;
            doc.text(descripcion, margin + 8, cardY);
          }
          
          yPosition += cardHeight + 12; // Más separación entre tarjetas
        });

        // RESUMEN FINAL con diseño mejorado
        yPosition += 10;
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, yPosition, maxWidth, 25, 'F');
        doc.setDrawColor(209, 124, 34);
        doc.setLineWidth(1);
        doc.rect(margin, yPosition, maxWidth, 25, 'S');
        
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        
        const resumenText = `Total encontrado: ${fichasData.length} fichas`;
          
        doc.text(resumenText, margin + 10, yPosition + 15);
        
      } else {
        // No data message with professional styling
        doc.setFillColor(254, 242, 242);
        doc.rect(margin, yPosition, maxWidth, 40, 'F');
        doc.setDrawColor(239, 68, 68);
        doc.rect(margin, yPosition, maxWidth, 40, 'S');
        
        doc.setTextColor(185, 28, 28);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('No se encontraron fichas', margin + 20, yPosition + 20);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Verifique los filtros aplicados o intente con criterios más amplios', margin + 20, yPosition + 30);
      }
    }

    console.log("Finalizing professional PDF document");
    
    // Add professional footer to all pages
    const totalPages = doc.internal.pages.length - 1; // Subtract 1 because pages array includes a blank page
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Footer background
      doc.setFillColor(248, 250, 252);
      doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
      
      // Footer line
      doc.setDrawColor(209, 124, 34);
      doc.setLineWidth(1);
      doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
      
      // Footer text
      doc.setTextColor(102, 102, 102);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      
      // Left side: Generation info
      const generationInfo = `Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`;
      doc.text(generationInfo, margin, pageHeight - 8);
      
      // Center: System info
      doc.text('Sistema de Gestión de Fichas', pageWidth / 2 - 30, pageHeight - 8);
      
      // Right side: Page number
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 25, pageHeight - 8);
    }
    
    // Get the PDF as a buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    console.log("Professional PDF buffer ready, size:", pdfBuffer.length, "bytes");

    // Generate professional filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filterSummary = filters.anio ? `_${filters.anio}` : '';
    const filename = `informe-fichas${filterSummary}_${timestamp}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Internal error";
    const errorStack = e instanceof Error ? e.stack : "No stack trace";
    console.error("generate-pdf error:", errorMessage);
    console.error("Stack trace:", errorStack);
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}

interface FilterParams {
  q?: string;
  ambito?: string;
  tramite_tipo?: string;
  complejidad?: string;
  tematica_id?: string;
  ccaa_id?: string;
  provincia_id?: string;
  trabajador_id?: string;
  trabajador_subida_id?: string;
  anio?: string;
  mes?: string;
  created_desde?: string;
  created_hasta?: string;
}

// Función mejorada para obtener datos completos para el PDF - USANDO LA MISMA LÓGICA DEL API PRINCIPAL
async function getComprehensiveFichasForPDF(filters: FilterParams) {
  try {
    // =====================  FILTROS - COPIADOS EXACTAMENTE DEL API PRINCIPAL  =====================
    const where: Record<string, any> = {};

    // 0) Texto libre (en nombre_ficha / frase_publicitaria / texto_divulgacion)
    const q = (filters.q ?? "").trim();
    if (q) {
      where.OR = [
        { nombre_ficha: { contains: q } },
        { frase_publicitaria: { contains: q } },
        { texto_divulgacion: { contains: q } },
      ];
    }

    // 2) Ámbito
    const ambito = filters.ambito as "UE" | "ESTADO" | "CCAA" | "PROVINCIA" | null;
    if (ambito) where.ambito_nivel = ambito;

    // 3) Tipo de trámite
    const tramite_tipo = filters.tramite_tipo as "no" | "si" | "directo" | null;
    if (tramite_tipo) where.tramite_tipo = tramite_tipo;

    // 4) Año (YYYY) => rango [inicio_año, fin_año] - LÓGICA EXACTA DEL API PRINCIPAL
    const anio = filters.anio;
    let anioDesde: Date | null = null;
    let anioHasta: Date | null = null;
    if (anio && /^\d{4}$/.test(anio)) {
      const Y = Number(anio);
      anioDesde = new Date(Date.UTC(Y, 0, 1, 0, 0, 0)); // 1 enero
      anioHasta = new Date(Date.UTC(Y, 11, 31, 23, 59, 59)); // 31 diciembre
    }

    // 5) Mes (YYYY-MM) => rango [inicio_mes, fin_mes]
    const mes = filters.mes;
    let mesDesde: Date | null = null;
    let mesHasta: Date | null = null;
    if (mes && /^\d{4}-\d{2}$/.test(mes)) {
      const [Y, M] = mes.split("-").map(Number);
      // UTC para evitar desfases de TZ
      mesDesde = new Date(Date.UTC(Y, M - 1, 1, 0, 0, 0));
      mesHasta = new Date(Date.UTC(Y, M, 0, 23, 59, 59)); // último día del mes
    }

    // 6) Rango de fechas libre (created_at)
    const created_desde = filters.created_desde; // YYYY-MM-DD
    const created_hasta = filters.created_hasta;
    const rangoDesde = created_desde ? new Date(created_desde + "T00:00:00Z") : null;
    const rangoHasta = created_hasta ? new Date(created_hasta + "T23:59:59Z") : null;

    if (anioDesde || anioHasta || mesDesde || mesHasta || rangoDesde || rangoHasta) {
      where.created_at = {};
      const d1 = anioDesde ?? mesDesde ?? rangoDesde;
      const d2 = anioHasta ?? mesHasta ?? rangoHasta;
      if (d1) where.created_at.gte = d1;
      if (d2) where.created_at.lte = d2;
    }

    // 7) Localización / otros campos
    const ccaa_id = filters.ccaa_id;
    if (ccaa_id) where.ambito_ccaa_id = Number(ccaa_id);

    const provincia_id = filters.provincia_id;
    if (provincia_id) {
      where.ambito_provincia_id = Number(provincia_id); // Filtro restrictivo original
    }

    const complejidad = filters.complejidad as "baja" | "media" | "alta" | null;
    if (complejidad) where.complejidad = complejidad;

    // 8) Trabajador
    const trabajador_id = filters.trabajador_id;
    if (trabajador_id) {
      where.trabajador_id = Number(trabajador_id);
    }

    const trabajador_subida_id = filters.trabajador_subida_id;
    if (trabajador_subida_id) {
      where.trabajador_subida_id = Number(trabajador_subida_id);
    }

    console.log("PDF query conditions:", JSON.stringify(where, null, 2));

    // Consulta SIMPLE primero - solo con las relaciones que existen en Prisma  
    const fichas = await prisma.fichas.findMany({
      where: where,
      include: {
        // Relaciones que SÍ existen en el schema
        ccaa: {
          select: {
            nombre: true
          }
        },
        provincias: {
          select: {
            nombre: true
          }
        },
        ficha_portal: {
          include: {
            portales: {
              select: {
                nombre: true,
                slug: true
              }
            }
          }
        },
        ficha_tematica: {
          include: {
            tematicas: {
              select: {
                nombre: true,
                slug: true
              }
            }
          },
          orderBy: {
            orden: 'asc'
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 1000 // Aumentado para obtener todas las fichas
    });

    console.log(`PDF found ${fichas.length} fichas with relations`);

    // Obtener trabajadores por separado - IGUAL QUE EN EL API PRINCIPAL
    let trabajadoresMap = new Map();
    if (fichas.length > 0) {
      try {
        const trabajadorIds = [...new Set(
          fichas.flatMap(item => [item.trabajador_id, item.trabajador_subida_id].filter(Boolean))
        )];
        
        console.log(`PDF: Found ${trabajadorIds.length} unique trabajador IDs:`, trabajadorIds);
        
        if (trabajadorIds.length > 0) {
          const trabajadores = await prisma.trabajadores.findMany({
            where: { id: { in: trabajadorIds } },
            select: { id: true, nombre: true, slug: true }
          });
          console.log(`PDF: Retrieved ${trabajadores.length} trabajadores`);
          trabajadoresMap = new Map(trabajadores.map(t => [t.id, t]));
        }
      } catch (trabajadorError) {
        console.error('PDF: Error fetching trabajadores:', trabajadorError);
        // Continue without trabajadores data
      }
    }

    // Transform data with the available related information
    return fichas.map(ficha => {
      try {
        return {
          id: typeof ficha.id === 'bigint' ? ficha.id.toString() : ficha.id,
          nombre_ficha: ficha.nombre_ficha || 'Sin titulo',
          ambito_nivel: ficha.ambito_nivel || 'No especificado',
          tramite_tipo: ficha.tramite_tipo || 'No especificado',
          complejidad: ficha.complejidad || 'No especificado',
          created_at: ficha.created_at,
          frase_publicitaria: ficha.frase_publicitaria || '',
          ambito_ccaa_id: ficha.ambito_ccaa_id,
          ambito_provincia_id: ficha.ambito_provincia_id,
          trabajador_id: ficha.trabajador_id,
          trabajador_subida_id: ficha.trabajador_subida_id,
          // Related data properly populated with safety checks
          ccaa_nombre: ficha.ccaa?.nombre || 'Sin especificar',
          provincia_nombre: ficha.provincias?.nombre || 'Sin especificar',
          trabajador_nombre: trabajadoresMap.get(ficha.trabajador_id)?.nombre || 'Sin asignar',
          trabajador_subida_nombre: trabajadoresMap.get(ficha.trabajador_subida_id)?.nombre || 'Sistema',
          portales_nombres: (ficha.ficha_portal || []).map(fp => fp?.portales?.nombre || 'Portal desconocido').join(', ') || 'Sin portales',
          tematicas_nombres: (ficha.ficha_tematica || []).map(ft => ft?.tematicas?.nombre || 'Tematica desconocida').join(', ') || 'Sin tematicas'
        };
      } catch (transformError) {
        console.error('PDF: Error transforming ficha:', typeof ficha.id === 'bigint' ? ficha.id.toString() : ficha.id, transformError);
        return {
          id: typeof ficha.id === 'bigint' ? ficha.id.toString() : ficha.id,
          nombre_ficha: ficha.nombre_ficha || 'Sin titulo',
          ambito_nivel: ficha.ambito_nivel || 'No especificado',
          tramite_tipo: ficha.tramite_tipo || 'No especificado',
          complejidad: ficha.complejidad || 'No especificado',
          created_at: ficha.created_at,
          frase_publicitaria: ficha.frase_publicitaria || '',
          ambito_ccaa_id: ficha.ambito_ccaa_id,
          ambito_provincia_id: ficha.ambito_provincia_id,
          trabajador_id: ficha.trabajador_id,
          trabajador_subida_id: ficha.trabajador_subida_id,
          ccaa_nombre: 'Error al cargar',
          provincia_nombre: 'Error al cargar',
          trabajador_nombre: 'Error al cargar',
          trabajador_subida_nombre: 'Error al cargar',
          portales_nombres: 'Error al cargar',
          tematicas_nombres: 'Error al cargar'
        };
      }
    });
    
  } catch (error) {
    console.error('Error fetching comprehensive fichas for PDF:', error);
    
    // Fallback to simple query if relations fail
    try {
      // Reconstruir whereConditions para el fallback
      const fallbackWhereConditions: Record<string, unknown> = {};
      
      if (filters.q) {
        fallbackWhereConditions.OR = [
          { nombre_ficha: { contains: filters.q } },
          { frase_publicitaria: { contains: filters.q } },
          { texto_divulgacion: { contains: filters.q } }
        ];
      }
      
      if (filters.ambito) fallbackWhereConditions.ambito_nivel = filters.ambito;
      if (filters.tramite_tipo) fallbackWhereConditions.tramite_tipo = filters.tramite_tipo;
      if (filters.complejidad) fallbackWhereConditions.complejidad = filters.complejidad;
      if (filters.ccaa_id) fallbackWhereConditions.ambito_ccaa_id = parseInt(filters.ccaa_id);
      if (filters.provincia_id) fallbackWhereConditions.ambito_provincia_id = parseInt(filters.provincia_id);
      if (filters.trabajador_id) fallbackWhereConditions.trabajador_id = parseInt(filters.trabajador_id);
      if (filters.trabajador_subida_id) fallbackWhereConditions.trabajador_subida_id = parseInt(filters.trabajador_subida_id);

      // Date filters
      if (filters.anio || filters.created_desde || filters.created_hasta) {
        const dateFilter: Record<string, Date> = {};
        
        if (filters.anio) {
          const year = parseInt(filters.anio);
          if (filters.mes) {
            const month = parseInt(filters.mes);
            dateFilter.gte = new Date(year, month - 1, 1);
            dateFilter.lt = new Date(year, month, 1);
          } else {
            dateFilter.gte = new Date(year, 0, 1);
            dateFilter.lt = new Date(year + 1, 0, 1);
          }
        }
        
        if (filters.created_desde) {
          dateFilter.gte = new Date(filters.created_desde + 'T00:00:00Z');
        }
        if (filters.created_hasta) {
          dateFilter.lte = new Date(filters.created_hasta + 'T23:59:59Z');
        }
        
        if (Object.keys(dateFilter).length > 0) {
          fallbackWhereConditions.created_at = dateFilter;
        }
      }

      const fichasSimple = await prisma.fichas.findMany({
        where: fallbackWhereConditions,
        select: {
          id: true,
          nombre_ficha: true,
          ambito_nivel: true,
          tramite_tipo: true,
          complejidad: true,
          created_at: true,
          frase_publicitaria: true,
          ambito_ccaa_id: true,
          ambito_provincia_id: true,
          trabajador_id: true,
          trabajador_subida_id: true
        },
        orderBy: {
          created_at: 'desc'
        },
        take: 1000
      });

      console.log(`PDF fallback query found ${fichasSimple.length} fichas`);
      
      return fichasSimple.map(ficha => {
        try {
          return {
            ...ficha,
            id: typeof ficha.id === 'bigint' ? ficha.id.toString() : ficha.id,
            nombre_ficha: ficha.nombre_ficha || 'Sin titulo',
            ambito_nivel: ficha.ambito_nivel || 'No especificado',
            tramite_tipo: ficha.tramite_tipo || 'No especificado', 
            complejidad: ficha.complejidad || 'No especificado',
            ccaa_nombre: 'Consultar aplicacion',
            provincia_nombre: 'Consultar aplicacion',
            trabajador_nombre: `ID: ${ficha.trabajador_id || 'Sin asignar'}`,
            trabajador_subida_nombre: `ID: ${ficha.trabajador_subida_id || 'Sistema'}`,
            portales_nombres: 'Consultar aplicacion',
            tematicas_nombres: 'Consultar aplicacion'
          };
        } catch (fallbackError) {
          console.error('PDF: Error in fallback transform:', typeof ficha.id === 'bigint' ? ficha.id.toString() : ficha.id, fallbackError);
          return {
            id: typeof ficha.id === 'bigint' ? ficha.id.toString() : (ficha.id || '0'),
            nombre_ficha: 'Error en datos',
            ambito_nivel: 'No disponible',
            tramite_tipo: 'No disponible',
            complejidad: 'No disponible',
            created_at: new Date(),
            frase_publicitaria: '',
            ccaa_nombre: 'Error',
            provincia_nombre: 'Error',
            trabajador_nombre: 'Error',
            trabajador_subida_nombre: 'Error',
            portales_nombres: 'Error',
            tematicas_nombres: 'Error'
          };
        }
      });
    } catch (fallbackError) {
      console.error('PDF fallback query also failed:', fallbackError);
      return [];
    }
  }
}

// Funciones para obtener datos estadísticos directamente
async function getFichasPorMesData(filters: FilterParams) {
  try {
    const anio = filters.anio ? parseInt(filters.anio) : null;
    const mesNum = filters.mes ? parseInt(filters.mes) : null;
    
    let desde: Date, hasta: Date;
    
    if (anio) {
      if (mesNum && mesNum >= 1 && mesNum <= 12) {
        desde = new Date(Date.UTC(anio, mesNum - 1, 1, 0, 0, 0));
        hasta = new Date(Date.UTC(anio, mesNum, 1, 0, 0, 0));
      } else {
        desde = new Date(Date.UTC(anio, 0, 1, 0, 0, 0));
        hasta = new Date(Date.UTC(anio + 1, 0, 1, 0, 0, 0));
      }
    } else {
      // Fallback: último año completo
      const currentYear = new Date().getFullYear();
      desde = new Date(Date.UTC(currentYear - 1, 0, 1, 0, 0, 0));
      hasta = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0));
    }

    const whereConditions: any = {
      created_at: {
        gte: desde,
        lt: hasta
      }
    };

    // Aplicar filtros adicionales
    if (filters.ambito) whereConditions.ambito_nivel = filters.ambito;
    if (filters.tramite_tipo) whereConditions.tramite_tipo = filters.tramite_tipo;
    if (filters.complejidad) whereConditions.complejidad = filters.complejidad;
    if (filters.ccaa_id) whereConditions.ambito_ccaa_id = parseInt(filters.ccaa_id);
    if (filters.provincia_id) whereConditions.ambito_provincia_id = parseInt(filters.provincia_id);
    
    // Obtener datos agrupados por mes
    const fichas = await prisma.fichas.findMany({
      where: whereConditions,
      select: {
        created_at: true
      }
    });

    // Procesar datos por mes
    const monthlyData: { [key: string]: number } = {};
    fichas.forEach(ficha => {
      const month = ficha.created_at.getUTCMonth() + 1; // 1-12
      const key = month.toString();
      monthlyData[key] = (monthlyData[key] || 0) + 1;
    });

    // Convertir a formato esperado
    const items = [];
    for (let mes = 1; mes <= 12; mes++) {
      items.push({
        mes_index: mes,
        total: monthlyData[mes.toString()] || 0
      });
    }

    return { items };
  } catch (error) {
    console.error('Error getting fichas por mes data:', error);
    return null;
  }
}

async function getPortalesPorMesData(filters: FilterParams) {
  try {
    const anio = filters.anio ? parseInt(filters.anio) : null;
    
    let desde: Date, hasta: Date;
    
    if (anio) {
      desde = new Date(Date.UTC(anio, 0, 1, 0, 0, 0));
      hasta = new Date(Date.UTC(anio + 1, 0, 1, 0, 0, 0));
    } else {
      const currentYear = new Date().getFullYear();
      desde = new Date(Date.UTC(currentYear - 1, 0, 1, 0, 0, 0));
      hasta = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0));
    }

    const whereConditions: any = {
      created_at: {
        gte: desde,
        lt: hasta
      }
    };

    // Aplicar filtros adicionales
    if (filters.ambito) whereConditions.ambito_nivel = filters.ambito;
    if (filters.tramite_tipo) whereConditions.tramite_tipo = filters.tramite_tipo;
    if (filters.complejidad) whereConditions.complejidad = filters.complejidad;
    if (filters.ccaa_id) whereConditions.ambito_ccaa_id = parseInt(filters.ccaa_id);
    if (filters.provincia_id) whereConditions.ambito_provincia_id = parseInt(filters.provincia_id);

    // Obtener fichas con portales
    const fichasWithPortals = await prisma.fichas.findMany({
      where: whereConditions,
      select: {
        id: true,
        created_at: true,
        ficha_portal: {
          select: {
            portales: {
              select: {
                id: true,
                nombre: true,
                slug: true
              }
            }
          }
        }
      }
    });

    // Procesar datos por portal
    const portalData: { [key: string]: { total: number; portal_nombre: string } } = {};
    
    fichasWithPortals.forEach(ficha => {
      ficha.ficha_portal.forEach(fp => {
        const portalId = fp.portales.id.toString();
        const portalNombre = fp.portales.nombre;
        
        if (!portalData[portalId]) {
          portalData[portalId] = {
            total: 0,
            portal_nombre: portalNombre
          };
        }
        portalData[portalId].total += 1;
      });
    });

    // Convertir a array
    return Object.values(portalData);
  } catch (error) {
    console.error('Error getting portales por mes data:', error);
    return null;
  }
}

async function getAmbitosPorPortalData(filters: FilterParams) {
  try {
    // Implementación básica
    return [
      { ambito: 'CCAA', portal: 'Portal 1', total: 10 },
      { ambito: 'ESTADO', portal: 'Portal 2', total: 5 }
    ];
  } catch (error) {
    console.error('Error getting ambitos por portal data:', error);
    return null;
  }
}

async function getTramiteOnlineData(filters: FilterParams) {
  try {
    // Implementación básica
    return [
      { tipo: 'Online', total: 15 },
      { tipo: 'Presencial', total: 8 }
    ];
  } catch (error) {
    console.error('Error getting tramite online data:', error);
    return null;
  }
}

async function getFichasForPDF(filters: FilterParams) {
  try {
    // Build where conditions similar to fichas route
    const whereConditions: Record<string, unknown> = {};
    
    if (filters.q) {
      whereConditions.OR = [
        { nombre_ficha: { contains: filters.q } },
        { frase_publicitaria: { contains: filters.q } },
        { texto_divulgacion: { contains: filters.q } }
      ];
    }
    
    if (filters.ambito) whereConditions.ambito_nivel = filters.ambito;
    if (filters.tramite_tipo) whereConditions.tramite_tipo = filters.tramite_tipo;
    if (filters.complejidad) whereConditions.complejidad = filters.complejidad;
    if (filters.ccaa_id) whereConditions.ambito_ccaa_id = parseInt(filters.ccaa_id);
    if (filters.provincia_id) whereConditions.ambito_provincia_id = parseInt(filters.provincia_id);
    if (filters.trabajador_id) whereConditions.trabajador_id = parseInt(filters.trabajador_id);
    if (filters.trabajador_subida_id) whereConditions.trabajador_subida_id = parseInt(filters.trabajador_subida_id);

    // Date filters
    if (filters.anio || filters.created_desde || filters.created_hasta) {
      const dateFilter: Record<string, Date> = {};
      
      if (filters.anio) {
        const year = parseInt(filters.anio);
        if (filters.mes) {
          const month = parseInt(filters.mes);
          dateFilter.gte = new Date(year, month - 1, 1);
          dateFilter.lt = new Date(year, month, 1);
        } else {
          dateFilter.gte = new Date(year, 0, 1);
          dateFilter.lt = new Date(year + 1, 0, 1);
        }
      }
      
      if (filters.created_desde) {
        dateFilter.gte = new Date(filters.created_desde + 'T00:00:00Z');
      }
      if (filters.created_hasta) {
        dateFilter.lte = new Date(filters.created_hasta + 'T23:59:59Z');
      }
      
      if (Object.keys(dateFilter).length > 0) {
        whereConditions.created_at = dateFilter;
      }
    }

    const fichas = await prisma.fichas.findMany({
      where: whereConditions,
      select: {
        id: true,
        nombre_ficha: true,
        ambito_nivel: true,
        tramite_tipo: true,
        complejidad: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 100 // Limit for PDF
    });

    return fichas;
  } catch (error) {
    console.error('Error fetching fichas for PDF:', error);
    return [];
  }
}