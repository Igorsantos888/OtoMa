'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  CheckCircle2,
  AlertCircle,
  Calendar,
  X,
  Building,
} from 'lucide-react';

interface FinancialItem {
  id: string;
  type: 'RECEBER' | 'PAGAR';
  category: string;
  description: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: string;
  paymentMethod?: string;
  patient?: { name: string };
  supplier?: string;
}

export default function FinanceiroPage() {
  const [accounts, setAccounts] = useState<FinancialItem[]>([]);
  const [metrics, setMetrics] = useState<any>({
    totalRecebido: 0,
    aReceberPendente: 0,
    totalPago: 0,
    aPagarPendente: 0,
    saldoAtual: 0,
  });
  const [typeFilter, setTypeFilter] = useState<'all' | 'RECEBER' | 'PAGAR'>('all');
  const [loading, setLoading] = useState(true);

  // Modal Novo Lançamento
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newType, setNewType] = useState<'RECEBER' | 'PAGAR'>('RECEBER');
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('Tratamento Clínico');
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newMethod, setNewMethod] = useState('PIX');
  const [newSupplier, setNewSupplier] = useState('');

  const fetchFinanceiro = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/financeiro?type=${typeFilter}`);
      const data = await res.json();
      setAccounts(data.accounts || []);
      if (data.metrics) setMetrics(data.metrics);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceiro();
  }, [typeFilter]);

  const handleMarkAsPaid = async (id: string) => {
    try {
      await fetch('/api/financeiro', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'PAGO' }),
      });
      fetchFinanceiro();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/financeiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newType,
          description: newDesc,
          amount: newAmount,
          category: newCategory,
          dueDate: newDueDate,
          paymentMethod: newMethod,
          supplier: newSupplier || null,
        }),
      });
      setIsModalOpen(false);
      setNewDesc('');
      setNewAmount('');
      fetchFinanceiro();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Gestão Financeira & Fluxo de Caixa</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Controle de contas a pagar, receber, convênios e conciliação da clínica
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Lançamento Financeiro</span>
        </button>
      </div>

      {/* Cards de Métricas Financeiras */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Recebido</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
              metrics.totalRecebido
            )}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            A receber pendente:{' '}
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
              metrics.aReceberPendente
            )}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Pago</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <h3 className="text-2xl font-black text-rose-600 mt-1">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
              metrics.totalPago
            )}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            A pagar pendente:{' '}
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
              metrics.aPagarPendente
            )}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Saldo Realizado</span>
            <DollarSign className="w-4 h-4 text-teal-600" />
          </div>
          <h3
            className={`text-2xl font-black mt-1 ${
              metrics.saldoAtual >= 0 ? 'text-teal-700' : 'text-rose-600'
            }`}
          >
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
              metrics.saldoAtual
            )}
          </h3>
          <p className="text-[11px] text-teal-600 font-medium mt-1">Caixa líquido apurado</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Convênios Ativos</span>
            <Building className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-1">5 Operadoras</h3>
          <p className="text-[11px] text-blue-600 font-medium mt-1">Uniodonto, Amil, Bradesco...</p>
        </div>
      </div>

      {/* Tabela de Lançamentos com Filtro */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos os Lançamentos
            </button>
            <button
              onClick={() => setTypeFilter('RECEBER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === 'RECEBER'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Contas a Receber
            </button>
            <button
              onClick={() => setTypeFilter('PAGAR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === 'PAGAR'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Contas a Pagar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b">
              <tr>
                <th className="p-4">Tipo</th>
                <th className="p-4">Descrição</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Vencimento</th>
                <th className="p-4">Forma</th>
                <th className="p-4">Valor</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        acc.type === 'RECEBER'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {acc.type === 'RECEBER' ? 'Receber' : 'Pagar'}
                    </span>
                  </td>

                  <td className="p-4 font-bold text-slate-900">
                    {acc.description}
                    {acc.patient && (
                      <span className="block text-[11px] text-slate-500 font-normal">
                        Paciente: {acc.patient.name}
                      </span>
                    )}
                    {acc.supplier && (
                      <span className="block text-[11px] text-slate-500 font-normal">
                        Fornecedor: {acc.supplier}
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-slate-600">{acc.category}</td>

                  <td className="p-4 font-medium text-slate-700">{acc.dueDate}</td>

                  <td className="p-4 font-semibold text-slate-600">
                    {acc.paymentMethod || 'A definir'}
                  </td>

                  <td className="p-4 font-black text-slate-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      acc.amount
                    )}
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        acc.status === 'PAGO'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {acc.status}
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    {acc.status !== 'PAGO' && (
                      <button
                        onClick={() => handleMarkAsPaid(acc.id)}
                        className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-bold transition-colors"
                      >
                        Baixar (Pago)
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Lançamento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">Novo Lançamento Financeiro</h3>
            <form onSubmit={handleCreateEntry} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de Operação</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType('RECEBER')}
                    className={`py-2 rounded-lg font-bold border ${
                      newType === 'RECEBER'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    Conta a Receber
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('PAGAR')}
                    className={`py-2 rounded-lg font-bold border ${
                      newType === 'PAGAR'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    Conta a Pagar
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Ex: Pagamento Fornecedor Dental Cremer..."
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-3 py-2 border rounded-lg text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vencimento</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Forma de Pagamento</label>
                  <select
                    value={newMethod}
                    onChange={(e) => setNewMethod(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                  >
                    <option value="PIX">PIX</option>
                    <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                    <option value="CARTAO_DEBITO">Cartão de Débito</option>
                    <option value="BOLETO">Boleto Bancário</option>
                    <option value="DINHEIRO">Dinheiro</option>
                    <option value="CONVENIO">Convênio</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoria</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Ex: Laboratório, Dental..."
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
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
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
