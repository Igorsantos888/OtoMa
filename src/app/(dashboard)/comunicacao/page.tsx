'use client';

import React, { useState } from 'react';
import { MessageSquare, Send, CheckCircle2, Phone, Sparkles } from 'lucide-react';

export default function ComunicacaoPage() {
  const [templateType, setTemplateType] = useState('LEMBRETE_CONSULTA');
  const [patientName, setPatientName] = useState('Camila Fernandes');
  const [patientPhone, setPatientPhone] = useState('11998765432');
  const [date, setDate] = useState('18/09/2026');
  const [time, setTime] = useState('09:00');
  const [dentistName, setDentistName] = useState('Dr. Lucas Carvalho');

  const templates: Record<string, string> = {
    LEMBRETE_CONSULTA: `Olá, ${patientName}! Lembramos da sua consulta com ${dentistName} agendada para ${date} às ${time}. Responda SIM para confirmar sua presença. Clínica OdontoSys.`,
    RETORNO_PREVENTIVO: `Olá, ${patientName}! Já se passaram 6 meses desde o seu último check-up odontológico na OdontoSys. A prevenção é o segredo de um sorriso saudável. Gostaria de agendar sua limpeza preventiva esta semana?`,
    ANIVERSARIO: `Parabéns, ${patientName}! 🎉 A equipe da Clínica OdontoSys deseja a você muitas felicidades, saúde e muitos motivos para sorrir no seu aniversário!`,
    POS_OPERATORIO: `Olá, ${patientName}! Como você está se sentindo após o procedimento de hoje? Lembre-se de seguir as orientações de repouso, aplicar gelo e tomar os medicamentos prescritos. Em caso de dúvidas, estamos à disposição.`,
  };

  const currentMessage = templates[templateType] || '';

  const handleSendWhatsApp = () => {
    const cleanPhone = patientPhone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(currentMessage)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900">Comunicação com Pacientes & Lembretes</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Disparo de confirmações de consultas, retorno preventivo semestral e mensagens pós-operatórias
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Templates Rápidos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Modelos de Mensagem (Templates)</h3>
          <div className="space-y-2 text-xs font-semibold">
            {[
              { id: 'LEMBRETE_CONSULTA', label: '📅 Lembrete de Consulta / Confirmação' },
              { id: 'RETORNO_PREVENTIVO', label: '🦷 Retorno Preventivo (6 Meses)' },
              { id: 'POS_OPERATORIO', label: '🩺 Acompanhamento Pós-Operatório' },
              { id: 'ANIVERSARIO', label: '🎉 Parabéns de Aniversário' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplateType(t.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  templateType === t.id
                    ? 'bg-teal-50 border-teal-300 text-teal-800 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Editor de Parâmetros e Pré-visualização */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Personalização e Disparo</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nome do Paciente</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">WhatsApp (com DDD)</label>
              <input
                type="text"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Data</label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Horário</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mensagem Final Gerada:
            </label>
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 text-slate-800 text-xs leading-relaxed whitespace-pre-line font-sans">
              {currentMessage}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSendWhatsApp}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Abrir no WhatsApp e Disparar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
