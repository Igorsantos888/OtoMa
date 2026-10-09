'use client';

import React, { useState, useEffect } from 'react';
import { Award, DollarSign, UserCheck, Plus, CheckCircle2 } from 'lucide-react';

export default function ComissoesPage() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [dentists, setDentists] = useState<any[]>([]);
  const [selectedDentist, setSelectedDentist] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Modal Lançar Comissão
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDentistId, setModalDentistId] = useState('');
  const [modalProc, setModalProc] = useState('Instalação de Implante Dentário');
  const [modalTotal, setModalTotal] = useState('1800');
  const [modalRate, setModalRate] = useState('40');

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comissoes?dentistId=${selectedDentist}`);
      const data = await res.json();
      setCommissions(data.commissions || []);
      setDentists(data.dentists || []);
      if (data.dentists?.length > 0 && !modalDentistId) {
        setModalDentistId(data.dentists[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, [selectedDentist]);

  const handleCreateCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/comissoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dentistId: modalDentistId,
          procedureName: modalProc,
          totalValue: modalTotal,
          commissionRate: modalRate,
        }),
      });
      setIsModalOpen(false);
      fetchCommissions();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePayCommission = async (id: string) => {
    try {
      await fetch('/api/comissoes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'PAGO' }),
      });
      fetchCommissions();
    } catch (e) {
      console.error(e);
    }
  };

  const totalComissoes = commissions.reduce((s, c) => s + c.commissionValue, 0);
  const totalPago = commissions.filter((c) => c.status === 'PAGO').reduce((s, c) => s + c.commissionValue, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Comissões dos Dentistas</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cálculo automatizado de repasses sobre procedimentos executados
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Lançar Nova Comissão</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total de Comissões</span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalComissoes)}
          </h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Repasse Efetuado</span>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPago)}
          </h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">A Pagar aos Dentistas</span>
          <h3 className="text-2xl font-black text-amber-600 mt-1">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
              totalComissoes - totalPago
            )}
          </h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Filtrar por Dentista:</span>
            <select
              value={selectedDentist}
              onChange={(e) => setSelectedDentist(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium bg-white"
            >
              <option value="ALL">Todos os Dentistas</option>
              {dentists.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.cro})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b">
              <tr>
                <th className="p-4">Dentista</th>
                <th className="p-4">Procedimento</th>
                <th className="p-4">Valor Bruto</th>
                <th className="p-4">Taxa (%)</th>
                <th className="p-4">Comissão Líquida</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {commissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Nenhuma comissão registrada para este filtro.
                  </td>
                </tr>
              ) : (
                commissions.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">
                      {c.dentist.name}
                      <span className="block text-[11px] text-slate-500 font-normal">
                        {c.dentist.cro}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-700">{c.procedureName}</td>
                    <td className="p-4 text-slate-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        c.totalValue
                      )}
                    </td>
                    <td className="p-4 font-bold text-teal-700">{c.commissionRate}%</td>
                    <td className="p-4 font-black text-slate-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        c.commissionValue
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          c.status === 'PAGO'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {c.status !== 'PAGO' && (
                        <button
                          onClick={() => handlePayCommission(c.id)}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-bold"
                        >
                          Pagar Repasse
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Lançar Comissão */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">Lançar Comissão de Profissional</h3>
            <form onSubmit={handleCreateCommission} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Dentista</label>
                <select
                  value={modalDentistId}
                  onChange={(e) => setModalDentistId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  {dentists.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.cro})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Procedimento</label>
                <input
                  type="text"
                  required
                  value={modalProc}
                  onChange={(e) => setModalProc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valor do Procedimento (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={modalTotal}
                    onChange={(e) => setModalTotal(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Percentual de Repasse (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={modalRate}
                    onChange={(e) => setModalRate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-900 text-xs">
                Valor estimado a repassar:{' '}
                <b>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    ((Number(modalTotal) || 0) * (Number(modalRate) || 0)) / 100
                  )}
                </b>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700"
                >
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
