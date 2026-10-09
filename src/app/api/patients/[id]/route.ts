import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const patient = await prisma.patient.findUnique({
      where: { id: params.id },
      include: {
        anamnese: true,
        appointments: {
          include: { dentist: { select: { name: true, specialty: true } } },
          orderBy: { date: 'desc' },
        },
        odontogramItems: {
          orderBy: { toothNumber: 'asc' },
        },
        treatmentPlans: {
          include: {
            procedures: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        clinicalEvolutions: {
          include: { dentist: { select: { name: true, cro: true } } },
          orderBy: { date: 'desc' },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        financialAccounts: {
          orderBy: { dueDate: 'desc' },
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 });
    }

    return NextResponse.json(patient);
  } catch (err: any) {
    console.error('Erro ao buscar prontuário:', err);
    return NextResponse.json({ error: 'Erro ao buscar prontuário' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, 'patients:edit')) {
      return NextResponse.json({ error: 'Sem permissão para atualizar paciente' }, { status: 403 });
    }

    const data = await req.json();

    const updated = await prisma.patient.update({
      where: { id: params.id },
      data: {
        name: data.name,
        cpf: data.cpf,
        rg: data.rg,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        gender: data.gender,
        phone: data.phone,
        whatsapp: data.whatsapp,
        email: data.email,
        address: data.address,
        number: data.number,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        occupation: data.occupation,
        insuranceName: data.insuranceName,
        insuranceCardNumber: data.insuranceCardNumber,
        status: data.status,
        notes: data.notes,
        anamnese: data.anamnese
          ? {
              upsert: {
                create: {
                  hasAllergies: !!data.anamnese.hasAllergies,
                  allergiesDetails: data.anamnese.allergiesDetails,
                  hasHypertension: !!data.anamnese.hasHypertension,
                  hasDiabetes: !!data.anamnese.hasDiabetes,
                  hasHeartCondition: !!data.anamnese.hasHeartCondition,
                  hasBleedingProblems: !!data.anamnese.hasBleedingProblems,
                  isPregnant: !!data.anamnese.isPregnant,
                  isSmoker: !!data.anamnese.isSmoker,
                  currentMedications: data.anamnese.currentMedications,
                  previousSurgeries: data.anamnese.previousSurgeries,
                  chiefComplaint: data.anamnese.chiefComplaint,
                  emergencyContactName: data.anamnese.emergencyContactName,
                  emergencyContactPhone: data.anamnese.emergencyContactPhone,
                },
                update: {
                  hasAllergies: !!data.anamnese.hasAllergies,
                  allergiesDetails: data.anamnese.allergiesDetails,
                  hasHypertension: !!data.anamnese.hasHypertension,
                  hasDiabetes: !!data.anamnese.hasDiabetes,
                  hasHeartCondition: !!data.anamnese.hasHeartCondition,
                  hasBleedingProblems: !!data.anamnese.hasBleedingProblems,
                  isPregnant: !!data.anamnese.isPregnant,
                  isSmoker: !!data.anamnese.isSmoker,
                  currentMedications: data.anamnese.currentMedications,
                  previousSurgeries: data.anamnese.previousSurgeries,
                  chiefComplaint: data.anamnese.chiefComplaint,
                  emergencyContactName: data.anamnese.emergencyContactName,
                  emergencyContactPhone: data.anamnese.emergencyContactPhone,
                },
              },
            }
          : undefined,
      },
      include: {
        anamnese: true,
      },
    });

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: 'PATIENT_UPDATED',
      entity: 'Paciente',
      entityId: updated.id,
      details: { name: updated.name },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('Erro ao atualizar paciente:', err);
    return NextResponse.json({ error: 'Erro ao atualizar paciente' }, { status: 500 });
  }
}
