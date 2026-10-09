'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  Filter,
  Save,
  RotateCcw,
} from 'lucide-react';

export interface OdontoItem {
  id?: string;
  toothNumber: number;
  face: string; // 'V', 'L', 'M', 'D', 'O', 'GERAL'
  condition: string; // 'CARIE', 'RESTAURACAO_RESINA', 'RESTAURACAO_AMALGAMA', 'CANAL', 'IMPLANTE', 'PROTESE', 'COROA', 'EXTRACAO_INDICADA', 'EXTRACAO_REALIZADA', 'HIGIDO'
  stage: string; // 'INICIAL', 'PLANEJADO', 'EXECUTADO'
  notes?: string;
}

interface OdontogramProps {
  patientId: string;
  initialItems?: OdontoItem[];
  readOnly?: boolean;
  onSave?: (items: OdontoItem[]) => void;
}

const CONDITIONS_CONFIG: Record<
  string,
  { label: string; color: string; bgClass: string; borderClass: string; icon: string }
> = {
  HIGIDO: {
    label: 'Hígido (Saudável)',
    color: '#ffffff',
    bgClass: 'bg-white',
    borderClass: 'border-slate-300',
    icon: '🦷',
  },
  CARIE: {
    label: 'Cárie Ativa',
    color: '#ef4444',
    bgClass: 'bg-rose-500 text-white',
    borderClass: 'border-rose-600',
    icon: '🔴',
  },
  RESTAURACAO_RESINA: {
    label: 'Restauração Resina',
    color: '#38bdf8',
    bgClass: 'bg-sky-400 text-slate-900',
    borderClass: 'border-sky-500',
    icon: '🔵',
  },
  RESTAURACAO_AMALGAMA: {
    label: 'Restauração Amálgama',
    color: '#64748b',
    bgClass: 'bg-slate-600 text-white',
    borderClass: 'border-slate-700',
    icon: '⚫',
  },
  CANAL: {
    label: 'Tratamento Endodôntico (Canal)',
    color: '#f97316',
    bgClass: 'bg-orange-500 text-white',
    borderClass: 'border-orange-600',
    icon: '⚡',
  },
  IMPLANTE: {
    label: 'Implante Dentário',
    color: '#10b981',
    bgClass: 'bg-emerald-500 text-white',
    borderClass: 'border-emerald-600',
    icon: '🔩',
  },
  COROA: {
    label: 'Prótese / Coroa Total',
    color: '#eab308',
    bgClass: 'bg-amber-400 text-slate-900',
    borderClass: 'border-amber-500',
    icon: '👑',
  },
  EXTRACAO_INDICADA: {
    label: 'Exodontia Indicada',
    color: '#dc2626',
    bgClass: 'bg-red-600 text-white',
    borderClass: 'border-red-700',
    icon: '❌',
  },
  EXTRACAO_REALIZADA: {
    label: 'Elemento Ausente / Extraído',
    color: '#334155',
    bgClass: 'bg-slate-800 text-slate-400',
    borderClass: 'border-slate-900',
    icon: '➖',
  },
};

