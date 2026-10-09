'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import InteractiveOdontogram, { OdontoItem } from '@/components/odontograma/InteractiveOdontogram';
import DigitalSignatureModal from '@/components/signature/DigitalSignatureModal';
import {
  ArrowLeft,
  User,
  AlertTriangle,
  Heart,
  Phone,
  Mail,
  Calendar,
  FileText,
  Activity,
  DollarSign,
  PenTool,
  CheckCircle2,
  Plus,
  Printer,
  Shield,
  Clock,
} from 'lucide-react';

export default function PatientChartPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'odontograma' | 'anamnese' | 'evolucao' | 'orcamentos' | 'documentos' | 'financeiro'
  >('odontograma');

  // Modal Assinatura Digital
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signTargetType, setSignTargetType] = useState<'DOCUMENT' | 'EVOLUTION'>('DOCUMENT');
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);

  // Modal Nova Evolução Clínica
  const [isEvolModalOpen, setIsEvolModalOpen] = useState(false);
  const [evolTooth, setEvolTooth] = useState('');
  const [evolProcedure, setEvolProcedure] = useState('');
  const [evolObservations, setEvolObservations] = useState('');

  // Modal Novo Orçamento
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planTitle, setPlanTitle] = useState('Tratamento Reabilitador Oral');
  const [planProcedures, setPlanProcedures] = useState([
    { toothNumber: '16', procedureName: 'Implante Cone Morse + Coroa', cost: 1800 },
    { toothNumber: '46', procedureName: 'Restauração Resina Oclusal', cost: 250 },
  ]);
  const [planDiscount, setPlanDiscount] = useState('150');
  const [planTerms, setPlanTerms] = useState('3x de R$ 633,33 no cartão');

  // Modal Novo Documento (TCLE / Receita)
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docType, setDocType] = useState('TERMO_CONSENTIMENTO');
  const [docTitle, setDocTitle] = useState('Termo de Consentimento - Procedimento Cirúrgico');
  const [docContent, setDocContent] = useState(
    'Eu, devidamente esclarecido(a) pelo cirurgião-dentista quanto aos riscos, benefícios e alternativas do procedimento proposto, autorizo a realização do tratamento odontológico conforme plano acordado.'
  );

  const fetchPatientData = async () => {
    try {
      const res = await fetch(`/api/patients/${patientId}`);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setPatient(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) fetchPatientData();
  }, [patientId]);

  // Salvar Nova Evolução Clínica
  const handleCreateEvolution = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/clinical-evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          toothInvolved: evolTooth || null,
          procedureDone: evolProcedure,
          observations: evolObservations,
        }),
      });
      setIsEvolModalOpen(false);
      setEvolProcedure('');
      setEvolObservations('');
      fetchPatientData();
    } catch (e) {
      console.error(e);
    }
  };

  // Salvar Novo Orçamento
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/treatment-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          title: planTitle,
          procedures: planProcedures,
          discountAmount: Number(planDiscount) || 0,
          paymentTerms: planTerms,
        }),
      });
      setIsPlanModalOpen(false);
      fetchPatientData();
    } catch (e) {
      console.error(e);
    }
  };

  // Aprovar Orçamento
  const handleApprovePlan = async (planId: string) => {
    try {
      await fetch('/api/treatment-plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: planId, status: 'APROVADO' }),
      });
      fetchPatientData();
    } catch (e) {
      console.error(e);
    }
  };

  // Salvar Novo Documento
  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          type: docType,
          title: docTitle,
          content: docContent,
        }),
      });
      setIsDocModalOpen(false);
      fetchPatientData();
    } catch (e) {
      console.error(e);
    }
  };

  // Registrar Assinatura Digital no Documento
  const handleSaveSignature = async (base64: string) => {
    if (!activeDocumentId) return;
    try {
      await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          type: 'TERMO_ASSINADO',
          title: 'Documento Assinado Digitalmente',
          content: 'Assinado pelo paciente via Canvas OdontoSys',
          patientSignature: base64,
        }),
      });
      fetchPatientData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Carregando prontuário...</div>;
  }

  if (!patient) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-700 font-bold">Paciente não encontrado.</p>
        <Link href="/pacientes" className="text-teal-600 text-xs font-semibold mt-2 inline-block">
          ← Voltar para lista
        </Link>
      </div>
    );
  }

  const anamnese = patient.anamnese;
  const hasMedicalAlerts =
    anamnese?.hasAllergies ||
    anamnese?.hasHypertension ||
    anamnese?.hasDiabetes ||
    anamnese?.hasHeartCondition;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between no-print">
        <Link
          href="/pacientes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Lista de Pacientes</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Imprimir Ficha</span>
          </button>
        </div>
      </div>

      {/* Cartão de Identificação do Paciente */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{patient.name}</h1>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-xs font-bold text-slate-600">
                  #{patient.code}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  {patient.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                <span><b>CPF:</b> {patient.cpf || 'Não informado'}</span>
                <span>•</span>
                <span><b>Telefone:</b> {patient.phone}</span>
                <span>•</span>
                <span><b>Convênio:</b> {patient.insuranceName || 'Particular'}</span>
              </p>
            </div>
          </div>

          {/* Quick stats / actions */}
          <div className="flex items-center gap-3 text-xs">
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                Cadastrado em
              </span>
              <span className="font-bold text-slate-700">
                {new Date(patient.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        {/* ALERTA MÉDICO DE ALTO CONTRASTE SE HOUVER ALERGIAS OU CONDIÇÕES */}
        {hasMedicalAlerts && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-950 flex items-start gap-3 animate-in fade-in duration-200">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-rose-800">
                ⚠️ ALERTA MÉDICO CLÍNICO CRÍTICO
              </h4>
              <div className="mt-1 text-xs space-y-0.5 font-semibold text-rose-900">
                {anamnese?.hasAllergies && (
                  <p>
                    • <b>ALERGIA MEDICAMENTOSA:</b> {anamnese.allergiesDetails || 'Identificada em anamnese'}
                  </p>
                )}
                {anamnese?.hasHypertension && <p>• Paciente Hipertenso (Aferir PA antes de procedimentos)</p>}
                {anamnese?.hasDiabetes && <p>• Paciente Diabético (Atenção a cicatrização e anestésicos)</p>}
                {anamnese?.hasHeartCondition && <p>• Condição Cardíaca pré-existente</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navegação por Abas do Prontuário */}
      <div className="border-b border-slate-200 flex gap-2 overflow-x-auto no-print">
        {[
          { id: 'odontograma', label: 'Odontograma 2D', icon: Activity },
          { id: 'anamnese', label: 'Anamnese Médica', icon: Heart },
          { id: 'evolucao', label: 'Evolução Clínica & Histórico', icon: Clock },
          { id: 'orcamentos', label: 'Planos & Orçamentos', icon: FileText },
          { id: 'documentos', label: 'Termos & Assinatura Digital', icon: PenTool },
          { id: 'financeiro', label: 'Extrato Financeiro', icon: DollarSign },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-teal-600 text-teal-700 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo das Abas */}
      <div className="min-h-[400px]">
        {/* ABA 1: Odontograma Interativo */}
        {activeTab === 'odontograma' && (
          <InteractiveOdontogram
            patientId={patient.id}
            initialItems={patient.odontogramItems || []}
            onSave={() => fetchPatientData()}
          />
        )}

        {/* ABA 2: Anamnese Médica Detalhada */}
        {activeTab === 'anamnese' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Ficha de Anamnese Odontológica</h3>
                <p className="text-xs text-slate-500">Histórico de saúde sistêmica e bucal do paciente</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Doenças Sistêmicas & Alergias
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="font-medium text-slate-600">Alergias Medicamentosas:</span>
                    <span className={`font-bold ${anamnese?.hasAllergies ? 'text-rose-600' : 'text-slate-800'}`}>
                      {anamnese?.hasAllergies ? anamnese.allergiesDetails : 'Não'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="font-medium text-slate-600">Hipertensão Arterial:</span>
                    <span className="font-bold text-slate-800">
                      {anamnese?.hasHypertension ? 'Sim' : 'Não'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="font-medium text-slate-600">Diabetes Mellitus:</span>
                    <span className="font-bold text-slate-800">
                      {anamnese?.hasDiabetes ? 'Sim' : 'Não'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="font-medium text-slate-600">Distúrbios Hemorrágicos:</span>
                    <span className="font-bold text-slate-800">
                      {anamnese?.hasBleedingProblems ? 'Sim' : 'Não'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Medicamentos & Histórico Cirúrgico
                </h4>
                <div>
                  <span className="font-medium text-slate-600 block mb-1">Medicamentos em uso:</span>
                  <p className="p-2.5 bg-white rounded-lg border border-slate-200 font-semibold text-slate-800">
                    {anamnese?.currentMedications || 'Nenhum medicamento informado'}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-slate-600 block mb-1">Queixa Principal do Paciente:</span>
                  <p className="p-2.5 bg-white rounded-lg border border-slate-200 font-semibold text-slate-800">
                    {anamnese?.chiefComplaint || 'Sem queixa registrada'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: Evolução Clínica & Histórico */}
        {activeTab === 'evolucao' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Evolução Clínica e Diário de Bordo</h3>
                <p className="text-xs text-slate-500">Histórico de cada ato odontológico realizado</p>
              </div>

              <button
                onClick={() => setIsEvolModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Nova Evolução</span>
              </button>
            </div>

            <div className="space-y-4">
              {patient.clinicalEvolutions?.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  Nenhuma evolução clínica registrada ainda.
                </p>
              ) : (
                patient.clinicalEvolutions?.map((ev: any) => (
                  <div
                    key={ev.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {new Date(ev.date).toLocaleDateString('pt-BR')}
                        </span>
                        {ev.toothInvolved && (
                          <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold text-[10px]">
                            Dente {ev.toothInvolved}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Profissional: <b>{ev.dentist?.name}</b> ({ev.dentist?.cro || 'CRO Ativo'})
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-800">{ev.procedureDone}</p>
                    {ev.observations && (
                      <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                        {ev.observations}
                      </p>
                    )}

                    <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Assinado digitalmente por {ev.dentist?.name}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ABA 4: Planos de Tratamento & Orçamentos */}
        {activeTab === 'orcamentos' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Orçamentos & Planos de Tratamento</h3>
                <p className="text-xs text-slate-500">Propostas comerciais, aprovação e procedimentos</p>
              </div>

              <button
                onClick={() => setIsPlanModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Orçamento</span>
              </button>
            </div>

            <div className="space-y-4">
              {patient.treatmentPlans?.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">Nenhum orçamento cadastrado.</p>
              ) : (
                patient.treatmentPlans?.map((plan: any) => (
                  <div
                    key={plan.id}
                    className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{plan.title}</h4>
                        <p className="text-xs text-slate-500">
                          Criado em {new Date(plan.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            plan.status === 'APROVADO'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {plan.status}
                        </span>

                        {plan.status !== 'APROVADO' && (
                          <button
                            onClick={() => handleApprovePlan(plan.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs"
                          >
                            Aprovar Orçamento
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Procedimentos inclusos */}
                    <div className="border border-slate-100 rounded-lg overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px]">
                          <tr>
                            <th className="p-2.5">Dente</th>
                            <th className="p-2.5">Procedimento</th>
                            <th className="p-2.5">Categoria</th>
                            <th className="p-2.5 text-right">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {plan.procedures?.map((proc: any) => (
                            <tr key={proc.id}>
                              <td className="p-2.5 font-bold text-slate-700">
                                {proc.toothNumber ? `Dente ${proc.toothNumber}` : 'Geral'}
                              </td>
                              <td className="p-2.5 font-medium text-slate-900">
                                {proc.procedureName}
                              </td>
                              <td className="p-2.5 text-slate-500">{proc.category}</td>
                              <td className="p-2.5 text-right font-bold text-slate-800">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(proc.cost)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Totais e Condições de Pagamento */}
                    <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500 block">Condições de Pagamento:</span>
                        <span className="font-semibold text-slate-800">{plan.paymentTerms}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-slate-400 block line-through text-[11px]">
                          Subtotal:{' '}
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(plan.totalAmount)}
                        </span>
                        <span className="text-sm font-black text-teal-700">
                          Total Final:{' '}
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(plan.finalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ABA 5: Documentos, TCLE & Assinatura Digital */}
        {activeTab === 'documentos' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Termos, Contratos & Assinatura Digital</h3>
                <p className="text-xs text-slate-500">Documentos clínicos com validade legal e assinatura eletrônica</p>
              </div>

              <button
                onClick={() => setIsDocModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Emitir Novo Termo / Contrato</span>
              </button>
            </div>

            <div className="space-y-4">
              {patient.documents?.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Nenhum documento emitido para este paciente ainda.
                </div>
              ) : (
                patient.documents?.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-teal-600" />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{doc.title}</h4>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            {doc.type} • Emitido em {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!doc.patientSignature ? (
                          <button
                            onClick={() => {
                              setActiveDocumentId(doc.id);
                              setIsSignModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-2xs"
                          >
                            <PenTool className="w-3.5 h-3.5" />
                            <span>Coletar Assinatura do Paciente</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            Documento Assinado
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/60 whitespace-pre-line">
                      {doc.content}
                    </p>

                    {/* Exibição da assinatura capturada no Canvas se houver */}
                    {doc.patientSignature && (
                      <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                            Assinatura do Paciente:
                          </span>
                          <img
                            src={doc.patientSignature}
                            alt="Assinatura Digital"
                            className="h-14 border border-slate-300 rounded bg-white p-1 mt-1 shadow-2xs"
                          />
                        </div>
                        <span className="text-slate-400 text-[11px]">
                          Assinado em {new Date(doc.signedAt || doc.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ABA 6: Extrato Financeiro */}
        {activeTab === 'financeiro' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-900 border-b pb-3">
              Lançamentos Financeiros do Paciente
            </h3>

            <div className="space-y-2 text-xs">
              {patient.financialAccounts?.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  Nenhum lançamento financeiro para este paciente.
                </p>
              ) : (
                patient.financialAccounts?.map((f: any) => (
                  <div
                    key={f.id}
                    className="p-4 rounded-xl border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{f.description}</p>
                      <span className="text-slate-500 text-[11px]">
                        Vencimento: {f.dueDate} • Forma: {f.paymentMethod || 'A definir'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-sm text-slate-900 block">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                          f.amount
                        )}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          f.status === 'PAGO'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {f.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Assinatura Digital em Canvas */}
      <DigitalSignatureModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        signerName={patient.name}
        onSave={handleSaveSignature}
      />

      {/* Modal Nova Evolução Clínica */}
      {isEvolModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">Registrar Ato Clínico</h3>
            <form onSubmit={handleCreateEvolution} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Dente Envolvido (Opcional)</label>
                <input
                  type="text"
                  value={evolTooth}
                  onChange={(e) => setEvolTooth(e.target.value)}
                  placeholder="Ex: 46, 21 ou Geral"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Procedimento Realizado *</label>
                <input
                  type="text"
                  required
                  value={evolProcedure}
                  onChange={(e) => setEvolProcedure(e.target.value)}
                  placeholder="Ex: Restauração Resina Fotopolimerizável Face Oclusal..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observações e Recomendações</label>
                <textarea
                  rows={3}
                  value={evolObservations}
                  onChange={(e) => setEvolObservations(e.target.value)}
                  placeholder="Anotações de anestésico utilizado, isolamento, recomendações pós-operatórias..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsEvolModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 shadow-xs"
                >
                  Salvar e Assinar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Orçamento */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">Novo Orçamento Odontológico</h3>
            <form onSubmit={handleCreatePlan} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Título da Proposta</label>
                <input
                  type="text"
                  required
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Desconto Concedido (R$)</label>
                <input
                  type="number"
                  value={planDiscount}
                  onChange={(e) => setPlanDiscount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Forma e Parcelamento</label>
                <input
                  type="text"
                  value={planTerms}
                  onChange={(e) => setPlanTerms(e.target.value)}
                  placeholder="Ex: 3x no cartão, à vista com 5%..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700"
                >
                  Gerar Orçamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Documento / Termo */}
      {isDocModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">Emitir Termo / Documento</h3>
            <form onSubmit={handleCreateDocument} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de Documento</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="TERMO_CONSENTIMENTO">Termo de Consentimento Livre e Esclarecido (TCLE)</option>
                  <option value="CONTRATO">Contrato de Prestação de Serviços Odontológicos</option>
                  <option value="ATESTADO">Atestado Odontológico</option>
                  <option value="RECEITA">Receituário de Medicamentos</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Título</label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Texto do Documento</label>
                <textarea
                  rows={4}
                  required
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700"
                >
                  Salvar Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
