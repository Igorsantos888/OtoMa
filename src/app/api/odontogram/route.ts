import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json({ error: 'patientId obrigatório' }, { status: 400 });
    }

    const items = await prisma.odontogramItem.findMany({
      where: { patientId },
      orderBy: [{ toothNumber: 'asc' }, { face: 'asc' }],
    });

    return NextResponse.json(items);
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao buscar odontograma' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, 'odontograma:edit')) {
      return NextResponse.json({ error: 'Sem permissão para alterar odontograma' }, { status: 403 });
    }

    const data = await req.json();
    const { patientId, toothNumber, face, condition, stage, notes } = data;

    if (!patientId || !toothNumber || !face || !condition) {
      return NextResponse.json({ error: 'Dados obrigatórios ausentes' }, { status: 400 });
    }

    // Se a condição for HIGIDO (saudável), remove qualquer registro anterior daquela face/dente
    if (condition === 'HIGIDO') {
      await prisma.odontogramItem.deleteMany({
        where: {
          patientId,
          toothNumber: Number(toothNumber),
          face,
        },
      });
      return NextResponse.json({ success: true, message: 'Dente/Face restaurado para hígido' });
    }

    // Upsert ou novo item
    const existing = await prisma.odontogramItem.findFirst({
      where: {
        patientId,
        toothNumber: Number(toothNumber),
        face,
      },
    });

    let savedItem;
    if (existing) {
      savedItem = await prisma.odontogramItem.update({
        where: { id: existing.id },
        data: {
          condition,
          stage: stage || 'INICIAL',
          notes: notes !== undefined ? notes : existing.notes,
        },
      });
    } else {
      savedItem = await prisma.odontogramItem.create({
        data: {
          patientId,
          toothNumber: Number(toothNumber),
          face,
          condition,
          stage: stage || 'INICIAL',
          notes: notes || null,
        },
      });
    }

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: 'ODONTOGRAM_UPDATED',
      entity: 'Odontograma',
      entityId: patientId,
      details: { tooth: toothNumber, face, condition, stage },
    });

    return NextResponse.json(savedItem, { status: 201 });
  } catch (err: any) {
    console.error('Erro no odontograma:', err);
    return NextResponse.json({ error: 'Erro ao registrar no odontograma' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, 'odontograma:edit')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    await prisma.odontogramItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao remover item do odontograma' }, { status: 500 });
  }
}
