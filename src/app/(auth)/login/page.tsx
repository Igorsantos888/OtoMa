'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  Shield,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Estados de 2FA
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorUserId, setTwoFactorUserId] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // Estados de Esqueci Senha
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // Submissão do Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Falha ao autenticar.');
        setIsLoading(false);
        return;
      }

      if (data.requires2FA) {
        setRequires2FA(true);
        setTwoFactorUserId(data.userId);
        setIsLoading(false);
        return;
      }

      // Redirecionar para dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setErrorMsg('Erro de conexão ao tentar fazer login.');
      setIsLoading(false);
    }
  };

  // Submissão de 2FA
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: twoFactorUserId,
          code: twoFactorCode,
          rememberMe,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Código 2FA inválido.');
        setIsLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setErrorMsg('Erro ao verificar código 2FA.');
      setIsLoading(false);
    }
  };

  // Recuperação de senha
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSuccess('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      setForgotSuccess(data.message || 'Instruções enviadas para seu e-mail.');
    } catch (err) {
      setErrorMsg('Erro ao processar recuperação.');
    }
  };

  // Preenchimento rápido para demonstração dos 5 perfis
  const setDemoUser = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-500 shadow-xl shadow-teal-500/30 text-white text-3xl font-bold mb-4">
          🦷
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          OdontoSys
        </h2>
        <p className="mt-2 text-sm text-teal-200">
          Sistema Integrado de Gestão Odontológica & Prontuários
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-200/80">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!requires2FA ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  E-mail ou Usuário
                </label>
                <div className="relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@clinica.com"
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotPasswordOpen(true);
                    }}
                    className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                  />
                  <span className="text-xs font-medium text-slate-600 select-none">
                    Lembrar-me por 30 dias
                  </span>
                </label>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-teal-500" />
                  Bloqueio ativo
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isLoading ? 'Autenticando...' : 'Entrar no Sistema'}
              </button>
            </form>
          ) : (
            /* Fluxo de 2FA */
            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div className="text-center pb-2">
                <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Autenticação em 2 Fatores</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Digite o código de 6 dígitos gerado pelo seu aplicativo autenticador.
                </p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="block w-full text-center tracking-widest text-2xl font-mono py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
                <p className="text-[10px] text-slate-400 text-center mt-1">
                  (Dica de teste: utilize o código <b>123456</b>)
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || twoFactorCode.length < 6}
                className="w-full flex justify-center py-2.5 px-4 rounded-lg shadow-md text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
              >
                {isLoading ? 'Verificando...' : 'Validar Código'}
              </button>

              <button
                type="button"
                onClick={() => setRequires2FA(false)}
                className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Voltar para login
              </button>
            </form>
          )}

          {/* Atalhos para Perfis de Demonstração */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Acesso Rápido por Perfil (Ambiente de Demonstração)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDemoUser('admin@odontosys.com', 'admin123')}
                className="p-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-left font-medium transition-colors"
              >
                👑 <b>Administrador</b>
                <span className="block text-[10px] text-purple-600">Acesso Total</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoUser('dentista@odontosys.com', 'dentista123')}
                className="p-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-left font-medium transition-colors"
              >
                🦷 <b>Dentista</b>
                <span className="block text-[10px] text-teal-600">Dr. Lucas (Implan.)</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoUser('recepcao@odontosys.com', 'recepcao123')}
                className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-left font-medium transition-colors"
              >
                📋 <b>Recepcionista</b>
                <span className="block text-[10px] text-blue-600">Agenda e Pacientes</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoUser('financeiro@odontosys.com', 'fin123')}
                className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-left font-medium transition-colors"
              >
                💰 <b>Financeiro</b>
                <span className="block text-[10px] text-emerald-600">Contas e Caixa</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoUser('auxiliar@odontosys.com', 'aux123')}
                className="col-span-2 p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-left font-medium transition-colors"
              >
                🩺 <b>Auxiliar de Consultório</b>
                <span className="block text-[10px] text-amber-600">Atendimento e Insumos</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Esqueci Senha */}
      {forgotPasswordOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-800 mb-1">Recuperação de Senha</h3>
            <p className="text-xs text-slate-500 mb-4">
              Informe seu e-mail cadastrado para receber o link de redefinição seguro.
            </p>

            {forgotSuccess ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg mb-4 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                <span>{forgotSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="seu.email@clinica.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 font-semibold"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700"
                  >
                    Enviar Link
                  </button>
                </div>
              </form>
            )}
            {forgotSuccess && (
              <button
                type="button"
                onClick={() => setForgotPasswordOpen(false)}
                className="w-full py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200"
              >
                Voltar ao login
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
