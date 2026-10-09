import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (!hasPermission(user, 'financeiro:view') && !hasPermission(user, 'financeiro:basic'))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // RECEBER, PAGAR ou all

    const where: any = {};
    if (type && (type === 'RECEBER' || type === 'PAGAR')) {
      where.type = type;
    }

    const accounts = await prisma.financialAccount.findMany({
      where,
      include: {
        patient: { select: { name: true, phone: true } },
      },
      orderBy: [{ dueDate: 'asc' }],
    });

    // Calcular estatísticas
    const all = await prisma.financialAccount.findMany();
    const totalRecebido = all
      .filter((a) => a.type === 'RECEBER' && a.status === 'PAGO')
      .reduce((s, a) => s + a.amount, 0);

    const aReceberPendente = all
      .filter((a) => a.type === 'RECEBER' && a.status !== 'PAGO')
      .reduce((s, a) => s + a.amount, 0);

    const totalPago = all
      .filter((a) => a.type === 'PAGAR' && a.status === 'PAGO')
      .reduce((s, a) => s + a.amount, 0);

    const aPagarPendente = all
      .filter((a) => a.type === 'PAGAR' && a.status !== 'PAGO')
      .reduce((s, a) => s + a.amount, 0);

    const saldoAtual = totalRecebido - totalPago;

    return NextResponse.json({
      accounts,
      metrics: {
        totalRecebido,
        aReceberPendente,
        totalPago,
        aPagarPendente,
        saldoAtual,
      },
    });
  } catch (err: any) {
    console.error('Erro financeiro:', err);
    return NextResponse.json({ error: 'Erro ao consultar financeiro' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, 'financeiro:edit')) {
      return NextResponse.json({ error: 'Sem permissão para cadastrar lançamentos financeiros' }, { status: 403 });
    }

    const data = await req.json();

    const account = await prisma.financialAccount.create({
      data: {
        type: data.type, // RECEBER ou PAGAR
        category: data.category || 'Geral',
        description: data.description,
        amount: Number(data.amount) || 0,
        dueDate: data.dueDate,
        paymentDate: data.paymentDate || (data.status === 'PAGO' ? new Date().toISOString().split('T')[0] : null),
        status: data.status || 'PENDENTE',
        paymentMethod: data.paymentMethod || 'PIX',
        patientId: data.patientId || null,
        supplier: data.supplier || null,
        installments: data.installments || null,
      },
    });

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: 'FINANCIAL_ENTRY_CREATED',
      entity: 'Financeiro',
      entityId: account.id,
      details: { type: account.type, amount: account.amount, desc: account.description },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (err: any) {
    console.error('Erro ao criar conta:', err);
    return NextResponse.json({ error: 'Erro ao salvar lançamento' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, 'financeiro:edit')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const data = await req.json();
    const { id, status, paymentDate, paymentMethod } = data;

    const account = await prisma.financialAccount.update({
      where: { id },
      data: {
        status,
        paymentDate: status === 'PAGO' ? (paymentDate || new Date().toISOString().split('T')[0]) : null,
        paymentMethod: paymentMethod || undefined,
      },
    });

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: 'FINANCIAL_ENTRY_UPDATED',
      entity: 'Financeiro',
      entityId: account.id,
      details: { newStatus: status, amount: account.amount },
    });

    return NextResponse.json(account);
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao atualizar lançamento' }, { status: 500 });
  }
}
