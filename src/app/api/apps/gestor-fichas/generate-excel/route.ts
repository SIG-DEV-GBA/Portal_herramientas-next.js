import { NextRequest, NextResponse } from "next/server";
import ExcelJS from 'exceljs';
import { prisma } from "@/lib/database/db";
import { fmtDate } from "@/apps/gestor-fichas/lib/utils";

export async function GET(request: NextRequest) {
  try {
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

    // Extract selected columns (default to all if not provided)
    const columnsParam = searchParams.get("columns");
    const selectedColumns = columnsParam ? JSON.parse(columnsParam) : [
      'id_ficha', 'nombre', 'ambito', 'ccaa', 'provincia', 'tramite', 'complejidad', 
      'portales', 'trabajador', 'subido_por', 'fecha_creacion', 'fecha_redaccion', 
      'fecha_publicacion', 'vencimiento', 'destaque_principal', 'destaque_secundario', 'enlace'
    ];

    console.log("=== EXCEL GENERATION STARTED ===");
    console.log("Filters received:", filters);
    console.log("Selected columns:", selectedColumns);

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
    }

    // Build Prisma where clause
    const whereClause: any = {};
    
    if (dateStart && dateEnd) {
      whereClause.created_at = {
        gte: dateStart,
        lte: dateEnd,
      };
    }

    if (filters.q) {
      whereClause.OR = [
        { nombre_ficha: { contains: filters.q, mode: 'insensitive' } },
        { frase_publicitaria: { contains: filters.q, mode: 'insensitive' } },
        { texto_divulgacion: { contains: filters.q, mode: 'insensitive' } }
      ];
    }

    if (filters.ambito) {
      whereClause.ambito_nivel = filters.ambito;
    }

    if (filters.ccaa_id) {
      whereClause.ambito_ccaa_id = parseInt(filters.ccaa_id);
    }

    if (filters.provincia_id) {
      whereClause.ambito_provincia_id = parseInt(filters.provincia_id);
    }

    if (filters.provincia_principal) {
      whereClause.provincia_principal = filters.provincia_principal;
    }

    if (filters.tramite_tipo) {
      whereClause.tramite_tipo = filters.tramite_tipo;
    }

    if (filters.complejidad) {
      whereClause.complejidad = filters.complejidad;
    }

    if (filters.trabajador_id) {
      whereClause.trabajador_id = parseInt(filters.trabajador_id);
    }

    if (filters.trabajador_subida_id) {
      whereClause.trabajador_subida_id = parseInt(filters.trabajador_subida_id);
    }

    if (filters.tematica_id) {
      whereClause.ficha_tematica = {
        some: {
          tematica_id: parseInt(filters.tematica_id)
        }
      };
    }

    if (filters.destaque_principal) {
      whereClause.destaque_principal = filters.destaque_principal === 'true';
    }

    if (filters.destaque_secundario) {
      whereClause.destaque_secundario = filters.destaque_secundario === 'true';
    }

    // Fetch data with relationships (simplified - no portales yet)
    const fichas = await prisma.fichas.findMany({
      where: whereClause,
      include: {
        ccaa: { select: { nombre: true } },
        provincias: { select: { nombre: true } },
        ficha_portal: { select: { portal_id: true } }
      },
      orderBy: [
        { created_at: 'desc' },
        { id: 'desc' }
      ]
    });

    // Get trabajadores separately (same pattern as PDF)
    const trabajadorIds = [...new Set(fichas.flatMap(f => [f.trabajador_id, f.trabajador_subida_id].filter(Boolean)))];
    const trabajadores = trabajadorIds.length > 0 ? await prisma.trabajadores.findMany({
      where: { id: { in: trabajadorIds } },
      select: { id: true, nombre: true }
    }) : [];
    
    const trabajadoresMap = new Map(trabajadores.map(t => [t.id, t.nombre]));

    // Get portales separately 
    const portalIds = [...new Set(fichas.flatMap(f => f.ficha_portal.map(fp => fp.portal_id)))];
    const portales = portalIds.length > 0 ? await prisma.portales.findMany({
      where: { id: { in: portalIds } },
      select: { id: true, nombre: true }
    }) : [];
    
    const portalesMap = new Map(portales.map(p => [p.id, p.nombre]));

    console.log(`Found ${fichas.length} fichas for Excel export`);

    // Create professional Excel workbook with ExcelJS
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Portal Solidaridad Intergeneracional';
    workbook.lastModifiedBy = 'Sistema Automatizado';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Create worksheet
    const worksheet = workbook.addWorksheet('Justificante de Ayudas', {
      properties: {
        tabColor: { argb: 'FFD17C22' }, // Corporate orange
        defaultRowHeight: 25,
      },
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        margins: {
          left: 0.7, right: 0.7,
          top: 0.75, bottom: 0.75,
          header: 0.3, footer: 0.3
        }
      }
    });

    // Define all possible columns
    const allColumns = [
      { header: 'ID Ficha', key: 'id_ficha', width: 12 },
      { header: 'Nombre de la Ayuda', key: 'nombre', width: 45 },
      { header: 'Ámbito', key: 'ambito', width: 12 },
      { header: 'Comunidad Autónoma', key: 'ccaa', width: 20 },
      { header: 'Provincia', key: 'provincia', width: 18 },
      { header: 'Trámite Online', key: 'tramite', width: 12 },
      { header: 'Complejidad', key: 'complejidad', width: 12 },
      { header: 'Portales', key: 'portales', width: 40 },
      { header: 'Redactor', key: 'trabajador', width: 20 },
      { header: 'Subido por', key: 'subido_por', width: 20 },
      { header: 'Fecha Creación', key: 'fecha_creacion', width: 14 },
      { header: 'Fecha Redacción', key: 'fecha_redaccion', width: 14 },
      { header: 'Fecha Publicación', key: 'fecha_publicacion', width: 14 },
      { header: 'Vencimiento', key: 'vencimiento', width: 14 },
      { header: 'Destaque Principal', key: 'destaque_principal', width: 16 },
      { header: 'Destaque Secundario', key: 'destaque_secundario', width: 16 },
      { header: 'Enlace Web', key: 'enlace', width: 45 }
    ];

    // Filter columns based on selection
    const filteredColumns = allColumns.filter(col => selectedColumns.includes(col.key));
    
    // Define columns with professional styling
    worksheet.columns = filteredColumns;

    // Professional header styling
    const headerRow = worksheet.getRow(1);
    headerRow.height = 35;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF8E8D29' } // Corporate green
      };
      cell.font = {
        name: 'Segoe UI',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' }
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF666666' } },
        left: { style: 'thin', color: { argb: 'FF666666' } },
        bottom: { style: 'thin', color: { argb: 'FF666666' } },
        right: { style: 'thin', color: { argb: 'FF666666' } }
      };
    });

    // Add data rows with professional formatting
    fichas.forEach((ficha, index) => {
      const portales = ficha.ficha_portal.map(fp => portalesMap.get(fp.portal_id)).filter(Boolean).join(', ') || 'Sin portal';
      const enlaceUrl = `https://solidaridadintergeneracional.es/ayuda/${ficha.id_ficha_subida}`;
      
      // Build complete row data
      const allRowData = {
        id_ficha: ficha.id_ficha_subida,
        nombre: ficha.nombre_ficha,
        ambito: ficha.ambito_nivel || '',
        ccaa: ficha.ccaa?.nombre || '',
        provincia: ficha.provincias?.nombre || '',
        tramite: ficha.tramite_tipo === 'si' ? 'Sí' : ficha.tramite_tipo === 'no' ? 'No' : ficha.tramite_tipo || '',
        complejidad: ficha.complejidad || '',
        portales: portales,
        trabajador: trabajadoresMap.get(ficha.trabajador_id) || '',
        subido_por: trabajadoresMap.get(ficha.trabajador_subida_id) || '',
        fecha_creacion: ficha.created_at ? fmtDate(ficha.created_at.toISOString(), true) : '',
        fecha_redaccion: ficha.fecha_redaccion ? fmtDate(ficha.fecha_redaccion.toISOString(), true) : '',
        fecha_publicacion: ficha.fecha_subida_web ? fmtDate(ficha.fecha_subida_web.toISOString(), true) : '',
        vencimiento: ficha.vencimiento ? fmtDate(ficha.vencimiento.toISOString(), true) : '',
        destaque_principal: ficha.destaque_principal || '',
        destaque_secundario: ficha.destaque_secundario || '',
        enlace: enlaceUrl
      };

      // Filter row data to only include selected columns
      const rowData: Record<string, any> = {};
      selectedColumns.forEach(column => {
        if (allRowData.hasOwnProperty(column)) {
          rowData[column] = allRowData[column];
        }
      });

      const row = worksheet.addRow(rowData);
      
      // Professional row styling
      const isEvenRow = index % 2 === 0;
      
      // Adjust row height based on content - especially for portales column
      const portalesCount = ficha.ficha_portal.length;
      const baseHeight = 22;
      const extraHeight = portalesCount > 1 ? Math.min(portalesCount * 8, 40) : 0;
      row.height = baseHeight + extraHeight;
      
      row.eachCell((cell, colNumber) => {
        // Get column key from filtered columns
        const columnKey = filteredColumns[colNumber - 1]?.key;
        
        // Alternating row colors
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEvenRow ? 'FFF8F9FA' : 'FFFFFFFF' }
        };
        
        cell.font = {
          name: 'Segoe UI',
          size: 10,
          color: { argb: 'FF2D3748' }
        };
        
        // Dynamic alignment and wrapping based on column type
        const isNameColumn = columnKey === 'nombre';
        const isPortalesColumn = columnKey === 'portales';
        const isLinkColumn = columnKey === 'enlace';
        const needsWrapping = isNameColumn || isPortalesColumn || isLinkColumn;
        
        cell.alignment = {
          vertical: 'middle',
          horizontal: isNameColumn ? 'left' : 'center',
          wrapText: needsWrapping
        };
        
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };

        // Special formatting for specific columns (using column key instead of number)
        if (columnKey === 'tramite') {
          if (cell.value === 'Sí') {
            cell.font.color = { argb: 'FF059669' }; // Green
            cell.font.bold = true;
          } else if (cell.value === 'No') {
            cell.font.color = { argb: 'FFDC2626' }; // Red
          }
        }
        
        if (columnKey === 'complejidad') {
          switch (cell.value) {
            case 'baja':
              cell.font.color = { argb: 'FF059669' }; // Green
              break;
            case 'media':
              cell.font.color = { argb: 'FFD97706' }; // Orange
              break;
            case 'alta':
              cell.font.color = { argb: 'FFDC2626' }; // Red
              break;
          }
        }

        // Make the last column (enlaces) clickable
        if (colNumber === 17 && cell.value) {
          cell.value = {
            text: 'Ver Ayuda Online',
            hyperlink: cell.value as string
          };
          cell.font.color = { argb: 'FF2563EB' }; // Blue
          cell.font.underline = true;
        }
      });
    });

    // Add professional title and metadata
    worksheet.insertRow(1, ['']);
    worksheet.insertRow(1, ['']);
    worksheet.insertRow(1, [
      'JUSTIFICANTE OFICIAL DE AYUDAS PUBLICADAS',
      '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
      `Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`
    ]);

    // Style the title
    const titleRow = worksheet.getRow(1);
    titleRow.height = 40;
    const titleCell = worksheet.getCell('A1');
    titleCell.font = {
      name: 'Segoe UI',
      size: 16,
      bold: true,
      color: { argb: 'FF8E8D29' }
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
    
    // Merge title cells
    worksheet.mergeCells('A1:P1');
    
    // Style date cell
    const dateCell = worksheet.getCell('Q1');
    dateCell.font = {
      name: 'Segoe UI',
      size: 9,
      italic: true,
      color: { argb: 'FF64748B' }
    };
    dateCell.alignment = { vertical: 'middle', horizontal: 'right' };

    // Add summary row
    const summaryRow = worksheet.getRow(2);
    summaryRow.height = 25;
    const summaryCell = worksheet.getCell('A2');
    summaryCell.value = `Portal Solidaridad Intergeneracional • Total de ayudas: ${fichas.length}`;
    summaryCell.font = {
      name: 'Segoe UI',
      size: 11,
      color: { argb: 'FF64748B' }
    };
    summaryCell.alignment = { vertical: 'middle', horizontal: 'left' };
    worksheet.mergeCells('A2:Q2');

    // Generate Excel buffer
    const excelBuffer = await workbook.xlsx.writeBuffer();

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `justificante-ayudas-${currentDate}.xlsx`;

    console.log(`Professional Excel generated successfully: ${filename}`);

    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error("Error generating Excel:", error);
    return NextResponse.json(
      { error: "Error generando Excel", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}