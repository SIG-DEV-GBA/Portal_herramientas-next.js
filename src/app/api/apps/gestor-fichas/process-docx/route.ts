import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/utils/api-guard";

export const runtime = "nodejs";

interface ExtractedData {
  nombre_ficha?: string;
  frase_publicitaria?: string;
  vencimiento?: string;
  tramite_tipo?: "online" | "presencial" | "directo";
  ambito_nivel?: "UE" | "ESTADO" | "CCAA" | "PROVINCIA";
  fecha_redaccion?: string;
  trabajador_id?: string;
}

// Patrones para extraer información del texto
const patterns = {
  nombre_ficha: /Nombre de la ayuda:\s*([^\n\r]+?)(?=Portales:|FRASE|Organismo|Beneficiarios|Categoría|Tipo|$)/i,
  frase_publicitaria: /(?:FRASE PARA PUBLICITAR|Texto para su divulgación)[:\s]*([^\n\r]+?)(?=\s+Organismo|\s+Beneficiarios|\s+Objeto|\n|\r|$)/i,
  vencimiento: /Fecha fin:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
  presentacion: /Lugar y forma de presentación[\s\S]*?(?=\n[A-Z][^:]*:|$)/i,
  organismo: /Organismo[:\s]*([^\n\r]+?)(?=\n|\r|$)/i,
  beneficiarios: /Beneficiarios[:\s]*([^\n\r]+?)(?=\n|\r|$)/i,
  objeto: /Objeto[:\s]*([^\n\r]+?)(?=\n|\r|$)/i,
  fecha_redaccion: /otros datos[:\s]*.*?fecha[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i
};

// Función para detectar ámbito territorial
function detectAmbitoTerritorial(text: string): "UE" | "ESTADO" | "CCAA" | "PROVINCIA" | undefined {
  // Normalizar texto para búsqueda
  const textLower = text.toLowerCase();
  
  // Lista de provincias españolas para detección precisa
  const provinciasEspanolas = [
    'álava', 'alava', 'albacete', 'alicante', 'almería', 'almeria', 'asturias', 'ávila', 'avila',
    'badajoz', 'barcelona', 'burgos', 'cáceres', 'caceres', 'cádiz', 'cadiz', 'cantabria',
    'castellón', 'castellon', 'ciudad real', 'córdoba', 'cordoba', 'cuenca', 'girona',
    'granada', 'guadalajara', 'guipúzcoa', 'guipuzcoa', 'huelva', 'huesca', 'jaén', 'jaen',
    'león', 'leon', 'lérida', 'lerida', 'lleida', 'lugo', 'madrid', 'málaga', 'malaga',
    'murcia', 'navarra', 'ourense', 'orense', 'palencia', 'palma', 'baleares', 'pontevedra',
    'rioja', 'salamanca', 'segovia', 'sevilla', 'soria', 'tarragona', 'teruel', 'toledo',
    'valencia', 'valladolid', 'vizcaya', 'bizkaia', 'zamora', 'zaragoza', 'ceuta', 'melilla',
    'las palmas', 'santa cruz de tenerife', 'tenerife'
  ];
  
  // Patrones para detectar ámbito UE
  const uePatterns = [
    /unión europea/i,
    /union europea/i,
    /ue\s/i,
    /europa\s/i,
    /european/i,
    /comisión europea/i,
    /comision europea/i,
    /fondos europeos/i,
    /programa europeo/i,
    /directiva europea/i,
    /reglamento\s.*\(ue\)/i
  ];
  
  // Patrones para detectar ámbito ESTADO
  const estadoPatterns = [
    /ministerio/i,
    /gobierno de españa/i,
    /administración general del estado/i,
    /age\s/i,
    /estatal/i,
    /nacional/i,
    /real decreto/i,
    /ley\s+\d+\/\d+/i,
    /boletín oficial del estado/i,
    /boe\s/i,
    /presupuestos generales del estado/i,
    /secretaría de estado/i,
    /subsecretaría/i
  ];
  
  // Patrones para detectar ámbito CCAA (excluyendo menciones de provincias)
  const ccaaPatterns = [
    /junta de andalucía/i,
    /junta de andalucia/i,
    /generalitat de catalunya/i,
    /generalitat valenciana/i,
    /gobierno vasco/i,
    /gobierno de navarra/i,
    /principado de asturias/i,
    /región de murcia/i,
    /region de murcia/i,
    /consejería/i,
    /conselleria/i,
    /departamento.*gobierno vasco/i,
    /decreto.*\d+\/\d+.*comunidad/i,
    /autonómica/i,
    /autonomica/i,
    /xunta de galicia/i,
    /gobierno de aragón/i,
    /gobierno de aragon/i,
    /gobierno de canarias/i,
    /gobierno de cantabria/i,
    /junta de castilla/i,
    /junta de extremadura/i,
    /gobierno de la rioja/i,
    /comunidad de madrid/i
  ];
  
  // Patrones para detectar ámbito PROVINCIA
  const provinciaPatterns = [
    /diputación/i,
    /diputacio/i,
    /provincia/i,
    /provincial/i,
    /consell comarcal/i,
    /comarca/i,
    /cabildo/i,
    /consejo insular/i,
    /ajuntament|ayuntamiento/i,
    /municipi/i,
    /municipal/i,
    /alcaldía/i,
    /alcaldia/i,
    /concejo/i
  ];
  
  // Contar coincidencias para cada ámbito
  let ueScore = 0;
  let estadoScore = 0;
  let ccaaScore = 0;
  let provinciaScore = 0;
  
  // Verificar patrones UE
  uePatterns.forEach(pattern => {
    if (pattern.test(textLower)) ueScore++;
  });
  
  // Verificar patrones ESTADO
  estadoPatterns.forEach(pattern => {
    if (pattern.test(textLower)) estadoScore++;
  });
  
  // Verificar patrones CCAA
  ccaaPatterns.forEach(pattern => {
    if (pattern.test(textLower)) ccaaScore++;
  });
  
  // Verificar patrones PROVINCIA
  provinciaPatterns.forEach(pattern => {
    if (pattern.test(textLower)) provinciaScore++;
  });

  // Detección específica de provincias por nombre
  provinciasEspanolas.forEach(provincia => {
    const provinciaRegex = new RegExp(`\\b${provincia}\\b`, 'i');
    if (provinciaRegex.test(textLower)) {
      provinciaScore += 2;
    }
  });

  // Detecciones específicas que aumentan la puntuación provincial
  // Detectar nombres de provincias entre paréntesis
  const parenthesisMatch = text.match(/\(([^)]+)\)/i);
  if (parenthesisMatch) {
    const contenidoParentesis = parenthesisMatch[1].toLowerCase().trim();
    if (provinciasEspanolas.some(prov => contenidoParentesis.includes(prov))) {
      provinciaScore += 3;
    }
  }

  // Casos especiales: si aparece "comunidad autonoma" junto con nombre de provincia
  // dar prioridad a provincia si el nombre de provincia está presente
  if (/comunidad auton[oó]ma/i.test(text)) {
    const tieneNombreProvincia = provinciasEspanolas.some(prov => 
      new RegExp(`\\b${prov}\\b`, 'i').test(textLower)
    );
    if (tieneNombreProvincia) {
      provinciaScore += 2; // Aumentar score provincial
      ccaaScore = Math.max(0, ccaaScore - 1); // Reducir score CCAA
    } else {
      ccaaScore++;
    }
  }
  
  // Determinar el ámbito con mayor puntuación
  const maxScore = Math.max(ueScore, estadoScore, ccaaScore, provinciaScore);
  
  if (maxScore === 0) return undefined;
  
  if (provinciaScore === maxScore) return "PROVINCIA";
  if (ccaaScore === maxScore) return "CCAA";
  if (estadoScore === maxScore) return "ESTADO";
  if (ueScore === maxScore) return "UE";
  
  return undefined;
}

