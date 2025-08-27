import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pyFetch } from "@/lib/http";

export async function GET() {
  // Construimos el header Cookie con TODAS las cookies actuales
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ");

  const res = await pyFetch("/auth/me", {
    headers: { Cookie: cookieHeader },
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
