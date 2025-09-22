import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/utils/api-guard";
import puppeteer from 'puppeteer';

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  let browser;
  
  try {
    // Use simpler auth check to avoid permission matrix issues
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { searchParams } = new URL(request.url);
    
    console.log("=== PDF V2 GENERATION STARTED (Puppeteer + HTML) ===");
    
    // Use public preview endpoint (no auth required)
    const previewUrl = new URL(`${request.nextUrl.origin}/api/apps/gestor-fichas/pdf-preview-public`);
    
    // Forward all search parameters
    for (const [key, value] of searchParams.entries()) {
      previewUrl.searchParams.set(key, value);
    }
    
    console.log("Preview URL:", previewUrl.toString());

    // Launch Puppeteer browser
    console.log("Launching Puppeteer browser...");
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--no-first-run',
        '--no-default-browser-check'
      ]
    });

    const page = await browser.newPage();
    
    // Set viewport for consistent rendering
    await page.setViewport({ width: 1200, height: 800 });
    
    // Set user agent to identify Puppeteer
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36 Puppeteer');
    
    // Navigate to preview endpoint
    console.log("Navigating to preview page...");
    await page.goto(previewUrl.toString(), { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    // Wait for charts to render
    console.log("Waiting for charts to render...");
    
    // Use a simpler approach - just wait a bit for the page to settle
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Wait for React charts to be rendered (if any exist)
    try {
      await page.waitForFunction(() => {
        const chartContainers = document.querySelectorAll('[id^="chart-"]');
        if (chartContainers.length === 0) return true; // No charts to wait for
        
        // Check if all chart containers have SVG content
        for (const container of chartContainers) {
          const svg = container.querySelector('svg');
          if (!svg) return false;
        }
        return true;
      }, { timeout: 10000 });
    } catch (chartError) {
      console.warn("Chart rendering timeout, proceeding anyway:", chartError);
    }

    // Get configuration for PDF options
    const configParam = searchParams.get("config");
    const config = configParam ? JSON.parse(configParam) : {
      orientation: "landscape"
    };

    // Generate PDF
    console.log("Generating PDF with Puppeteer...");
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: config.orientation === 'landscape',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      preferCSSPageSize: false,
      displayHeaderFooter: false
    });

    // Generate filename
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Determine document type for filename
    const isInsights = config.includeCharts && !config.includeTable;
    const isJustificante = config.includeTable && !config.includeCharts;
    
    const baseFilename = isInsights ? 'informe-insights' : 
                        isJustificante ? 'justificante-ayudas' : 
                        'informe-completo';
    
    const filename = `${baseFilename}-${currentDate}.pdf`;

    console.log(`PDF generated successfully with Puppeteer: ${filename}`);
    console.log(`PDF size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    // Return PDF - Convert Uint8Array to Buffer for NextResponse
    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error("Error generating PDF with Puppeteer:", error);
    return NextResponse.json(
      { 
        error: "Error generando PDF", 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  } finally {
    // Always close browser
    if (browser) {
      try {
        await browser.close();
        console.log("Puppeteer browser closed successfully");
      } catch (closeError) {
        console.error("Error closing Puppeteer browser:", closeError);
      }
    }
  }
}