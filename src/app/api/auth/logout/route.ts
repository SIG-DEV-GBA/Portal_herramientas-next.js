import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const PY = process.env.PY_BACKEND_URL!;
const AUTH_COOKIE = process.env.AUTH_COOKIE ?? "sid";

export const runtime = "nodejs";

/**
 * Hace logout best-effort en el backend (si hay token) y borra la cookie local.
 * Redirige a /login al terminar.
 */
export async function POST(req: NextRequest) {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;

  // Intenta cerrar sesión también en el backend (no es crítico si falla)
  if (token) {
    try {
      await fetch(`${PY}/auth/logout`, {
        method: "POST",
        headers: { Cookie: `${AUTH_COOKIE}=${token}; Path=/` },
      });
    } catch {}
  }

  // Borra cookie en el dominio del portal
  jar.delete(AUTH_COOKIE);

  // Redirige al login (puedes preservar ?next si quieres)
  const url = new URL("/login", req.url);
  return NextResponse.redirect(url);
}
