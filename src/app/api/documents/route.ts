import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const data = await req.json();
    const { patientId, type, title, content, patientSignature, dentistSignature } = data;

    const doc = await prisma.document.create({
      data: {
        patientId,
        type: type || 'TERMO_CONSENTIMENTO',
        title,
        content,
        signedByPatient: !!patientSignature,
        patientSignature: patientSignature || null,
        signedByDentist: !!dentistSignature,
        dentistSignature: dentistSignature || null,
        signedAt: patientSignature || dentistSignature ? new Date() : null,
      },
    });

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: 'DOCUMENT_CREATED',
      entity: 'Documento',
      entityId: doc.id,
      details: { type: doc.type, title: doc.title },
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao gerar documento' }, { status: 500 });
  }
}
