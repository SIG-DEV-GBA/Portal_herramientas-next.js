import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = `${req.nextUrl.origin}/api/apps/gestor-fichas/stats/fichas-por-mes?destaque_principal=nueva`;
    console.log('Testing URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'x-user-email': 'test@example.com' // Simular autenticación
      }
    });
    
    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response text:', text);
    
    try {
      const json = JSON.parse(text);
      return NextResponse.json({
        status: response.status,
        data: json,
        url: url
      });
    } catch (e) {
      return NextResponse.json({
        status: response.status,
        raw_text: text,
        url: url,
        parse_error: e.message
      });
    }
    
  } catch (error) {
    console.error("Test error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}