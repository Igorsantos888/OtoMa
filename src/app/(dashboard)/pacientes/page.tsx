'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  UserPlus,
  AlertTriangle,
  FileText,
  Phone,
  Mail,
  ChevronRight,
  ShieldAlert,
  X,
  CheckCircle2,
} from 'lucide-react';

interface Patient {
  id: string;
  code: number;
  name: string;
  cpf?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  insuranceName?: string;
  status: string;
  birthDate?: string;
  anamnese?: {
    hasAllergies: boolean;
    allergiesDetails?: string;
    hasHypertension: boolean;
    hasDiabetes: boolean;
    hasHeartCondition: boolean;
    chiefComplaint?: string;
  };
  appointments?: {
    date: string;
    procedureType: string;
  }[];
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal Novo Paciente
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('F');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [insuranceName, setInsuranceName] = useState('Particular');
  const [address, setAddress] = useState('');
  const [occupation, setOccupation] = useState('');

  // Anamnese no modal
  const [hasAllergies, setHasAllergies] = useState(false);
  const [allergiesDetails, setAllergiesDetails] = useState('');
  const [hasHypertension, setHasHypertension] = useState(false);
  const [hasDiabetes, setHasDiabetes] = useState(false);
  const [hasHeartCondition, setHasHeartCondition] = useState(false);
  const [currentMedications, setCurrentMedications] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/patients?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      setPatients(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search]);

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          cpf,
          rg,
          birthDate: birthDate || null,
          gender,
          phone,
          email,
          insuranceName,
          address,
          occupation,
          hasAllergies,
          allergiesDetails,
          hasHypertension,
          hasDiabetes,
          hasHeartCondition,
          currentMedications,
          chiefComplaint,
          emergencyContactName,
          emergencyContactPhone,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        // Reset form
        setName('');
        setCpf('');
        setPhone('');
        setEmail('');
        setHasAllergies(false);
        setAllergiesDetails('');
        fetchPatients();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Cadastro de Pacientes & Prontuários</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão unificada de fichas clínicas, anamneses e odontogramas
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Novo Paciente</span>
        </button>
      </div>

      {/* Busca e Estatísticas */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, CPF ou telefone..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="text-xs text-slate-500 font-semibold">
          Total de Pacientes: <b className="text-teal-700">{patients.length}</b>
        </div>
      </div>

      {/* Tabela de Pacientes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Carregando pacientes...</div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Nenhum paciente encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <th className="p-4">Cód.</th>
                  <th className="p-4">Paciente</th>
                  <th className="p-4">Contato</th>
                  <th className="p-4">Convênio</th>
                  <th className="p-4">Alertas Médicos</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((p) => {
                  const hasAlerts =
                    p.anamnese?.hasAllergies ||
                    p.anamnese?.hasHypertension ||
                    p.anamnese?.hasDiabetes ||
                    p.anamnese?.hasHeartCondition;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-600">
                        #{p.code}
                      </td>

                      <td className="p-4">
                        <Link
                          href={`/pacientes/${p.id}`}
                          className="font-bold text-slate-900 hover:text-teal-600 transition-colors text-sm block"
                        >
                          {p.name}
                        </Link>
                        {p.cpf && <span className="text-[11px] text-slate-400">CPF: {p.cpf}</span>}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-teal-600" />
                          <span>{p.phone}</span>
                        </div>
                        {p.email && (
                          <span className="text-[11px] text-slate-400 block">{p.email}</span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 font-semibold text-slate-700 border border-slate-200">
                          {p.insuranceName || 'Particular'}
                        </span>
                      </td>

                      <td className="p-4">
                        {hasAlerts ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {p.anamnese?.hasAllergies && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold border border-rose-200 text-[10px]"
                                title={p.anamnese.allergiesDetails || 'Alergia medicamentosa'}
                              >
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                Alergia
                              </span>
                            )}
                            {p.anamnese?.hasHypertension && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-medium text-[10px]">
                                Hipertensão
                              </span>
                            )}
                            {p.anamnese?.hasDiabetes && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-medium text-[10px]">
                                Diabetes
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-emerald-700 text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Sem restrições
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                          {p.status}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <Link
                          href={`/pacientes/${p.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs transition-colors shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Abrir Prontuário</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Novo Paciente com Ficha de Anamnese */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Novo Paciente</h3>
                <p className="text-xs text-slate-500">Dados pessoais e triagem inicial de anamnese</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="space-y-4 text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b pb-1">
                1. Dados Pessoais & Contato
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">CPF</label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data de Nascimento</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 98888-7777"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="paciente@email.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Convênio Odontológico</label>
                  <select
                    value={insuranceName}
                    onChange={(e) => setInsuranceName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="Particular">Particular</option>
                    <option value="Uniodonto">Uniodonto</option>
                    <option value="Amil Dental">Amil Dental</option>
                    <option value="Bradesco Dental">Bradesco Dental</option>
                    <option value="SulAmérica Odonto">SulAmérica Odonto</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Endereço Residencial</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rua, número, bairro..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b pb-1 pt-2">
                2. Triagem de Anamnese Médica
              </h4>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasAllergies}
                      onChange={(e) => setHasAllergies(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded"
                    />
                    <span className="font-bold text-rose-700">Tem Alergia Medicamentosa?</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasHypertension}
                      onChange={(e) => setHasHypertension(e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded"
                    />
                    <span className="font-medium text-slate-700">Hipertensão</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasDiabetes}
                      onChange={(e) => setHasDiabetes(e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded"
                    />
                    <span className="font-medium text-slate-700">Diabetes</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasHeartCondition}
                      onChange={(e) => setHasHeartCondition(e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded"
                    />
                    <span className="font-medium text-slate-700">Problemas Cardíacos</span>
                  </label>
                </div>

                {hasAllergies && (
                  <div>
                    <label className="block font-bold text-rose-700 mb-1">
                      Descreva as Alergias (Ex: Penicilina, Dipirona, Látex):
                    </label>
                    <input
                      type="text"
                      required
                      value={allergiesDetails}
                      onChange={(e) => setAllergiesDetails(e.target.value)}
                      placeholder="Ex: Alergia grave à penicilina"
                      className="w-full px-3 py-1.5 border border-rose-300 bg-rose-50/50 rounded-lg text-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Medicamentos em Uso Contínuo:
                  </label>
                  <input
                    type="text"
                    value={currentMedications}
                    onChange={(e) => setCurrentMedications(e.target.value)}
                    placeholder="Ex: Losartana 50mg, AAS..."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Queixa Principal / Motivo da Consulta:
                  </label>
                  <textarea
                    rows={2}
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    placeholder="Ex: Dor ao mastigar no dente molar..."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
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
                  Salvar e Criar Prontuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
