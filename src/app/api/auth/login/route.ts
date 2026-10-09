import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const { email, password, rememberMe } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas.' },
        { status: 401 }
      );
    }

    // 1. Verificar bloqueio por tentativas excessivas (Brute Force Protection)
    if (user.lockoutUntil && new Date() < user.lockoutUntil) {
      const remainingMinutes = Math.ceil(
        (user.lockoutUntil.getTime() - Date.now()) / (1000 * 60)
      );
      return NextResponse.json(
        {
          error: `Acesso bloqueado temporariamente após tentativas incorretas. Tente novamente em ${remainingMinutes} minuto(s).`,
          isLocked: true,
          remainingMinutes,
        },
        { status: 423 }
      );
    }

    // 2. Validar senha
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      const attempts = user.failedLoginAttempts + 1;
      let lockoutUntil: Date | null = null;
      let msg = 'E-mail ou senha incorretos.';

      if (attempts >= 5) {
        lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos de bloqueio
        msg = 'Conta bloqueada por 15 minutos devido a 5 tentativas consecutivas incorretas.';
      } else {
        const remaining = 5 - attempts;
        msg = `E-mail ou senha incorretos. Você tem mais ${remaining} tentativa(s) antes do bloqueio da conta.`;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          lockoutUntil,
        },
      });

      await logAudit({
        userId: user.id,
        userName: user.name,
        action: 'LOGIN_FAILED',
        entity: 'Autenticação',
        details: { attempts, locked: attempts >= 5 },
      });

      return NextResponse.json({ error: msg, attemptsLeft: Math.max(0, 5 - attempts) }, { status: 401 });
    }

    // 3. Resetar tentativas após sucesso
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });

    // 4. Se 2FA estiver ativado para este usuário
    if (user.twoFactorEnabled) {
      return NextResponse.json({
        requires2FA: true,
        userId: user.id,
        email: user.email,
        message: 'Código de autenticação em 2 fatores (2FA) obrigatório.',
      });
    }

    // 5. Criar sessão
    const { token, expiresAt } = await createSession(
      user.id,
      req.headers.get('x-forwarded-for') || '127.0.0.1',
      req.headers.get('user-agent') || 'Browser',
      !!rememberMe
    );

    // 6. Registrar Auditoria
    await logAudit({
      userId: user.id,
      userName: user.name,
      action: 'LOGIN_SUCCESS',
      entity: 'Autenticação',
      details: { role: user.role.name, rememberMe },
    });

    // 7. Preparar resposta com cookie HTTP-Only seguro
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
        roleDescription: user.role.description,
        permissions,
        avatarUrl: user.avatarUrl,
        cro: user.cro,
        specialty: user.specialty,
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
    console.error('Erro na rota de login:', err);
    return NextResponse.json(
      { error: 'Erro interno ao processar autenticação.' },
      { status: 500 }
    );
  }
}
