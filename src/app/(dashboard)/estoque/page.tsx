'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  AlertTriangle,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  Search,
  X,
  CheckCircle2,
} from 'lucide-react';

interface StockItem {
  id: string;
  name: string;
  category: string;
  sku?: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  costPrice: number;
  supplier?: string;
  batchNumber?: string;
  expirationDate?: string;
}

export default function EstoquePage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Movimentação (Entrada/Saída)
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [moveType, setMoveType] = useState<'ENTRADA' | 'SAIDA'>('SAIDA');
  const [moveQty, setMoveQty] = useState('1');
  const [moveReason, setMoveReason] = useState('Uso em atendimento de paciente');

  // Modal Novo Produto
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState('Resinas');
  const [newQty, setNewQty] = useState('10');
  const [newMinQty, setNewMinQty] = useState('5');
  const [newUnit, setNewUnit] = useState('UN');
  const [newPrice, setNewPrice] = useState('0');
  const [newSupplier, setNewSupplier] = useState('Dental Cremer');
  const [newBatch, setNewBatch] = useState('');
  const [newExp, setNewExp] = useState('');

  const fetchStock = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/estoque');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const handleMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/estoque', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: selectedItemId,
          movementType: moveType,
          quantity: moveQty,
          reason: moveReason,
        }),
      });
      setIsMoveModalOpen(false);
      fetchStock();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/estoque', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          category: newCat,
          quantity: newQty,
          minQuantity: newMinQty,
          unit: newUnit,
          costPrice: newPrice,
          supplier: newSupplier,
          batchNumber: newBatch,
          expirationDate: newExp || null,
        }),
      });
      setIsNewModalOpen(false);
      fetchStock();
    } catch (e) {
      console.error(e);
    }
  };

  const criticalItems = items.filter((i) => i.quantity <= i.minQuantity);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Estoque de Materiais & Insumos</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Controle de consumo, alertas de validade e ponto de pedido mínimo
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Insumo</span>
        </button>
      </div>

      {/* Alerta de Estoque Baixo se houver */}
      {criticalItems.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Atenção: {criticalItems.length} insumo(s) abaixo do nível mínimo de segurança!
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Providencie nova compra com os fornecedores para evitar interrupção de atendimentos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Insumos */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b">
              <tr>
                <th className="p-4">Material / Insumo</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Estoque Atual</th>
                <th className="p-4">Estoque Mínimo</th>
                <th className="p-4">Lote & Validade</th>
                <th className="p-4">Fornecedor</th>
                <th className="p-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((it) => {
                const isLow = it.quantity <= it.minQuantity;
                return (
                  <tr key={it.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-teal-600" />
                        <span>{it.name}</span>
                      </div>
                      {it.sku && <span className="text-[10px] text-slate-400 block ml-6">SKU: {it.sku}</span>}
                    </td>

                    <td className="p-4 text-slate-600">{it.category}</td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-xs border ${
                          isLow
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {it.quantity} {it.unit}
                      </span>
                    </td>

                    <td className="p-4 font-semibold text-slate-500">
                      {it.minQuantity} {it.unit}
                    </td>

                    <td className="p-4 text-slate-600">
                      <span className="block font-medium">Lote: {it.batchNumber || 'N/A'}</span>
                      <span className="text-[11px] text-slate-400">
                        Validade: {it.expirationDate || 'N/A'}
                      </span>
                    </td>

                    <td className="p-4 text-slate-700 font-medium">
                      {it.supplier || 'N/A'}
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedItemId(it.id);
                          setIsMoveModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                      >
                        Movimentar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Movimentação */}
      {isMoveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">Movimentar Estoque</h3>
            <form onSubmit={handleMovement} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de Movimento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMoveType('SAIDA')}
                    className={`py-2 rounded-lg font-bold border ${
                      moveType === 'SAIDA' ? 'bg-rose-600 text-white' : 'bg-slate-50'
                    }`}
                  >
                    Saída (Consumo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMoveType('ENTRADA')}
                    className={`py-2 rounded-lg font-bold border ${
                      moveType === 'ENTRADA' ? 'bg-emerald-600 text-white' : 'bg-slate-50'
                    }`}
                  >
                    Entrada (Compra)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={moveQty}
                  onChange={(e) => setMoveQty(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motivo / Destino</label>
                <input
                  type="text"
                  required
                  value={moveReason}
                  onChange={(e) => setMoveReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsMoveModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700"
                >
                  Confirmar Baixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Insumo */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">Cadastrar Material</h3>
            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome do Insumo *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Anestésico Mepivacaína 3%"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoria</label>
                  <input
                    type="text"
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unidade</label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                  >
                    <option value="UN">Unidade (UN)</option>
                    <option value="CX">Caixa (CX)</option>
                    <option value="PCT">Pacote (PCT)</option>
                    <option value="FRASCO">Frasco</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantidade Inicial</label>
                  <input
                    type="number"
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    value={newMinQty}
                    onChange={(e) => setNewMinQty(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Número do Lote</label>
                  <input
                    type="text"
                    value={newBatch}
                    onChange={(e) => setNewBatch(e.target.value)}
                    placeholder="LT-2024..."
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data de Validade</label>
                  <input
                    type="date"
                    value={newExp}
                    onChange={(e) => setNewExp(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700"
                >
                  Salvar Insumo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
