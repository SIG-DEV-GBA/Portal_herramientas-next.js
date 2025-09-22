import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifyOpaqueTokenViaMe } from "@/lib/auth/auth-opaque";

const AUTH_COOKIE = process.env.AUTH_COOKIE ?? "sid";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  
  // 0) Verificar dominio permitido
  const allowedDomains = [
    'solidaridadintergeneracional.es',
    'fundacionpadrinosdelavejez.es',
    'localhost' // Para desarrollo
  ];
  
  const hostname = req.headers.get('host') || '';
  const isAllowedDomain = allowedDomains.some(domain => 
    hostname === domain || 
    hostname.endsWith(`.${domain}`) ||
    hostname.startsWith('localhost:') // Para puertos de desarrollo
  );
  
  if (!isAllowedDomain) {
    return new NextResponse(
      '<h1>Dominio no autorizado</h1><p>Este portal no está disponible desde este dominio.</p>',
      { 
        status: 403, 
        headers: { 'Content-Type': 'text/html; charset=utf-8' } 
      }
    );
  }

  // 1) Rutas públicas (no requieren sesión)
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||   // login/logout/callback del portal
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/api/apps/gestor-fichas/pdf-preview-public") ||     // PDF preview público
    pathname.startsWith("/api/debug")     // Debug endpoints (temporal)
  ) {
    return NextResponse.next();
  }

  // para poner estas APIs  públicas, descomenta:
  // if (
  //   pathname.startsWith("/api/health/db") ||
  //   pathname.startsWith("/api/lookups")
  // ) {
  //   return NextResponse.next();
  // }
  // 2) Resto: requiere sesión -> valida cookie 'sid' contra tu backend Python
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const session = await verifyOpaqueTokenViaMe(token);
  if (!session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  // (Opcional) Propagar datos mínimos en cabeceras para handlers
  const res = NextResponse.next();
  res.headers.set("x-user-email", session.email);
  return res;
}

// Protege todo lo que no sea archivo físico (p.ej. .png, .css, etc.)
export const config = { matcher: ["/((?!.*\\..*).*)"] };
