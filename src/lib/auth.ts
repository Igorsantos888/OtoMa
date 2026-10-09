import { cookies } from 'next/headers';
import { prisma } from './prisma';
import crypto from 'crypto';

export const SESSION_COOKIE_NAME = 'odonto_session';

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createSession(userId: string, ipAddress?: string, userAgent?: string, rememberMe = false) {
  const token = generateSessionToken();
  // 30 dias se 'lembrar-me', caso contrário 24 horas
  const days = rememberMe ? 30 : 1;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const session = await prisma.session.create({
    data: {
      userId,
      token,
      ipAddress: ipAddress || '127.0.0.1',
      userAgent: userAgent || 'Navegador Web',
      expiresAt,
    },
  });

  return { session, token, expiresAt };
}

export async function getCurrentUser() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) return null;

    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!session) return null;

    // Verificar expiração
    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { token } }).catch(() => {});
      return null;
    }

    if (!session.user.isActive) return null;

    let permissions: string[] = [];
    try {
      permissions = JSON.parse(session.user.role.permissions);
    } catch {
      permissions = [];
    }

    return {
      ...session.user,
      permissions,
      roleName: session.user.role.name,
      sessionId: session.id
    };
  } catch (err) {
    console.error('Erro ao obter usuário atual:', err);
    return null;
  }
}

export function hasPermission(user: { permissions?: string[] } | null, requiredPermission: string): boolean {
  if (!user || !user.permissions) return false;
  if (user.permissions.includes('all')) return true;
  return user.permissions.includes(requiredPermission);
}
