import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Informe seu e-mail cadastrado.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (user) {
      await logAudit({
        userId: user.id,
        userName: user.name,
        action: 'PASSWORD_RESET_REQUESTED',
        entity: 'Autenticação',
        details: { email },
      });
    }

    // Retorna mensagem genérica para evitar enumeração de contas
    return NextResponse.json({
      success: true,
      message: 'Se o e-mail estiver cadastrado, as instruções de recuperação de senha foram enviadas com sucesso.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao processar recuperação de senha.' }, { status: 500 });
  }
}
