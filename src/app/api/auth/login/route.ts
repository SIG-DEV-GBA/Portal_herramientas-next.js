import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const PY = process.env.PY_BACKEND_URL!;
const AUTH_COOKIE = process.env.AUTH_COOKIE ?? "sid";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const next = req.nextUrl.searchParams.get("next");

  const pyRes = await fetch(`${PY}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  // --- Manejo de error NORMALIZADO ---
  if (!pyRes.ok) {
    // intenta JSON primero
    let payload: any = null;
    let text: string | null = null;
    const ct = pyRes.headers.get("content-type") ?? "";

    if (ct.includes("application/json")) {
      payload = await pyRes.json().catch(() => null);
    } else {
      text = await pyRes.text().catch(() => null);
    }

    // saca el mejor mensaje posible
const msg =
  (payload?.error ??
   payload?.detail ??
   payload?.message ??
   (Array.isArray(payload?.errors) && payload.errors[0]?.message) ??
   (Array.isArray(payload?.detail) && payload.detail[0])) ||
  (text && text.trim()) ||
  "Credenciales inválidas";

    return NextResponse.json(
      { ok: false, error: msg },
      { status: pyRes.status }
    );
  }

  // --- Éxito: copiar cookie ---
  const setCookie = pyRes.headers.get("set-cookie") ?? "";
  const match = setCookie.match(new RegExp(`${AUTH_COOKIE}=([^;]+)`));
  const token = match?.[1];
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "No sid cookie from backend" },
      { status: 502 }
    );
  }

  const jar = await cookies();
  jar.set({
    name: AUTH_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  if (next) {
    return NextResponse.redirect(new URL(next, req.url));
  }
  return NextResponse.json({ ok: true });
}
