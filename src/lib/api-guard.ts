import { NextRequest, NextResponse } from "next/server";
import { verifyOpaqueTokenViaMe, getUserWithRole } from "./auth-opaque";
import { can, Role } from "./permissions";

export async function requireAuth(req: NextRequest) {
  const token = req.cookies.get(process.env.AUTH_COOKIE ?? "sid")?.value;
  const session = await verifyOpaqueTokenViaMe(token);
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { session };
}

export async function requirePermission(
  req: NextRequest,
  resource: "fichas" | "lookups" | "portales" | "tematicas" | "trabajadores" | "users",
  action: "read" | "create" | "update" | "delete"
) {
  const { session, error } = await requireAuth(req);
  if (error) return { error };
  
  // Obtener el rol del usuario y crear automáticamente si no existe
  const sessionWithRole = await getUserWithRole(session.email);
  
  if (!can(sessionWithRole.role, resource, action)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session: sessionWithRole };
}
