import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, 'tratamentos:edit')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const data = await req.json();
    const { patientId, title, procedures, discountAmount, paymentTerms, notes } = data;

    const totalAmount = (procedures || []).reduce((acc: number, p: any) => acc + (Number(p.cost) || 0), 0);
    const finalAmount = Math.max(0, totalAmount - (Number(discountAmount) || 0));

    const plan = await prisma.treatmentPlan.create({
      data: {
        patientId,
        title: title || 'Plano de Tratamento Odontológico',
        status: 'EM_ELABORACAO',
        totalAmount,
        discountAmount: Number(discountAmount) || 0,
        finalAmount,
        paymentTerms: paymentTerms || 'À combinar',
        notes: notes || null,
        procedures: {
          create: (procedures || []).map((p: any) => ({
            toothNumber: p.toothNumber ? Number(p.toothNumber) : null,
            procedureName: p.procedureName,
            category: p.category || 'Geral',
            cost: Number(p.cost) || 0,
            status: 'PENDENTE',
            notes: p.notes || null,
          })),
        },
      },
      include: {
        procedures: true,
      },
    });

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: 'TREATMENT_PLAN_CREATED',
      entity: 'PlanoTratamento',
      entityId: plan.id,
      details: { title: plan.title, finalAmount },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (err: any) {
    console.error('Erro ao criar plano:', err);
    return NextResponse.json({ error: 'Erro ao gerar orçamento/plano' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, 'tratamentos:edit')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const data = await req.json();
    const { id, status } = data;

    const plan = await prisma.treatmentPlan.update({
      where: { id },
      data: {
        status,
        approvedAt: status === 'APROVADO' ? new Date() : undefined,
      },
      include: { patient: true },
    });

    // Se aprovado, gerar lançamento a receber no Financeiro automaticamente!
    if (status === 'APROVADO') {
      const todayStr = new Date().toISOString().split('T')[0];
      await prisma.financialAccount.create({
        data: {
          type: 'RECEBER',
          category: 'Tratamento Aprovado',
          description: `Orçamento Aprovado: ${plan.title} - ${plan.patient.name}`,
          amount: plan.finalAmount,
          dueDate: todayStr,
          status: 'PENDENTE',
          paymentMethod: 'A_DEFINIR',
          patientId: plan.patientId,
        },
      });
    }

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: 'TREATMENT_PLAN_STATUS',
      entity: 'PlanoTratamento',
      entityId: plan.id,
      details: { status },
    });

    return NextResponse.json(plan);
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao atualizar plano' }, { status: 500 });
  }
}
