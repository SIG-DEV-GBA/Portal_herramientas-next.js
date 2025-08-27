import { NextRequest, NextResponse } from "next/server";
import { verifyOpaqueTokenViaMe } from "./auth-opaque";
import { can, Role } from "./permissions";

export async function requireAuth(req: NextRequest) {
  const token = req.cookies.get(process.env.AUTH_COOKIE ?? "sid")?.value;
  const session = await verifyOpaqueTokenViaMe(token);
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { session };
}

export async function requirePermission(
  req: NextRequest,
  resource: "fichas" | "lookups",
  action: "read" | "create" | "update" | "delete"
) {
  const { session, error } = await requireAuth(req);
  if (error) return { error };
  // de momento /auth/me no da rol; por defecto usa "editor"
  const role = (session as any).role as Role ?? "editor";
  if (!can(role, resource, action)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session: { ...session, role } };
}
