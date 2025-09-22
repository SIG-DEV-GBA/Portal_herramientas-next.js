import { NextRequest, NextResponse } from "next/server";
import { verifyOpaqueTokenViaMe, getUserWithRole } from "../auth/auth-opaque";
import { can, Role } from "./permissions";

export async function requireAuth(req: NextRequest) {
  const token = req.cookies.get(process.env.AUTH_COOKIE ?? "sid")?.value;
  const session = await verifyOpaqueTokenViaMe(token);
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { session };
}

export async function requirePermission(
  req: NextRequest,
  resource: "fichas" | "lookups" | "portales" | "tematicas" | "trabajadores" | "users" | "admin",
  action: "read" | "create" | "update" | "delete" | "write"
) {
  console.log(`🔐 requirePermission: ${resource}.${action}`);
  
  const { session, error } = await requireAuth(req);
  if (error) {
    console.log("❌ Auth failed:", error);
    return { error };
  }
  
  console.log("✅ Session:", session.email);
  
  // Obtener el rol del usuario y crear automáticamente si no existe
  const sessionWithRole = await getUserWithRole(session.email);
  console.log("👤 User with role:", sessionWithRole);
  
  if (!can(sessionWithRole.role, resource, action)) {
    console.log(`❌ Permission denied: ${sessionWithRole.role} cannot ${action} ${resource}`);
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  
  console.log(`✅ Permission granted: ${sessionWithRole.role} can ${action} ${resource}`);
  return { session: sessionWithRole, user: sessionWithRole };
}
