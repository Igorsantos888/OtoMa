'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Search,
  PlusCircle,
  Clock,
  Calendar,
  UserPlus,
  Building2,
} from 'lucide-react';

interface HeaderProps {
  user: {
    name: string;
    email: string;
    role: string;
    cro?: string;
    specialty?: string;
  } | null;
}

export default function Header({ user }: HeaderProps) {
  const [time, setTime] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      );
      setDateStr(
        now.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Clinic Name & Date */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-slate-700">
          <Building2 className="w-5 h-5 text-teal-600" />
          <span className="font-bold text-slate-800 text-sm">Clínica Odontológica Integrada</span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 border-l border-slate-200 pl-4 capitalize">
          <Calendar className="w-3.5 h-3.5 text-teal-600" />
          <span>{dateStr}</span>
          <span className="font-semibold text-slate-700 ml-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            {time}
          </span>
        </div>
      </div>

      {/* Actions & Profile */}
      <div className="flex items-center gap-4">
        {/* Quick action: Novo Paciente */}
        <Link
          href="/pacientes?action=new"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg text-xs font-semibold border border-teal-200 transition-colors"
        >
          <UserPlus className="w-4 h-4 text-teal-600" />
          <span>Novo Paciente</span>
        </Link>

        {/* Quick action: Agendamento */}
        <Link
          href="/agenda?action=new"
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 text-white hover:bg-teal-700 rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Agendar Consulta</span>
        </Link>

        {/* Notification bell */}
        <div className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
        </div>

        {/* User preview */}
        {user && (
          <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800 leading-tight">{user.name}</p>
              <p className="text-[11px] text-slate-500">
                {user.cro ? `${user.cro} - ` : ''}{user.specialty || user.role}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              {user.name.charAt(0)}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
