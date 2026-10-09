import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (!hasPermission(user, 'comissoes:view') && user.roleName !== 'DENTISTA')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dentistId = searchParams.get('dentistId');

    const where: any = {};
    // Se não for admin/financeiro, o dentista só pode ver a sua própria comissão
    if (user.roleName === 'DENTISTA') {
      where.dentistId = user.id;
    } else if (dentistId && dentistId !== 'ALL') {
      where.dentistId = dentistId;
    }

    // Buscar dentistas
    const dentists = await prisma.user.findMany({
      where: { role: { name: 'DENTISTA' } },
      select: { id: true, name: true, specialty: true, cro: true },
    });

    const commissions = await prisma.commission.findMany({
      where,
      include: {
        dentist: { select: { name: true, cro: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      dentists,
      commissions,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao buscar comissões' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, 'comissoes:edit')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const data = await req.json();
    const { dentistId, procedureName, totalValue, commissionRate, periodMonth } = data;

    const rate = Number(commissionRate) || 40.0;
    const val = Number(totalValue) || 0;
    const commissionValue = (val * rate) / 100;

    const commission = await prisma.commission.create({
      data: {
        dentistId,
        procedureName: procedureName || 'Procedimento Clínico',
        totalValue: val,
        commissionRate: rate,
        commissionValue,
        status: 'PENDENTE',
        periodMonth: periodMonth || new Date().toISOString().slice(0, 7),
      },
      include: { dentist: true },
    });

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: 'COMMISSION_CREATED',
      entity: 'Comissão',
      entityId: commission.id,
      details: { dentist: commission.dentist.name, value: commissionValue },
    });

    return NextResponse.json(commission, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao lançar comissão' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, 'comissoes:edit')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const data = await req.json();
    const { id, status } = data;

    const commission = await prisma.commission.update({
      where: { id },
      data: {
        status,
        paidAt: status === 'PAGO' ? new Date() : null,
      },
    });

    return NextResponse.json(commission);
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao atualizar status da comissão' }, { status: 500 });
  }
}
