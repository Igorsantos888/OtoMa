import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true },
      });

      if (session) {
        await logAudit({
          userId: session.userId,
          userName: session.user.name,
          action: 'LOGOUT',
          entity: 'Autenticação',
        });
        await prisma.session.delete({ where: { token } }).catch(() => {});
      }
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  } catch (err: any) {
    console.error('Erro no logout:', err);
    return NextResponse.json({ success: true });
  }
}
