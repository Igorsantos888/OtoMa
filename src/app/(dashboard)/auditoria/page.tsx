import React from 'react';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ShieldCheck, User, Clock, AlertCircle } from 'lucide-react';

export default async function AuditoriaPage() {
  const user = await getCurrentUser();

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const getActionBadge = (action: string) => {
    if (action.includes('CREATED') || action.includes('SUCCESS')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('FAILED') || action.includes('DELETE') || action.includes('LOCKED')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900">Auditoria & Rastreabilidade do Sistema</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Registro imutável de todas as ações de autenticação, alterações de prontuário e transações financeiras
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b">
              <tr>
                <th className="p-4">Data / Hora</th>
                <th className="p-4">Usuário</th>
                <th className="p-4">Ação</th>
                <th className="p-4">Módulo / Entidade</th>
                <th className="p-4">Detalhes Técnicos</th>
                <th className="p-4">Endereço IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-slate-600 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="p-4 font-sans font-bold text-slate-900">
                    {log.userName || 'Sistema'}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${getActionBadge(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 font-sans font-semibold text-slate-700">{log.entity}</td>
                  <td className="p-4 text-slate-500 font-sans max-w-xs truncate" title={log.details || ''}>
                    {log.details || '-'}
                  </td>
                  <td className="p-4 text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
