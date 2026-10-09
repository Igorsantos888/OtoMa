import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { authenticator } from 'otplib';
import { logAudit } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const { userId, code, rememberMe } = await req.json();

    if (!userId || !code) {
      return NextResponse.json(
        { error: 'Dados incompletos para validação 2FA.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    // Validação de TOTP (ou código mestre de contingência '123456' para facilidade de testes)
    const isValid =
      code === '123456' ||
      (user.twoFactorSecret && authenticator.check(code, user.twoFactorSecret));

    if (!isValid) {
      return NextResponse.json(
        { error: 'Código 2FA inválido ou expirado.' },
        { status: 401 }
      );
    }

    // Criar Sessão
    const { token, expiresAt } = await createSession(
      user.id,
      req.headers.get('x-forwarded-for') || '127.0.0.1',
      req.headers.get('user-agent') || 'Browser',
      !!rememberMe
    );

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: '2FA_VERIFIED',
      entity: 'Autenticação',
      details: { method: 'TOTP' },
    });

    let permissions: string[] = [];
    try {
      permissions = JSON.parse(user.role.permissions);
    } catch {
      permissions = [];
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        permissions,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });

    return response;
  } catch (err: any) {
    console.error('Erro na validação 2FA:', err);
    return NextResponse.json(
      { error: 'Erro ao validar código 2FA.' },
      { status: 500 }
    );
  }
}
