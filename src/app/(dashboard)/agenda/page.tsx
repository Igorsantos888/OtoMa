'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Filter,
  X,
} from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  insuranceName?: string;
}

interface Dentist {
  id: string;
  name: string;
  specialty?: string;
}

interface Appointment {
  id: string;
  patientId: string;
  patient: Patient;
  dentistId: string;
  dentist: Dentist;
  date: string;
  startTime: string;
  endTime: string;
  durationMin: number;
  chairNumber: number;
  status: string;
  procedureType: string;
  notes?: string;
  reminderSent: boolean;
}

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedDentist, setSelectedDentist] = useState<string>('ALL');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dentistsList, setDentistsList] = useState<Dentist[]>([]);
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal Novo Agendamento
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPatientId, setModalPatientId] = useState('');
  const [modalDentistId, setModalDentistId] = useState('');
  const [modalTime, setModalTime] = useState('09:00');
  const [modalDuration, setModalDuration] = useState('30');
  const [modalChair, setModalChair] = useState('1');
  const [modalProcedure, setModalProcedure] = useState('Consulta Odontológica');
  const [modalNotes, setModalNotes] = useState('');

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/agenda?date=${selectedDate}&dentistId=${selectedDentist}`
      );
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchInitialData = async () => {
    try {
      const pRes = await fetch('/api/patients');
      const pData = await pRes.json();
      setPatientsList(Array.isArray(pData) ? pData : []);

      // Dentistas padrão da clínica
      const dRes = await fetch('/api/comissoes');
      const dData = await dRes.json();
      if (dData.dentists) {
        setDentistsList(dData.dentists);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate, selectedDentist]);

  // Alterar data por dia
  const changeDateByDays = (days: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Alterar status do agendamento
  const handleStatusChange = async (appId: string, newStatus: string) => {
    try {
      await fetch('/api/agenda', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: appId, status: newStatus }),
      });
      fetchAppointments();
    } catch (e) {
      console.error(e);
    }
  };

  // Criar agendamento
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalPatientId || !modalDentistId) return;

    try {
      await fetch('/api/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: modalPatientId,
          dentistId: modalDentistId,
          date: selectedDate,
          startTime: modalTime,
          durationMin: modalDuration,
          chairNumber: modalChair,
          procedureType: modalProcedure,
          notes: modalNotes,
        }),
      });
      setIsModalOpen(false);
      fetchAppointments();
    } catch (e) {
      console.error(e);
    }
  };

  // Enviar lembrete via WhatsApp
  const handleSendWhatsAppReminder = (app: Appointment) => {
    const phone = app.patient.whatsapp || app.patient.phone.replace(/\D/g, '');
    const cleanPhone = phone.startsWith('55') ? phone : `55${phone}`;
    const message = encodeURIComponent(
      `Olá, ${app.patient.name}! Lembramos da sua consulta odontológica na Clínica Integrada no dia ${selectedDate.split('-').reverse().join('/')} às ${app.startTime} com ${app.dentist.name}. Por favor, confirme seu comparecimento respondendo SIM.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AGENDADO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CONFIRMADO':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'EM_ESPERA':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-bold animate-pulse';
      case 'EM_ATENDIMENTO':
        return 'bg-purple-100 text-purple-800 border-purple-300 font-bold';
      case 'CONCLUIDO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'FALTA':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'CANCELADO':
        return 'bg-slate-100 text-slate-500 border-slate-200 line-through';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header da Agenda */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Agenda Odontológica</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Controle de horários por profissional, cadeira e status de atendimento
          </p>
        </div>

        <button
          onClick={() => {
            if (dentistsList.length > 0) setModalDentistId(dentistsList[0].id);
            if (patientsList.length > 0) setModalPatientId(patientsList[0].id);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Agendar Nova Consulta</span>
        </button>
      </div>

      {/* Barra de Filtros e Controles de Data */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Navegação por Data */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeDateByDays(-1)}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
            title="Dia anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white"
          />

          <button
            onClick={() => changeDateByDays(1)}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
            title="Próximo dia"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
          >
            Hoje
          </button>
        </div>

        {/* Filtro de Dentista */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Profissional:</span>
          <select
            value={selectedDentist}
            onChange={(e) => setSelectedDentist(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium bg-white text-slate-800 focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">Todos os Dentistas</option>
            {dentistsList.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.specialty || 'Clínico'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista / Grade de Consultas do Dia */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Carregando consultas...</div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Nenhuma consulta encontrada para este dia.</p>
            <p className="text-xs text-slate-400 mt-1">Clique em "Agendar Nova Consulta" para marcar pacientes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <th className="p-4">Horário</th>
                  <th className="p-4">Paciente</th>
                  <th className="p-4">Profissional</th>
                  <th className="p-4">Procedimento / Motivo</th>
                  <th className="p-4">Cadeira</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-teal-600" />
                        <span>{app.startTime} - {app.endTime}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block ml-5">
                        {app.durationMin} minutos
                      </span>
                    </td>

                    <td className="p-4">
                      <Link
                        href={`/pacientes/${app.patientId}`}
                        className="font-bold text-slate-900 hover:text-teal-600 transition-colors block"
                      >
                        {app.patient.name}
                      </Link>
                      <span className="text-[11px] text-slate-500">
                        {app.patient.phone} • {app.patient.insuranceName || 'Particular'}
                      </span>
                    </td>

                    <td className="p-4 text-slate-700 font-medium">
                      {app.dentist.name}
                    </td>

                    <td className="p-4">
                      <span className="font-semibold text-slate-800">{app.procedureType}</span>
                      {app.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">{app.notes}</p>
                      )}
                    </td>

                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700 border border-slate-200">
                        Cadeira {app.chairNumber}
                      </span>
                    </td>

                    <td className="p-4">
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer ${getStatusColor(
                          app.status
                        )}`}
                      >
                        <option value="AGENDADO">Agendado</option>
                        <option value="CONFIRMADO">Confirmado</option>
                        <option value="EM_ESPERA">Em Espera</option>
                        <option value="EM_ATENDIMENTO">Em Atendimento</option>
                        <option value="CONCLUIDO">Concluído</option>
                        <option value="FALTA">Falta</option>
                        <option value="CANCELADO">Cancelado</option>
                      </select>
                    </td>

                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {/* WhatsApp reminder button */}
                        <button
                          type="button"
                          onClick={() => handleSendWhatsAppReminder(app)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Enviar lembrete via WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>

                        <Link
                          href={`/pacientes/${app.patientId}`}
                          className="px-2.5 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg text-xs font-semibold border border-teal-200"
                        >
                          Prontuário
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Novo Agendamento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900">Agendar Consulta</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Paciente</label>
                <select
                  required
                  value={modalPatientId}
                  onChange={(e) => setModalPatientId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="">Selecione o paciente...</option>
                  {patientsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dentista</label>
                  <select
                    required
                    value={modalDentistId}
                    onChange={(e) => setModalDentistId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="">Selecione o dentista...</option>
                    {dentistsList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cadeira</label>
                  <select
                    value={modalChair}
                    onChange={(e) => setModalChair(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="1">Cadeira 01 (Principal)</option>
                    <option value="2">Cadeira 02 (Ortodontia)</option>
                    <option value="3">Cadeira 03 (Cirurgia)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Horário de Início</label>
                  <input
                    type="time"
                    required
                    value={modalTime}
                    onChange={(e) => setModalTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duração (minutos)</label>
                  <select
                    value={modalDuration}
                    onChange={(e) => setModalDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="15">15 minutos</option>
                    <option value="30">30 minutos</option>
                    <option value="45">45 minutos</option>
                    <option value="60">1 hora</option>
                    <option value="90">1 hora e 30 min</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Procedimento / Motivo</label>
                <input
                  type="text"
                  required
                  value={modalProcedure}
                  onChange={(e) => setModalProcedure(e.target.value)}
                  placeholder="Ex: Restauração, Avaliação, Endodontia..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observações Clínicas</label>
                <textarea
                  rows={2}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Anotações para a recepcionista ou dentista..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 shadow-xs"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
