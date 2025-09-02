import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pyFetch } from "@/lib/api/http";
import { getUserWithRole } from "@/lib/auth/auth-opaque";

export async function GET() {
  // Construimos el header Cookie con TODAS las cookies actuales
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ");

  const res = await pyFetch("/auth/me", {
    headers: { Cookie: cookieHeader },
  });

  const data = await res.json().catch(() => ({}));
  
  // Si la autenticación es exitosa y tenemos email, obtener el rol
  if (data?.ok && data?.email) {
    try {
      const userWithRole = await getUserWithRole(data.email);
      return NextResponse.json({ 
        ...data, 
        email: userWithRole.email,
        role: userWithRole.role 
      }, { status: res.status });
    } catch (error) {
      console.error("Error getting user role:", error);
      // Si hay error obteniendo el rol, devolver solo la info básica
      return NextResponse.json(data, { status: res.status });
    }
  }

  return NextResponse.json(data, { status: res.status });
}
