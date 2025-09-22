import { prisma } from '../database/db';

type Session = { email: string };
type SessionWithRole = { email: string; role: 'ADMIN' | 'EDITOR' | 'VIEWER' };

const PY = process.env.PY_BACKEND_URL!;
const AUTH_COOKIE = process.env.AUTH_COOKIE ?? "sid";

export async function verifyOpaqueTokenViaMe(token?: string): Promise<Session | null> {
  if (!token) return null;
  try {
    const res = await fetch(`${PY}/auth/me`, {
      method: "GET",
      headers: { Cookie: `${AUTH_COOKIE}=${token}; Path=/` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; email?: string };
    if (!data?.ok || !data?.email) return null;
    
    return { email: data.email };
  } catch { return null; }
}

export async function getUserWithRole(email: string): Promise<SessionWithRole> {
  try {
    // Obtener el rol del usuario desde la base de datos
    let userPermission = await prisma.user_permissions.findUnique({
      where: { email },
      select: { role: true }
    });
    
    let role: 'ADMIN' | 'EDITOR' | 'VIEWER' = 'EDITOR';
    
    if (!userPermission) {
      // Si el usuario no existe, crear automáticamente con rol EDITOR
      console.log(`🆕 Creating new user with EDITOR role: ${email}`);
      await prisma.user_permissions.create({
        data: {
          email,
          role: 'EDITOR'
        }
      });
      role = 'EDITOR';
    } else {
      role = userPermission.role;
    }
    
    return { email, role };
  } catch (error) {
    console.error('Error getting user role:', error);
    return { email, role: 'EDITOR' };
  }
}
