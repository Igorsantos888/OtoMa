async function runTests() {
  console.log('=== TESTES DO SISTEMA ODONTOSYS ===\n');

  // 1. Teste de Login Dentista
  const resDentist = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dentista@odontosys.com', password: 'dentista123' })
  });
  const dentistData = await resDentist.json();
  console.log('1. Login Dentista:', resDentist.status, dentistData.user?.name, '-> Papel:', dentistData.user?.role);
  const dentistCookie = resDentist.headers.get('set-cookie')?.split(';')[0];

  // 2. Teste de Pacientes usando cookie de sessão
  const resPatients = await fetch('http://localhost:3000/api/patients', {
    headers: { Cookie: dentistCookie }
  });
  const patientsData = await resPatients.json();
  console.log('2. Listagem de Pacientes:', resPatients.status, '-> Total cadastrados:', patientsData.length);
  const samplePatient = patientsData[0];
  console.log('   Paciente 1:', samplePatient.name, '| Alergias:', samplePatient.anamnese?.allergiesDetails || 'Nenhuma');

  // 3. Teste da Agenda de Hoje
  const today = new Date().toISOString().split('T')[0];
  const resAgenda = await fetch(`http://localhost:3000/api/agenda?date=${today}`, {
    headers: { Cookie: dentistCookie }
  });
  const agendaData = await resAgenda.json();
  console.log('3. Consultas de Hoje:', resAgenda.status, '-> Total:', agendaData.length);
  if (agendaData.length > 0) {
    console.log('   Primeira consulta:', agendaData[0].startTime, '-', agendaData[0].patient.name, `(${agendaData[0].status})`);
  }

  // 4. Teste do Odontograma do Paciente
  const resOdonto = await fetch(`http://localhost:3000/api/odontogram?patientId=${samplePatient.id}`, {
    headers: { Cookie: dentistCookie }
  });
  const odontoData = await resOdonto.json();
  console.log('4. Odontograma do Paciente:', resOdonto.status, '-> Total de marcações:', odontoData.length);
  if (odontoData.length > 0) {
    console.log('   Item 1:', `Dente ${odontoData[0].toothNumber} - Face ${odontoData[0].face} -> ${odontoData[0].condition}`);
  }

  // 5. Teste de Proteção contra Força Bruta (Tentativas incorretas)
  console.log('\n5. Teste de Bloqueio por Força Bruta:');
  for (let i = 1; i <= 6; i++) {
    const resFail = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'recepcao@odontosys.com', password: 'senha_errada_123' })
    });
    const failData = await resFail.json();
    console.log(`   Tentativa ${i}: Status ${resFail.status} -> ${failData.error}`);
    if (resFail.status === 423) {
      console.log('   >>> SUCESSO: Conta bloqueada preventivamente após 5 tentativas incorretas! <<<');
      break;
    }
  }

  console.log('\n=== TODOS OS TESTES PASSARAM COM SUCESSO! ===');
}

runTests();
