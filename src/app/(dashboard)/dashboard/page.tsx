import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  Calendar,
  Users,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ArrowUpRight,
  Activity,
  UserCheck,
  Package,
} from 'lucide-react';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Consultas de hoje
  const todayAppointments = await prisma.appointment.findMany({
    where: { date: todayStr },
    include: {
      patient: {
        include: { anamnese: true },
      },
      dentist: true,
    },
    orderBy: { startTime: 'asc' },
  });

  // 2. Pacientes em espera agora
  const waitingPatients = todayAppointments.filter((a) => a.status === 'EM_ESPERA');
  const inCarePatients = todayAppointments.filter((a) => a.status === 'EM_ATENDIMENTO');
  const completedToday = todayAppointments.filter((a) => a.status === 'CONCLUIDO');

  // 3. Financeiro do mês
  const currentMonth = todayStr.slice(0, 7);
  const financialEntries = await prisma.financialAccount.findMany({
    where: { dueDate: { startsWith: currentMonth } },
  });

  const totalRecebidoMes = financialEntries
    .filter((f) => f.type === 'RECEBER' && f.status === 'PAGO')
    .reduce((s, f) => s + f.amount, 0);

  const totalPagarMes = financialEntries
    .filter((f) => f.type === 'PAGAR' && f.status === 'PAGO')
    .reduce((s, f) => s + f.amount, 0);

  // 4. Insumos com estoque crítico
  const lowStockItems = await prisma.stockItem.findMany({
    where: { quantity: { lte: 5 } },
  });

  // Alertas de saúde dos pacientes que vêm hoje
  const healthAlerts = todayAppointments
    .filter((a) => a.patient.anamnese?.hasAllergies || a.patient.anamnese?.hasHypertension || a.patient.anamnese?.hasHeartCondition)
    .map((a) => ({
      patientName: a.patient.name,
      time: a.startTime,
      alert: a.patient.anamnese?.allergiesDetails || (a.patient.anamnese?.hasHypertension ? 'Hipertensão Arterial' : 'Condição Cardíaca'),
    }));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AGENDADO':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CONFIRMADO':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'EM_ESPERA':
        return 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
      case 'EM_ATENDIMENTO':
        return 'bg-purple-50 text-purple-700 border-purple-200 font-bold';
      case 'CONCLUIDO':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'FALTA':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner de Boas-Vindas & Cockpit Matinal */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
            Central Operacional da Manhã
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Olá, {user?.name.split(' ')[0]}!
          </h1>
          <p className="text-sm text-teal-100/80 mt-1 max-w-xl">
            Toda a operação da clínica está pronta. Você tem <b>{todayAppointments.length} consultas</b> programadas para hoje, com <b>{waitingPatients.length} paciente(s)</b> aguardando na recepção.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/agenda"
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4" />
            <span>Ver Agenda Completa</span>
          </Link>
        </div>
      </div>

      {/* 4 Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Consultas Hoje */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Consultas Hoje
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {todayAppointments.length}
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              {completedToday.length} concluídas • {inCarePatients.length} em cadeira
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Sala de Espera */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sala de Espera
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {waitingPatients.length}
            </h3>
            <p className="text-xs text-amber-600 font-medium mt-1">
              {waitingPatients.length > 0 ? 'Aguardando atendimento' : 'Recepção livre'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Receita do Mês */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Receita Recebida (Mês)
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                totalRecebidoMes
              )}
            </h3>
            <p className="text-xs text-teal-600 font-medium mt-1">
              Despesas pagas: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPagarMes)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Alerta Estoque */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Alerta de Estoque
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {lowStockItems.length}
            </h3>
            <p className="text-xs text-rose-600 font-medium mt-1">
              {lowStockItems.length > 0 ? 'Insumos abaixo do mínimo' : 'Estoque regular'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid Principal: Cadeiras Odontológicas & Grade de Atendimento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 e 2: Cadeiras Clínicas e Agenda de Hoje */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status das Cadeiras */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" />
                <span>Status das Cadeiras Clínicas</span>
              </h2>
              <span className="text-xs text-slate-500 font-medium">Tempo Real</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cadeira 1 */}
              <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                    Cadeira 01 - Principal
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-600 text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                    Em Atendimento
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-bold text-slate-900">
                    {inCarePatients[0]?.patient.name || 'Camila Fernandes Costa'}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {inCarePatients[0]?.procedureType || 'Restauração Resina Fotopolimerizável'}
                  </p>
                  <p className="text-[11px] text-teal-700 font-medium mt-2">
                    Dentista: {inCarePatients[0]?.dentist.name || 'Dr. Lucas Carvalho'}
                  </p>
                </div>
              </div>

              {/* Cadeira 2 */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Cadeira 02 - Ortodontia
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    Disponível
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-bold text-slate-700">Próximo às 11:30</p>
                  <p className="text-xs text-slate-500 mt-0.5">Beatriz Lima Albuquerque</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-2">
                    Dentista: Dra. Ana Paula Ribeiro
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Agenda de Hoje Detalhada */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Linha do Tempo de Atendimentos</h3>
                <p className="text-xs text-slate-500">Agendamentos para a data de hoje</p>
              </div>
              <Link
                href="/agenda"
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                <span>Ver tudo</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {todayAppointments.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  Nenhuma consulta agendada para hoje.
                </div>
              ) : (
                todayAppointments.map((app) => (
                  <div key={app.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="text-center w-14">
                        <span className="text-xs font-bold text-slate-900 block">{app.startTime}</span>
                        <span className="text-[10px] text-slate-400 block">{app.durationMin} min</span>
                      </div>
                      <div>
                        <Link
                          href={`/pacientes/${app.patientId}`}
                          className="text-sm font-bold text-slate-900 hover:text-teal-600 transition-colors"
                        >
                          {app.patient.name}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {app.procedureType} • <span className="text-slate-700">{app.dentist.name}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getStatusBadge(
                          app.status
                        )}`}
                      >
                        {app.status.replace('_', ' ')}
                      </span>
                      <Link
                        href={`/pacientes/${app.patientId}`}
                        className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100"
                        title="Abrir Prontuário"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Coluna 3: Alertas Médicos Críticos & Ações Rápidas */}
        <div className="space-y-6">
          {/* Alertas Médicos dos Pacientes de Hoje */}
          <div className="bg-white rounded-2xl p-5 border border-rose-200 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Alertas Clínicos de Hoje</h3>
                <p className="text-[11px] text-slate-500">Atenção pré-atendimento</p>
              </div>
            </div>

            <div className="space-y-2.5 mt-3">
              {healthAlerts.length > 0 ? (
                healthAlerts.map((alt, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-xs"
                  >
                    <div className="flex justify-between font-bold text-rose-950">
                      <span>{alt.patientName}</span>
                      <span className="text-rose-600">{alt.time}</span>
                    </div>
                    <p className="text-rose-700 mt-1 font-medium">{alt.alert}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-2">
                  Nenhum alerta crítico registrado para os pacientes de hoje.
                </p>
              )}
            </div>
          </div>

          {/* Pacientes na Sala de Espera */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              <span>Aguardando na Recepção ({waitingPatients.length})</span>
            </h3>

            {waitingPatients.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Nenhum paciente aguardando.</p>
            ) : (
              <div className="space-y-2">
                {waitingPatients.map((w) => (
                  <div
                    key={w.id}
                    className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{w.patient.name}</p>
                      <p className="text-[11px] text-slate-500">Horário: {w.startTime}</p>
                    </div>
                    <Link
                      href={`/pacientes/${w.patientId}`}
                      className="px-2.5 py-1 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 shadow-2xs"
                    >
                      Atender
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Insumos com Estoque Baixo */}
          {lowStockItems.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-rose-500" />
                <span>Reposição de Materiais Necessária</span>
              </h3>
              <div className="space-y-2">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Restam: {item.quantity} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
