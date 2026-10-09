'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Calendar,
  Users,
  FileText,
  DollarSign,
  Package,
  Award,
  MessageSquare,
  ShieldCheck,
  Settings,
  LayoutDashboard,
  LogOut,
  ChevronRight,
  Activity,
} from 'lucide-react';

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: string;
    permissions: string[];
    specialty?: string;
  } | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const hasPerm = (perm: string) => {
    if (!user || !user.permissions) return false;
    if (user.permissions.includes('all')) return true;
    return user.permissions.includes(perm);
  };

  const menuItems = [
    {
      title: 'Visão Geral',
      href: '/dashboard',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      title: 'Agenda dos Dentistas',
      href: '/agenda',
      icon: Calendar,
      visible: hasPerm('agenda:view'),
    },
    {
      title: 'Pacientes & Prontuários',
      href: '/pacientes',
      icon: Users,
      visible: hasPerm('patients:view'),
    },
    {
      title: 'Planos & Orçamentos',
      href: '/tratamentos',
      icon: FileText,
      visible: hasPerm('tratamentos:view') || hasPerm('prontuario:view') || user?.role === 'ADMINISTRADOR',
    },
    {
      title: 'Gestão Financeira',
      href: '/financeiro',
      icon: DollarSign,
      visible: hasPerm('financeiro:view') || hasPerm('financeiro:basic'),
    },
    {
      title: 'Estoque & Materiais',
      href: '/estoque',
      icon: Package,
      visible: hasPerm('estoque:view'),
    },
    {
      title: 'Comissões',
      href: '/comissoes',
      icon: Award,
      visible: hasPerm('comissoes:view') || user?.role === 'DENTISTA',
    },
    {
      title: 'Comunicação / Lembretes',
      href: '/comunicacao',
      icon: MessageSquare,
      visible: hasPerm('comunicacao:send') || hasPerm('patients:view'),
    },
    {
      title: 'Auditoria de Alterações',
      href: '/auditoria',
      icon: ShieldCheck,
      visible: hasPerm('auditoria:view'),
    },
    {
      title: 'Configurações & Perfis',
      href: '/configuracoes',
      icon: Settings,
      visible: hasPerm('users:manage') || user?.role === 'ADMINISTRADOR',
    },
  ];

  // Cores de crachá de perfil
  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'ADMINISTRADOR':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DENTISTA':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'RECEPCIONISTA':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'FINANCEIRO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'AUXILIAR':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col flex-shrink-0 h-screen sticky top-0 border-r border-slate-800 select-none shadow-xl z-30">
      {/* Brand & Logo */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 font-bold text-xl">
            🦷
          </div>
          <div>
            <h1 className="font-bold text-white text-lg tracking-tight leading-tight">OdontoSys</h1>
            <p className="text-xs text-teal-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
              Gestão Clínica
            </p>
          </div>
        </div>
      </div>

      {/* User Mini Profile Card */}
      {user && (
        <div className="mx-3 mt-4 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-teal-400 font-bold border border-slate-600">
            {user.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate leading-tight">{user.name}</p>
            <span
              className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadgeColor(
                user.role
              )}`}
            >
              {user.role}
            </span>
          </div>
        </div>
      )}

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Menu Operacional
        </p>
        {menuItems
          .filter((item) => item.visible)
          .map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-900/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-teal-400'
                    }`}
                  />
                  <span>{item.title}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-teal-200" />}
              </Link>
            );
          })}
      </nav>

      {/* Logout & Footer */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair do Sistema</span>
        </button>
      </div>
    </aside>
  );
}
