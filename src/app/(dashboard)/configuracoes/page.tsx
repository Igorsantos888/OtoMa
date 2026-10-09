'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Users,
  CheckCircle2,
  Lock,
  Unlock,
  Plus,
  Save,
  KeyRound,
  UserPlus,
  AlertTriangle,
} from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  cro?: string;
  specialty?: string;
  isActive: boolean;
  isLocked: boolean;
  failedLoginAttempts: number;
}

const AVAILABLE_PERMISSIONS = [
  { key: 'patients:view', label: 'Visualizar Pacientes' },
  { key: 'patients:edit', label: 'Cadastrar e Editar Pacientes' },
  { key: 'agenda:view', label: 'Visualizar Agenda dos Dentistas' },
  { key: 'agenda:edit', label: 'Criar e Alterar Agendamentos' },
  { key: 'prontuario:view', label: 'Acessar Prontuário Odontológico' },
  { key: 'prontuario:edit', label: 'Gravar Evoluções Clínicas' },
  { key: 'odontograma:view', label: 'Visualizar Odontograma 2D' },
  { key: 'odontograma:edit', label: 'Marcar Patologias no Odontograma' },
  { key: 'tratamentos:view', label: 'Ver Planos de Tratamento' },
  { key: 'tratamentos:edit', label: 'Criar e Aprovar Orçamentos' },
  { key: 'documentos:sign', label: 'Assinar Termos e Documentos Digitalmente' },
  { key: 'financeiro:view', label: 'Acesso ao Financeiro Completo' },
  { key: 'financeiro:edit', label: 'Lançar e Baixar Contas' },
  { key: 'financeiro:basic', label: 'Financeiro Básico (Recepção)' },
  { key: 'estoque:view', label: 'Visualizar Estoque de Insumos' },
  { key: 'estoque:edit', label: 'Baixar e Movimentar Estoque' },
  { key: 'comissoes:view', label: 'Visualizar Comissões' },
  { key: 'comissoes:edit', label: 'Lançar e Fechar Repasses' },
  { key: 'auditoria:view', label: 'Acessar Logs de Auditoria' },
  { key: 'users:manage', label: 'Gerenciar Usuários e Perfis' },
];

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<'permissoes' | 'usuarios'>('permissoes');
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolePerms, setRolePerms] = useState<string[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal Novo Usuário
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRoleId, setUserRoleId] = useState('');
  const [userCro, setUserCro] = useState('');
  const [userSpecialty, setUserSpecialty] = useState('');

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/admin/roles');
      const data = await res.json();
      if (Array.isArray(data)) {
        setRoles(data);
        if (data.length > 0 && !selectedRole) {
          setSelectedRole(data[0]);
          setRolePerms(data[0].permissions || []);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, []);

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setRolePerms(role.permissions || []);
    setSaveSuccess('');
  };

  const togglePermission = (permKey: string) => {
    if (rolePerms.includes('all')) {
      // Se tiver 'all', expande todas as permissões para permitir desmarcar
      const allKeys = AVAILABLE_PERMISSIONS.map((p) => p.key).filter((k) => k !== permKey);
      setRolePerms(allKeys);
      return;
    }

    if (rolePerms.includes(permKey)) {
      setRolePerms(rolePerms.filter((p) => p !== permKey));
    } else {
      setRolePerms([...rolePerms, permKey]);
    }
  };

  const handleSaveRolePermissions = async () => {
    if (!selectedRole) return;
    try {
      await fetch('/api/admin/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: selectedRole.id,
          permissions: rolePerms,
        }),
      });
      setSaveSuccess(`Permissões do perfil ${selectedRole.name} salvas com sucesso!`);
      fetchRoles();
      setTimeout(() => setSaveSuccess(''), 3500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnlockUser = async (userId: string) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, unlockAccount: true }),
      });
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          password: userPassword,
          roleId: userRoleId,
          cro: userCro || null,
          specialty: userSpecialty || null,
        }),
      });
      setIsUserModalOpen(false);
      setUserName('');
      setUserEmail('');
      setUserPassword('');
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Configurações de Acesso & Perfis (RBAC)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            O Administrador pode customizar as permissões de cada perfil e gerenciar a equipe
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('permissoes')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'permissoes'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Matriz de Permissões por Perfil</span>
        </button>
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'usuarios'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuários do Consultório</span>
        </button>
      </div>

      {/* ABA 1: Matriz de Permissões */}
      {activeTab === 'permissoes' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Coluna 1: Lista de Perfis */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Perfis de Acesso
            </h3>
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleSelectRole(r)}
                className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                  selectedRole?.id === r.id
                    ? 'bg-teal-600 text-white font-bold border-teal-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-semibold'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{r.name}</span>
                </div>
                <p
                  className={`text-[10px] mt-1 line-clamp-2 ${
                    selectedRole?.id === r.id ? 'text-teal-100' : 'text-slate-500 font-normal'
                  }`}
                >
                  {r.description}
                </p>
              </button>
            ))}
          </div>

          {/* Coluna 2, 3 e 4: Matriz de Checkboxes do Perfil Selecionado */}
          <div className="md:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Permissões do Perfil: <span className="text-teal-600">{selectedRole?.name}</span>
                </h3>
                <p className="text-xs text-slate-500">{selectedRole?.description}</p>
              </div>

              <button
                onClick={handleSaveRolePermissions}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Permissões</span>
              </button>
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{saveSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AVAILABLE_PERMISSIONS.map((p) => {
                const isChecked = rolePerms.includes('all') || rolePerms.includes(p.key);
                return (
                  <label
                    key={p.key}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors text-xs ${
                      isChecked
                        ? 'bg-teal-50/70 border-teal-300 text-teal-950 font-semibold'
                        : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePermission(p.key)}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span>{p.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: Gestão de Usuários */}
      {activeTab === 'usuarios' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Usuários da Clínica</h3>
              <p className="text-xs text-slate-500">Controle de acesso, tentativas de login e bloqueios de segurança</p>
            </div>

            <button
              onClick={() => {
                if (roles.length > 0) setUserRoleId(roles[0].id);
                setIsUserModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Usuário</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b">
                <tr>
                  <th className="p-4">Nome</th>
                  <th className="p-4">E-mail</th>
                  <th className="p-4">Perfil</th>
                  <th className="p-4">Registro / Especialidade</th>
                  <th className="p-4">Status da Conta</th>
                  <th className="p-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{u.name}</td>
                    <td className="p-4 text-slate-600">{u.email}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-800 border border-slate-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">
                      {u.cro ? `${u.cro} - ${u.specialty || ''}` : '-'}
                    </td>
                    <td className="p-4">
                      {u.isLocked ? (
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 w-fit">
                          <Lock className="w-3 h-3 text-rose-600" />
                          Bloqueado (Tentativas excessivas)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Ativo
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {u.isLocked && (
                        <button
                          onClick={() => handleUnlockUser(u.id)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold inline-flex items-center gap-1"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Desbloquear</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Novo Usuário */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">Cadastrar Novo Usuário</h3>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">E-mail *</label>
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Senha Inicial *</label>
                <input
                  type="password"
                  required
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Perfil de Acesso *</label>
                <select
                  value={userRoleId}
                  onChange={(e) => setUserRoleId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CRO (Se dentista)</label>
                  <input
                    type="text"
                    value={userCro}
                    onChange={(e) => setUserCro(e.target.value)}
                    placeholder="CRO-SP 000000"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Especialidade</label>
                  <input
                    type="text"
                    value={userSpecialty}
                    onChange={(e) => setUserSpecialty(e.target.value)}
                    placeholder="Ex: Ortodontia"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700"
                >
                  Criar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
