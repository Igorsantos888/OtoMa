const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Seed do OdontoSys ---');

  // 1. Limpeza ou upsert de Perfis
  const defaultPermissions = {
    ADMINISTRADOR: [
      'all',
      'users:manage',
      'roles:manage',
      'patients:view', 'patients:edit', 'patients:delete',
      'agenda:view', 'agenda:edit',
      'prontuario:view', 'prontuario:edit',
      'odontograma:view', 'odontograma:edit',
      'financeiro:view', 'financeiro:edit',
      'estoque:view', 'estoque:edit',
      'comissoes:view', 'comissoes:edit',
      'relatorios:view',
      'auditoria:view'
    ],
    DENTISTA: [
      'patients:view', 'patients:edit',
      'agenda:view', 'agenda:edit',
      'prontuario:view', 'prontuario:edit',
      'odontograma:view', 'odontograma:edit',
      'tratamentos:view', 'tratamentos:edit',
      'documentos:sign',
      'comissoes:view'
    ],
    RECEPCIONISTA: [
      'patients:view', 'patients:edit',
      'agenda:view', 'agenda:edit',
      'financeiro:basic',
      'comunicacao:send'
    ],
    FINANCEIRO: [
      'financeiro:view', 'financeiro:edit',
      'relatorios:view',
      'comissoes:view', 'comissoes:edit',
      'convenios:manage'
    ],
    AUXILIAR: [
      'agenda:view',
      'atendimento:view',
      'estoque:view', 'estoque:edit'
    ]
  };

  const roles = {};

  const roleConfigs = [
    { name: 'ADMINISTRADOR', description: 'Acesso total a todas as configurações e módulos da clínica.' },
    { name: 'DENTISTA', description: 'Acesso clínico: Prontuário, Odontograma, Agenda, Tratamentos e Assinatura.' },
    { name: 'RECEPCIONISTA', description: 'Acesso à recepção: Agenda, Cadastro de pacientes e comunicação.' },
    { name: 'FINANCEIRO', description: 'Acesso financeiro: Contas a pagar/receber, conciliação e comissões.' },
    { name: 'AUXILIAR', description: 'Acesso de apoio: Agenda de atendimento e controle de estoque de insumos.' }
  ];

  for (const r of roleConfigs) {
    const roleRecord = await prisma.role.upsert({
      where: { name: r.name },
      update: {
        description: r.description,
        permissions: JSON.stringify(defaultPermissions[r.name] || [])
      },
      create: {
        name: r.name,
        description: r.description,
        permissions: JSON.stringify(defaultPermissions[r.name] || [])
      }
    });
    roles[r.name] = roleRecord;
  }

  // 2. Criar Usuários
  const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
  const hashedPasswordDentist = await bcrypt.hash('dentista123', 10);
  const hashedPasswordRecep = await bcrypt.hash('recepcao123', 10);
  const hashedPasswordFin = await bcrypt.hash('fin123', 10);
  const hashedPasswordAux = await bcrypt.hash('aux123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@odontosys.com' },
    update: {},
    create: {
      name: 'Dr. Roberto Alencar (Admin)',
      email: 'admin@odontosys.com',
      passwordHash: hashedPasswordAdmin,
      phone: '(11) 98888-0001',
      roleId: roles['ADMINISTRADOR'].id,
      twoFactorEnabled: false
    }
  });

  const dentist1 = await prisma.user.upsert({
    where: { email: 'dentista@odontosys.com' },
    update: {},
    create: {
      name: 'Dr. Lucas Carvalho',
      email: 'dentista@odontosys.com',
      passwordHash: hashedPasswordDentist,
      cro: 'CRO-SP 124589',
      specialty: 'Implantodontia e Prótese',
      phone: '(11) 97777-1111',
      roleId: roles['DENTISTA'].id
    }
  });

  const dentist2 = await prisma.user.upsert({
    where: { email: 'dra.ana@odontosys.com' },
    update: {},
    create: {
      name: 'Dra. Ana Paula Ribeiro',
      email: 'dra.ana@odontosys.com',
      passwordHash: hashedPasswordDentist,
      cro: 'CRO-SP 987654',
      specialty: 'Ortodontia e Odontopediatria',
      phone: '(11) 97777-2222',
      roleId: roles['DENTISTA'].id
    }
  });

  const receptionist = await prisma.user.upsert({
    where: { email: 'recepcao@odontosys.com' },
    update: {},
    create: {
      name: 'Mariana Santos',
      email: 'recepcao@odontosys.com',
      passwordHash: hashedPasswordRecep,
      phone: '(11) 96666-3333',
      roleId: roles['RECEPCIONISTA'].id
    }
  });

  const financeiroUser = await prisma.user.upsert({
    where: { email: 'financeiro@odontosys.com' },
    update: {},
    create: {
      name: 'Carlos Eduardo Braga',
      email: 'financeiro@odontosys.com',
      passwordHash: hashedPasswordFin,
      phone: '(11) 95555-4444',
      roleId: roles['FINANCEIRO'].id
    }
  });

  const auxiliarUser = await prisma.user.upsert({
    where: { email: 'auxiliar@odontosys.com' },
    update: {},
    create: {
      name: 'Juliana Mendes',
      email: 'auxiliar@odontosys.com',
      passwordHash: hashedPasswordAux,
      phone: '(11) 94444-5555',
      roleId: roles['AUXILIAR'].id
    }
  });

  // 3. Convênios
  const convenios = ['Particular', 'Uniodonto', 'Amil Dental', 'Bradesco Dental', 'SulAmérica Odonto'];
  for (const c of convenios) {
    await prisma.insurancePlan.upsert({
      where: { name: c },
      update: {},
      create: {
        name: c,
        reimbursementDays: c === 'Particular' ? 0 : 30
      }
    });
  }

  // 4. Pacientes Exemplo
  const patient1 = await prisma.patient.upsert({
    where: { code: 1001 },
    update: {},
    create: {
      code: 1001,
      name: 'Camila Fernandes Costa',
      cpf: '321.654.987-01',
      rg: '45.123.789-X',
      birthDate: new Date('1992-05-14'),
      gender: 'F',
      phone: '(11) 99876-5432',
      whatsapp: '5511998765432',
      email: 'camila.costa@email.com',
      address: 'Av. Paulista, 1500',
      number: '1500',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
      occupation: 'Arquiteta',
      insuranceName: 'Amil Dental',
      insuranceCardNumber: '984512039',
      status: 'ATIVO',
      anamnese: {
        create: {
          hasAllergies: true,
          allergiesDetails: 'Alergia severa a Penicilina e Dipirona',
          hasHypertension: false,
          hasDiabetes: false,
          hasHeartCondition: false,
          chiefComplaint: 'Dor de dente no molar inferior direito ao mastigar alimentos frios',
          emergencyContactName: 'Rodrigo Costa (Esposo)',
          emergencyContactPhone: '(11) 99111-2233'
        }
      }
    }
  });

  const patient2 = await prisma.patient.upsert({
    where: { code: 1002 },
    update: {},
    create: {
      code: 1002,
      name: 'Marcos Vinicius de Souza',
      cpf: '456.789.123-45',
      rg: '32.654.987-1',
      birthDate: new Date('1985-11-23'),
      gender: 'M',
      phone: '(11) 98765-4321',
      whatsapp: '5511987654321',
      email: 'marcos.souza@email.com',
      address: 'Rua Vergueiro, 789',
      neighborhood: 'Paraíso',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '04101-000',
      occupation: 'Engenheiro de Software',
      insuranceName: 'Particular',
      status: 'ATIVO',
      anamnese: {
        create: {
          hasAllergies: false,
          hasHypertension: true,
          hasDiabetes: false,
          currentMedications: 'Losartana 50mg (controle de pressão arterial)',
          chiefComplaint: 'Avaliação de implante no dente 16 e clareamento dental',
          emergencyContactName: 'Tatiane Souza (Irmã)',
          emergencyContactPhone: '(11) 98222-3344'
        }
      }
    }
  });

  const patient3 = await prisma.patient.upsert({
    where: { code: 1003 },
    update: {},
    create: {
      code: 1003,
      name: 'Beatriz Lima Albuquerque',
      cpf: '789.123.456-99',
      birthDate: new Date('2001-08-30'),
      gender: 'F',
      phone: '(11) 97654-3210',
      whatsapp: '5511976543210',
      email: 'beatriz.lima@email.com',
      insuranceName: 'Uniodonto',
      status: 'ATIVO',
      anamnese: {
        create: {
          hasAllergies: false,
          chiefComplaint: 'Manutenção de aparelho ortodôntico e profilaxia'
        }
      }
    }
  });

  // 5. Odontograma Inicial do Paciente 1 e 2
  // Dente 46 com cárie oclusal e dente 16 ausente / indicação de implante
  await prisma.odontogramItem.createMany({
    data: [
      {
        patientId: patient1.id,
        toothNumber: 46,
        face: 'O',
        condition: 'CARIE',
        stage: 'INICIAL',
        notes: 'Cárie profunda na face oclusal, sensibilidade ao teste térmico'
      },
      {
        patientId: patient1.id,
        toothNumber: 21,
        face: 'V',
        condition: 'RESTAURACAO_RESINA',
        stage: 'INICIAL',
        notes: 'Restauração antiga com leve pigmentação marginal'
      },
      {
        patientId: patient2.id,
        toothNumber: 16,
        face: 'GERAL',
        condition: 'EXTRACAO_REALIZADA',
        stage: 'INICIAL',
        notes: 'Perda do elemento há 2 anos, reabsorção óssea moderada'
      },
      {
        patientId: patient2.id,
        toothNumber: 16,
        face: 'GERAL',
        condition: 'IMPLANTE',
        stage: 'PLANEJADO',
        notes: 'Planejado implante cone morse 4.0 x 11mm + coroa sobre implante'
      }
    ]
  });

  // 6. Agendamentos de Hoje e Próximos Dias
  const todayStr = new Date().toISOString().split('T')[0];
  
  await prisma.appointment.createMany({
    data: [
      {
        patientId: patient1.id,
        dentistId: dentist1.id,
        date: todayStr,
        startTime: '09:00',
        endTime: '09:45',
        durationMin: 45,
        chairNumber: 1,
        status: 'EM_ATENDIMENTO',
        procedureType: 'Restauração Resina Fotopolimerizável',
        notes: 'Paciente relatou sensibilidade. Atenção à alergia a Penicilina.'
      },
      {
        patientId: patient2.id,
        dentistId: dentist1.id,
        date: todayStr,
        startTime: '10:00',
        endTime: '11:00',
        durationMin: 60,
        chairNumber: 1,
        status: 'EM_ESPERA',
        procedureType: 'Planejamento Cirúrgico / Tomografia Implante',
        notes: 'Verificar aferição de pressão antes do procedimento.'
      },
      {
        patientId: patient3.id,
        dentistId: dentist2.id,
        date: todayStr,
        startTime: '11:30',
        endTime: '12:00',
        durationMin: 30,
        chairNumber: 2,
        status: 'CONFIRMADO',
        procedureType: 'Manutenção Ortodôntica',
        notes: 'Troca de arco superior e ligaduras elásticas.'
      },
      {
        patientId: patient1.id,
        dentistId: dentist2.id,
        date: todayStr,
        startTime: '14:30',
        endTime: '15:15',
        durationMin: 45,
        chairNumber: 2,
        status: 'AGENDADO',
        procedureType: 'Profilaxia e Raspagem Supra-gengival',
        notes: 'Consulta preventiva agendada.'
      }
    ]
  });

  // 7. Planos de Tratamento e Orçamento
  const plan1 = await prisma.treatmentPlan.create({
    data: {
      patientId: patient1.id,
      title: 'Tratamento Restaurador e Profilaxia',
      status: 'APROVADO',
      totalAmount: 780.0,
      discountAmount: 80.0,
      finalAmount: 700.0,
      paymentTerms: '2x de R$ 350,00 no Cartão de Crédito',
      notes: 'Plano aprovado em consulta inicial',
      procedures: {
        create: [
          {
            toothNumber: 46,
            procedureName: 'Restauração Oclusal em Resina Composta',
            category: 'Dentística',
            cost: 250.0,
            status: 'CONCLUIDO'
          },
          {
            toothNumber: 21,
            procedureName: 'Troca de Faceta/Restauração Estética Vestibular',
            category: 'Estética',
            cost: 350.0,
            status: 'PENDENTE'
          },
          {
            procedureName: 'Profilaxia com Jato de Bicarbonato e Flúor',
            category: 'Periodontia',
            cost: 180.0,
            status: 'CONCLUIDO'
          }
        ]
      }
    }
  });

  // 8. Financeiro (Contas a Receber e Pagar)
  await prisma.financialAccount.createMany({
    data: [
      {
        type: 'RECEBER',
        category: 'Tratamento Clínico',
        description: 'Plano Restaurador Camila Fernandes - Parcela 1/2',
        amount: 350.0,
        dueDate: todayStr,
        paymentDate: todayStr,
        status: 'PAGO',
        paymentMethod: 'CARTAO_CREDITO',
        patientId: patient1.id,
        installments: '1/2'
      },
      {
        type: 'RECEBER',
        category: 'Tratamento Clínico',
        description: 'Plano Restaurador Camila Fernandes - Parcela 2/2',
        amount: 350.0,
        dueDate: '2026-10-16',
        status: 'PENDENTE',
        paymentMethod: 'CARTAO_CREDITO',
        patientId: patient1.id,
        installments: '2/2'
      },
      {
        type: 'PAGAR',
        category: 'Dental / Insumos',
        description: 'Dental Cremer - Resinas e Anestésicos NF 10423',
        amount: 1450.0,
        dueDate: todayStr,
        paymentDate: todayStr,
        status: 'PAGO',
        paymentMethod: 'PIX',
        supplier: 'Dental Cremer'
      },
      {
        type: 'PAGAR',
        category: 'Laboratório de Prótese',
        description: 'Lab Dental Art - Coroa Cerâmica E-Max',
        amount: 420.0,
        dueDate: '2026-09-25',
        status: 'PENDENTE',
        paymentMethod: 'BOLETO',
        supplier: 'Laboratório Dental Art'
      },
      {
        type: 'PAGAR',
        category: 'Aluguel do Consultório',
        description: 'Condomínio e Aluguel Sala 104',
        amount: 3200.0,
        dueDate: '2026-10-05',
        status: 'PENDENTE',
        paymentMethod: 'BOLETO',
        supplier: 'Imobiliária Prime'
      }
    ]
  });

  // 9. Estoque & Insumos
  await prisma.stockItem.createMany({
    data: [
      {
        name: 'Anestésico Articaína 4% com Epinefrina 1:100.000',
        category: 'Anestésicos',
        sku: 'ANE-ART-01',
        quantity: 12,
        minQuantity: 15,
        unit: 'CX',
        costPrice: 189.90,
        supplier: 'DFL Dental',
        batchNumber: 'LT-2024-098',
        expirationDate: '2027-04-30'
      },
      {
        name: 'Resina Composta Filtek Z350 XT cor A2',
        category: 'Resinas',
        sku: 'RES-3M-A2',
        quantity: 8,
        minQuantity: 4,
        unit: 'UN',
        costPrice: 142.50,
        supplier: '3M ESPE',
        batchNumber: 'B39881',
        expirationDate: '2026-12-15'
      },
      {
        name: 'Luva de Procedimento Nitrílica Azul (Tam M)',
        category: 'Descartáveis',
        sku: 'LUV-NIT-M',
        quantity: 3,
        minQuantity: 10,
        unit: 'CX',
        costPrice: 48.00,
        supplier: 'Unigloves',
        batchNumber: 'UG-8821',
        expirationDate: '2028-01-10'
      },
      {
        name: 'Kit Brocas Carbide Alta Rotação FG (10 un)',
        category: 'Instrumentos',
        sku: 'BRO-CAR-FG',
        quantity: 14,
        minQuantity: 5,
        unit: 'PCT',
        costPrice: 95.00,
        supplier: 'KG Sorensen',
        batchNumber: 'KG-4410',
        expirationDate: '2030-01-01'
      }
    ]
  });

  // 10. Log de Auditoria Inicial
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      userName: admin.name,
      action: 'SYSTEM_INIT',
      entity: 'Sistema',
      details: JSON.stringify({ message: 'Inicialização do banco de dados e perfis do OdontoSys' }),
      ipAddress: '127.0.0.1'
    }
  });

  console.log('--- Seed do OdontoSys Concluído com Sucesso! ---');
  console.log('Usuários de acesso:');
  console.log('Admin:       admin@odontosys.com       / admin123');
  console.log('Dentista:    dentista@odontosys.com    / dentista123');
  console.log('Dentista 2:  dra.ana@odontosys.com     / dentista123');
  console.log('Recepção:    recepcao@odontosys.com    / recepcao123');
  console.log('Financeiro:  financeiro@odontosys.com  / fin123');
  console.log('Auxiliar:    auxiliar@odontosys.com    / aux123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
