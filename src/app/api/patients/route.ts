import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q') || '';
    const status = searchParams.get('status') || undefined;

    const patients = await prisma.patient.findMany({
      where: {
        AND: [
          status ? { status } : {},
          search
            ? {
                OR: [
                  { name: { contains: search } },
                  { phone: { contains: search } },
                  { cpf: { contains: search } },
                ],
              }
            : {},
        ],
      },
      include: {
        anamnese: true,
        appointments: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(patients);
  } catch (err: any) {
    console.error('Erro ao buscar pacientes:', err);
    return NextResponse.json({ error: 'Erro ao buscar pacientes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, 'patients:edit')) {
      return NextResponse.json({ error: 'Sem permissão para cadastrar pacientes' }, { status: 403 });
    }

    const data = await req.json();

    // Gerar código único sequencial do paciente
    const lastPatient = await prisma.patient.findFirst({
      orderBy: { code: 'desc' },
      select: { code: true },
    });
    const nextCode = (lastPatient?.code || 1000) + 1;

    const patient = await prisma.patient.create({
      data: {
        code: nextCode,
        name: data.name,
        cpf: data.cpf || null,
        rg: data.rg || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        gender: data.gender || 'M',
        phone: data.phone,
        whatsapp: data.whatsapp || data.phone.replace(/\D/g, ''),
        email: data.email || null,
        address: data.address || null,
        number: data.number || null,
        neighborhood: data.neighborhood || null,
        city: data.city || null,
        state: data.state || null,
        zipCode: data.zipCode || null,
        occupation: data.occupation || null,
        insuranceName: data.insuranceName || 'Particular',
        insuranceCardNumber: data.insuranceCardNumber || null,
        notes: data.notes || null,
        anamnese: {
          create: {
            hasAllergies: !!data.hasAllergies,
            allergiesDetails: data.allergiesDetails || null,
            hasHypertension: !!data.hasHypertension,
            hasDiabetes: !!data.hasDiabetes,
            hasHeartCondition: !!data.hasHeartCondition,
            hasBleedingProblems: !!data.hasBleedingProblems,
            isPregnant: !!data.isPregnant,
            isSmoker: !!data.isSmoker,
            currentMedications: data.currentMedications || null,
            previousSurgeries: data.previousSurgeries || null,
            chiefComplaint: data.chiefComplaint || null,
            emergencyContactName: data.emergencyContactName || null,
            emergencyContactPhone: data.emergencyContactPhone || null,
          },
        },
      },
      include: {
        anamnese: true,
      },
    });

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: 'PATIENT_CREATED',
      entity: 'Paciente',
      entityId: patient.id,
      details: { name: patient.name, code: patient.code },
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (err: any) {
    console.error('Erro ao cadastrar paciente:', err);
    return NextResponse.json({ error: 'Erro ao cadastrar paciente' }, { status: 500 });
  }
}
