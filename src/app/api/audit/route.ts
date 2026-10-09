import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, 'auditoria:view')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit')) || 100;
    const action = searchParams.get('action');

    const where: any = {};
    if (action) where.action = action;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(logs);
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao consultar auditoria' }, { status: 500 });
  }
}