export default function InteractiveOdontogram({
  patientId,
  initialItems = [],
  readOnly = false,
  onSave,
}: OdontogramProps) {
  const [items, setItems] = useState<OdontoItem[]>(initialItems);
  const [archType, setArchType] = useState<'PERMANENTE' | 'DECIDUO'>('PERMANENTE');
  const [currentStage, setCurrentStage] = useState<'INICIAL' | 'PLANEJADO' | 'EXECUTADO'>('INICIAL');
  const [selectedTool, setSelectedTool] = useState<string>('CARIE');
  const [selectedToothForModal, setSelectedToothForModal] = useState<number | null>(null);
  const [selectedFaceForModal, setSelectedFaceForModal] = useState<string>('O');
  const [itemNotes, setItemNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Dentição Permanente (32 dentes)
  // Arcada Superior: Quadrante 1 (18-11) e Quadrante 2 (21-28)
  const upperPermanentQ1 = [18, 17, 16, 15, 14, 13, 12, 11];
  const upperPermanentQ2 = [21, 22, 23, 24, 25, 26, 27, 28];
  // Arcada Inferior: Quadrante 4 (48-41) e Quadrante 3 (31-38)
  const lowerPermanentQ4 = [48, 47, 46, 45, 44, 43, 42, 41];
  const lowerPermanentQ3 = [31, 32, 33, 34, 35, 36, 37, 38];

  // Dentição Decídua Infantil (20 dentes)
  const upperDeciduousQ5 = [55, 54, 53, 52, 51];
  const upperDeciduousQ6 = [61, 62, 63, 64, 65];
  const lowerDeciduousQ8 = [85, 84, 83, 82, 81];
  const lowerDeciduousQ7 = [71, 72, 73, 74, 75];

  // Encontrar condição gravada para dente e face
  const getItemCondition = (toothNumber: number, face: string) => {
    // Primeiro checar se há condição geral para o dente todo (Ex: IMPLANTE, EXTRACAO)
    const generalItem = items.find(
      (it) => it.toothNumber === toothNumber && it.face === 'GERAL' && it.stage === currentStage
    );
    if (generalItem) return generalItem.condition;

    const faceItem = items.find(
      (it) => it.toothNumber === toothNumber && it.face === face && it.stage === currentStage
    );
    return faceItem ? faceItem.condition : 'HIGIDO';
  };

  const getToothGeneralCondition = (toothNumber: number) => {
    return items.find(
      (it) => it.toothNumber === toothNumber && it.face === 'GERAL' && it.stage === currentStage
    );
  };

  // Clique em uma face individual do dente
  const handleFaceClick = (toothNumber: number, face: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly) return;

    if (e.shiftKey) {
      // Abre modal de anotações da face
      setSelectedToothForModal(toothNumber);
      setSelectedFaceForModal(face);
      const existing = items.find(
        (it) => it.toothNumber === toothNumber && it.face === face && it.stage === currentStage
      );
      setItemNotes(existing?.notes || '');
      return;
    }

    // Aplica a ferramenta selecionada imediatamente
    applyCondition(toothNumber, face, selectedTool);
  };

  // Clique no cabeçalho do dente para ações gerais (Implante, Coroa, Extração)
  const handleToothHeaderClick = (toothNumber: number) => {
    if (readOnly) return;
    setSelectedToothForModal(toothNumber);
    setSelectedFaceForModal('GERAL');
    const existing = items.find(
      (it) => it.toothNumber === toothNumber && it.face === 'GERAL' && it.stage === currentStage
    );
    setItemNotes(existing?.notes || '');
  };

  const applyCondition = async (toothNumber: number, face: string, condition: string, notes?: string) => {
    let newItems = [...items];

    if (condition === 'HIGIDO') {
      newItems = newItems.filter(
        (it) => !(it.toothNumber === toothNumber && (it.face === face || (face === 'GERAL' && it.face === 'GERAL')) && it.stage === currentStage)
      );
    } else {
      const index = newItems.findIndex(
        (it) => it.toothNumber === toothNumber && it.face === face && it.stage === currentStage
      );

      const newItem: OdontoItem = {
        toothNumber,
        face,
        condition,
        stage: currentStage,
        notes: notes || undefined,
      };

      if (index >= 0) {
        newItems[index] = newItem;
      } else {
        newItems.push(newItem);
      }
    }

    setItems(newItems);

    // Salvar no backend via API
    try {
      await fetch('/api/odontogram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          toothNumber,
          face,
          condition,
          stage: currentStage,
          notes,
        }),
      });
      if (onSave) onSave(newItems);
    } catch (err) {
      console.error('Erro ao salvar item odontograma:', err);
    }
  };

  const getFaceFillColor = (toothNumber: number, face: string) => {
    const cond = getItemCondition(toothNumber, face);
    return CONDITIONS_CONFIG[cond]?.color || '#ffffff';
  };

  // Renderizador SVG geométrico do dente com 5 faces
  const renderToothSVG = (toothNumber: number) => {
    const general = getToothGeneralCondition(toothNumber);
    const isExtracted = general?.condition === 'EXTRACAO_REALIZADA';
    const isIndicatedExtraction = general?.condition === 'EXTRACAO_INDICADA';
    const isImplant = general?.condition === 'IMPLANTE';
    const isCrown = general?.condition === 'COROA';

    return (
      <div className="flex flex-col items-center group relative select-none">
        {/* Número do dente / Botão de ação geral */}
        <button
          type="button"
          onClick={() => handleToothHeaderClick(toothNumber)}
          className={`text-xs font-bold px-1.5 py-0.5 rounded transition-colors mb-1 ${
            general
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-200'
          }`}
          title={`Dente ${toothNumber} - Clique para condições gerais (Implante, Prótese, etc.)`}
        >
          {toothNumber}
        </button>

        {/* SVG Representando as 5 faces do dente */}
        <div className="relative w-11 h-11 bg-white rounded-md shadow-xs border border-slate-300 p-0.5 hover:shadow-md transition-shadow">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Vestibular (Superior) */}
            <polygon
              points="0,0 100,0 75,25 25,25"
              fill={getFaceFillColor(toothNumber, 'V')}
              stroke="#94a3b8"
              strokeWidth="2"
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={(e) => handleFaceClick(toothNumber, 'V', e)}
            />
            {/* Distal (Direita) */}
            <polygon
              points="100,0 100,100 75,75 75,25"
              fill={getFaceFillColor(toothNumber, 'D')}
              stroke="#94a3b8"
              strokeWidth="2"
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={(e) => handleFaceClick(toothNumber, 'D', e)}
            />
            {/* Lingual / Palatina (Inferior) */}
            <polygon
              points="0,100 100,100 75,75 25,75"
              fill={getFaceFillColor(toothNumber, 'L')}
              stroke="#94a3b8"
              strokeWidth="2"
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={(e) => handleFaceClick(toothNumber, 'L', e)}
            />
            {/* Mesial (Esquerda) */}
            <polygon
              points="0,0 0,100 25,75 25,25"
              fill={getFaceFillColor(toothNumber, 'M')}
              stroke="#94a3b8"
              strokeWidth="2"
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={(e) => handleFaceClick(toothNumber, 'M', e)}
            />
            {/* Oclusal / Incisal (Centro) */}
            <rect
              x="25"
              y="25"
              width="50"
              height="50"
              fill={getFaceFillColor(toothNumber, 'O')}
              stroke="#94a3b8"
              strokeWidth="2"
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={(e) => handleFaceClick(toothNumber, 'O', e)}
            />
          </svg>

          {/* Badges / Overlays para condições de dente inteiro */}
          {isExtracted && (
            <div className="absolute inset-0 bg-slate-900/80 rounded flex items-center justify-center text-rose-400 font-bold text-lg pointer-events-none">
              ✕
            </div>
          )}
          {isIndicatedExtraction && (
            <div className="absolute inset-0 border-2 border-rose-600 rounded flex items-center justify-center text-rose-600 font-extrabold text-xl pointer-events-none">
              ✕
            </div>
          )}
          {isImplant && (
            <div className="absolute inset-0 bg-emerald-500/30 border border-emerald-600 rounded flex items-center justify-center text-xs pointer-events-none">
              🔩
            </div>
          )}
          {isCrown && (
            <div className="absolute inset-0 bg-amber-400/30 border border-amber-500 rounded flex items-center justify-center text-xs pointer-events-none">
              👑
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      {/* Top Bar: Seleção de Estágio, Tipo de Arcada e Ferramenta Ativa */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
        {/* Estágio (Inicial / Planejado / Executado) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estágio:</span>
          <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200">
            {(['INICIAL', 'PLANEJADO', 'EXECUTADO'] as const).map((stage) => (
              <button
                key={stage}
                type="button"
                onClick={() => setCurrentStage(stage)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  currentStage === stage
                    ? 'bg-white text-teal-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {stage === 'INICIAL' ? 'Diagnóstico Inicial' : stage === 'PLANEJADO' ? 'Planejado' : 'Executado'}
              </button>
            ))}
          </div>
        </div>

        {/* Tipo de Arcada (Permanente ou Decídua) */}
        <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setArchType('PERMANENTE')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              archType === 'PERMANENTE'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Adulto (Permanente - 32)
          </button>
          <button
            type="button"
            onClick={() => setArchType('DECIDUO')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              archType === 'DECIDUO'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Infantil (Decíduo - 20)
          </button>
        </div>
      </div>

      {/* Seletor Rápido de Ferramentas / Condições Clínicas */}
      {!readOnly && (
        <div className="py-4 border-b border-slate-200">
          <p className="text-xs font-semibold text-slate-500 mb-2">
            Ferramenta ativa (clique na face do dente para marcar ou Shift+Clique para anotações):
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CONDITIONS_CONFIG).map(([key, config]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedTool(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  selectedTool === key
                    ? 'ring-2 ring-teal-500 ring-offset-1 font-bold shadow-xs ' + config.bgClass
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{config.icon}</span>
                <span>{config.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Representação Anatômica dos Arcos Odontológicos */}
      <div className="py-8 overflow-x-auto">
        <div className="min-w-[700px] flex flex-col items-center gap-8">
          {/* ARCADA SUPERIOR */}
          <div className="w-full">
            <div className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Arcada Superior (Maxila)
            </div>
            <div className="flex justify-center items-center gap-6">
              {/* Quadrante Superior Direito (Paciente) */}
              <div className="flex gap-2 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                {(archType === 'PERMANENTE' ? upperPermanentQ1 : upperDeciduousQ5).map((num) =>
                  renderToothSVG(num)
                )}
              </div>

              {/* Divisor da Linha Média */}
              <div className="w-0.5 h-16 bg-teal-500/40 rounded-full relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-bold text-teal-600 bg-white px-1">
                  Linha Média
                </span>
              </div>

              {/* Quadrante Superior Esquerdo (Paciente) */}
              <div className="flex gap-2 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                {(archType === 'PERMANENTE' ? upperPermanentQ2 : upperDeciduousQ6).map((num) =>
                  renderToothSVG(num)
                )}
              </div>
            </div>
          </div>

          {/* ARCADA INFERIOR */}
          <div className="w-full">
            <div className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Arcada Inferior (Mandíbula)
            </div>
            <div className="flex justify-center items-center gap-6">
              {/* Quadrante Inferior Direito (Paciente) */}
              <div className="flex gap-2 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                {(archType === 'PERMANENTE' ? lowerPermanentQ4 : lowerDeciduousQ8).map((num) =>
                  renderToothSVG(num)
                )}
              </div>

              {/* Divisor da Linha Média */}
              <div className="w-0.5 h-16 bg-teal-500/40 rounded-full"></div>

              {/* Quadrante Inferior Esquerdo (Paciente) */}
              <div className="flex gap-2 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                {(archType === 'PERMANENTE' ? lowerPermanentQ3 : lowerDeciduousQ7).map((num) =>
                  renderToothSVG(num)
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legenda das Faces do Dente */}
      <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
        <div className="flex items-center gap-4">
          <span className="font-bold text-slate-700">Faces do Dente:</span>
          <span><b>V</b> - Vestibular</span>
          <span><b>L</b> - Lingual/Palatina</span>
          <span><b>M</b> - Mesial</span>
          <span><b>D</b> - Distal</span>
          <span><b>O</b> - Oclusal/Incisal (Centro)</span>
        </div>
        <div className="text-slate-400 italic">
          Total de itens marcados: {items.filter((i) => i.stage === currentStage).length}
        </div>
      </div>

      {/* Modal / Dialog para anotações detalhadas do dente */}
      {selectedToothForModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Dente {selectedToothForModal} - Face {selectedFaceForModal}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Selecione o procedimento/diagnóstico para esta região e adicione notas clínicas.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Condição Clínica</label>
                <select
                  value={selectedTool}
                  onChange={(e) => setSelectedTool(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500"
                >
                  {Object.entries(CONDITIONS_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observações Clínicas</label>
                <textarea
                  rows={3}
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  placeholder="Ex: Cárie profunda, sensibilidade ao frio, indicar endodontia..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedToothForModal(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    applyCondition(selectedToothForModal, selectedFaceForModal, selectedTool, itemNotes);
                    setSelectedToothForModal(null);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 shadow-xs"
                >
                  Confirmar e Gravar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
