'use client';

import React, { useRef, useState, useEffect } from 'react';
import { PenTool, RotateCcw, Check, X } from 'lucide-react';

interface DigitalSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureBase64: string) => void;
  signerName: string;
  documentTitle?: string;
}

export default function DigitalSignatureModal({
  isOpen,
  onClose,
  onSave,
  signerName,
  documentTitle = 'Termo Odontológico',
}: DigitalSignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setHasSignature(false);
          }
        }
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;
    const base64 = canvas.toDataURL('image/png');
    onSave(base64);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Assinatura Digital</h3>
              <p className="text-xs text-slate-400">{documentTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions & Signer Info */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <span>
            Assinante: <b>{signerName}</b>
          </span>
          <span className="text-teal-700 font-medium">Use mouse, dedo ou caneta stylus</span>
        </div>

        {/* Canvas */}
        <div className="p-5 flex flex-col items-center bg-white">
          <div className="w-full relative border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-slate-50/50">
            <canvas
              ref={canvasRef}
              width={460}
              height={200}
              className="w-full h-[200px] cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {/* Guide line */}
            <div className="absolute bottom-8 left-8 right-8 border-b border-slate-300/80 pointer-events-none flex justify-between text-[10px] text-slate-400">
              <span>✕ Assine sobre a linha</span>
              <span>OdontoSys Security</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={clearCanvas}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar Traço</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!hasSignature}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-semibold rounded-lg shadow-xs transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Confirmar Assinatura</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
