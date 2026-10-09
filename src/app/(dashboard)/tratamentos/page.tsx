import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { FileText, CheckCircle2, Clock, AlertCircle, ChevronRight } from 'lucide-react';

export default async function TratamentosPage() {
  const plans = await prisma.treatmentPlan.findMany({
    include: {
      patient: true,
      procedures: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Planos de Tratamento & Orçamentos</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhamento de propostas clínicas apresentadas e tratamentos em andamento
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total de Planos</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{plans.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Planos Aprovados</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {plans.filter((p) => p.status === 'APROVADO').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Em Elaboração</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {plans.filter((p) => p.status === 'EM_ELABORACAO').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b">
              <tr>
                <th className="p-4">Proposta / Título</th>
                <th className="p-4">Paciente</th>
                <th className="p-4">Procedimentos</th>
                <th className="p-4">Valor Total</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plans.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-600" />
                      <span>{p.title}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block ml-6">
                      {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-slate-800">
                    <Link
                      href={`/pacientes/${p.patientId}`}
                      className="hover:text-teal-600 transition-colors"
                    >
                      {p.patient.name}
                    </Link>
                  </td>
                  <td className="p-4 text-slate-600">
                    {p.procedures.length} procedimento(s)
                  </td>
                  <td className="p-4 font-black text-slate-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      p.finalAmount
                    )}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                        p.status === 'APROVADO'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/pacientes/${p.patientId}`}
                      className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-bold"
                    >
                      <span>Abrir no Prontuário</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
