import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, 'prontuario:edit')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const data = await req.json();
    const { patientId, toothInvolved, procedureDone, observations, signatureData } = data;

    const evolution = await prisma.clinicalEvolution.create({
      data: {
        patientId,
        dentistId: user.id,
        toothInvolved: toothInvolved || null,
        procedureDone,
        observations: observations || '',
        signed: true,
        signatureData: signatureData || null,
      },
      include: {
        dentist: { select: { name: true, cro: true } },
      },
    });

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: 'CLINICAL_EVOLUTION_RECORDED',
      entity: 'Prontuario',
      entityId: patientId,
      details: { procedureDone, toothInvolved },
    });

    return NextResponse.json(evolution, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao registrar evolução clínica' }, { status: 500 });
  }
}
