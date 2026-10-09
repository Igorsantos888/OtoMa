import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const dentistId = searchParams.get('dentistId');

    const where: any = {};
    if (date) where.date = date;
    if (dentistId && dentistId !== 'ALL') where.dentistId = dentistId;

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            code: true,
            name: true,
            phone: true,
            whatsapp: true,
            insuranceName: true,
            anamnese: {
              select: {
                hasAllergies: true,
                allergiesDetails: true,
                hasHypertension: true,
                hasHeartCondition: true,
              },
            },
          },
        },
        dentist: {
          select: {
            id: true,
            name: true,
            cro: true,
            specialty: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return NextResponse.json(appointments);
  } catch (err: any) {
    console.error('Erro ao listar agenda:', err);
    return NextResponse.json({ error: 'Erro ao buscar agenda' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, 'agenda:edit')) {
      return NextResponse.json({ error: 'Sem permissão para agendar consultas' }, { status: 403 });
    }

    const data = await req.json();

    // Calcular horário de término a partir da duração em minutos se não fornecido
    let endTime = data.endTime;
    if (!endTime && data.startTime && data.durationMin) {
      const [h, m] = data.startTime.split(':').map(Number);
      const totalMin = h * 60 + m + Number(data.durationMin);
      const endH = Math.floor(totalMin / 60) % 24;
      const endM = totalMin % 60;
      endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: data.patientId,
        dentistId: data.dentistId,
        date: data.date,
        startTime: data.startTime,
        endTime: endTime || '09:45',
        durationMin: Number(data.durationMin) || 30,
        chairNumber: Number(data.chairNumber) || 1,
        status: data.status || 'AGENDADO',
        procedureType: data.procedureType || 'Consulta Odontológica',
        notes: data.notes || null,
      },
      include: {
        patient: true,
        dentist: true,
      },
    });

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: 'APPOINTMENT_CREATED',
      entity: 'Agenda',
      entityId: appointment.id,
      details: {
        patient: appointment.patient.name,
        dentist: appointment.dentist.name,
        date: appointment.date,
        time: appointment.startTime,
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (err: any) {
    console.error('Erro ao criar agendamento:', err);
    return NextResponse.json({ error: 'Erro ao agendar consulta' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const data = await req.json();
    const { id, status, reminderSent, notes } = data;

    if (!id) return NextResponse.json({ error: 'ID do agendamento obrigatório' }, { status: 400 });

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (reminderSent !== undefined) updateData.reminderSent = reminderSent;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: true,
        dentist: true,
      },
    });

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: 'APPOINTMENT_STATUS_UPDATED',
      entity: 'Agenda',
      entityId: updated.id,
      details: { newStatus: status, patient: updated.patient.name },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('Erro ao atualizar agendamento:', err);
    return NextResponse.json({ error: 'Erro ao atualizar agendamento' }, { status: 500 });
  }
}