function extractDataFromText(text: string): ExtractedData {
  const result: ExtractedData = {};

  // Extraer nombre (mejorado para evitar texto adicional)
  const nombreMatch = text.match(patterns.nombre_ficha);
  if (nombreMatch) {
    result.nombre_ficha = nombreMatch[1].trim();
  }

  // Extraer frase publicitaria (mejorado)
  const fraseMatch = text.match(patterns.frase_publicitaria);
  if (fraseMatch) {
    result.frase_publicitaria = fraseMatch[1].trim();
  }

  // Extraer vencimiento y convertir formato
  const vencimientoMatch = text.match(patterns.vencimiento);
  if (vencimientoMatch) {
    const [, fecha] = vencimientoMatch;
    // Convertir DD/MM/YYYY a YYYY-MM-DD para input date
    const [day, month, year] = fecha.split('/');
    result.vencimiento = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Detectar ámbito territorial
  const ambito = detectAmbitoTerritorial(text);
  if (ambito) {
    result.ambito_nivel = ambito;
  }

  // Detectar tipo de trámite basado en formas de presentación
  const presentacionMatch = text.match(patterns.presentacion);
  if (presentacionMatch) {
    const seccionPresentacion = presentacionMatch[0];
    
    const tienePresencial = /Presencialmente en:/i.test(seccionPresentacion);
    const tieneElectronico = /Electrónicamente en:/i.test(seccionPresentacion);
    const soloSara = /Red SARA/i.test(seccionPresentacion) && !(/sede electrónica|web.*\..*|https?:\/\//i.test(seccionPresentacion));
    const tieneWeb = /sede electrónica|https?:\/\/|\.cat|\.es|\.com/i.test(seccionPresentacion);
    
    // Determinar tipo de trámite con prioridad específica
    if (tieneElectronico && tieneWeb && !soloSara) {
      result.tramite_tipo = "online";
    } else if (tienePresencial && tieneElectronico) {
      result.tramite_tipo = "directo"; // Ambas formas disponibles
    } else if (tienePresencial && !tieneElectronico) {
      result.tramite_tipo = "presencial";  
    } else if (tieneElectronico || soloSara) {
      result.tramite_tipo = "online"; // Solo electrónico o SARA
    } else {
      result.tramite_tipo = "directo"; // Por defecto
    }
  }

  // Extraer fecha de redacción y redactor de la sección "Otros datos"
  const otrosDatosMatch = text.match(/otros datos[:\s]*.*?$/im);
  if (otrosDatosMatch) {
    const seccionOtrosDatos = otrosDatosMatch[0];
    
    // Buscar la última fecha en la sección de otros datos
    const fechasEnOtrosDatos = seccionOtrosDatos.match(/(\d{1,2}\/\d{1,2}\/\d{4})/g);
    if (fechasEnOtrosDatos && fechasEnOtrosDatos.length > 0) {
      // Tomar la última fecha encontrada en "Otros datos"
      const ultimaFecha = fechasEnOtrosDatos[fechasEnOtrosDatos.length - 1];
      const [day, month, year] = ultimaFecha.split('/');
      result.fecha_redaccion = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Buscar el campo "Usuario" en la sección de otros datos
    const usuarioMatch = seccionOtrosDatos.match(/usuario[:\s]*([^\n\r]+?)(?=\s+|$)/i);
    if (usuarioMatch) {
      result.trabajador_id = usuarioMatch[1].trim();
    }
  }

  return result;
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    // Importar las librerías dinámicamente para evitar problemas de SSR
    const JSZip = (await import('jszip')).default;
    
    const zip = await JSZip.loadAsync(buffer);
    const documentXml = await zip.file('word/document.xml')?.async('string');
    
    if (!documentXml) {
      throw new Error('No se pudo encontrar el contenido del documento');
    }

    // Extraer texto de XML eliminando tags y entidades
    const text = documentXml
      .replace(/<[^>]*>/g, '') // Eliminar tags XML
      .replace(/&[^;]*;/g, '') // Eliminar entidades HTML
      .replace(/\s+/g, ' ') // Normalizar espacios
      .replace(/^\s+|\s+$/g, ''); // Trim

    return text;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error('Error procesando el archivo DOCX');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error } = await requirePermission(req, "fichas", "create");
    if (error) return error;

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.docx')) {
      return NextResponse.json({ error: "El archivo debe ser un DOCX" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB límite
      return NextResponse.json({ error: "El archivo es demasiado grande (máximo 10MB)" }, { status: 400 });
    }

    // Leer archivo como buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extraer texto del DOCX
    const text = await extractTextFromDocx(buffer);

    if (!text || text.length < 50) {
      return NextResponse.json({ error: "El documento parece estar vacío o dañado" }, { status: 400 });
    }

    // Extraer datos estructurados
    const extractedData = extractDataFromText(text);
    
    // Si se extrajo un redactor como texto, intentar convertirlo a ID
    if (extractedData.trabajador_id && typeof extractedData.trabajador_id === 'string') {
      try {
        // Buscar trabajador por nombre (búsqueda parcial)
        const { prisma } = await import("@/lib/database/db");
        const trabajador = await prisma.trabajadores.findFirst({
          where: { 
            nombre: { 
              contains: extractedData.trabajador_id.trim()
            } 
          },
          select: { id: true }
        });
        
        if (trabajador) {
          extractedData.trabajador_id = trabajador.id.toString();
        } else {
          // Si no se encuentra el trabajador, eliminar el campo para evitar errores
          delete extractedData.trabajador_id;
        }
      } catch (error) {
        console.warn('Error buscando trabajador por nombre:', error);
        delete extractedData.trabajador_id;
      }
    }

    // Log para debug (quitar en producción)
    console.log('Texto extraído (primeros 500 chars):', text.substring(0, 500));
    console.log('Datos extraídos:', extractedData);

    return NextResponse.json(extractedData);

  } catch (error: unknown) {
    console.error("Error processing DOCX:", error);
    return NextResponse.json(
      { 
        error: "Error procesando el archivo", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}