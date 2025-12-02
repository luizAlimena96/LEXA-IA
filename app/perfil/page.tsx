'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Building2, Wifi, WifiOff, QrCode, CheckCircle, Loader,
  Lock, Users, Save, Search, Plus, Trash2, Edit, Shield
} from 'lucide-react';
import { useToast, ToastContainer } from '../components/Toast';
import Modal from '../components/Modal';

export default function PerfilPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const organizationId = searchParams.get('organizationId');
  const { toasts, addToast, removeToast } = useToast();

  const [activeTab, setActiveTab] = useState<'company' | 'security' | 'team'>('company');
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  // WhatsApp State
  const [qrCode, setQrCode] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [checking, setChecking] = useState(false);

  // Forms
  const [companyForm, setCompanyForm] = useState({
    name: '', email: '', phone: '', niche: '', document: '',
    zipCode: '', street: '', number: '', neighborhood: '', city: '', state: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '', confirmPassword: ''
  });

  // Team Modal
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({
    name: '', email: '', password: '', role: 'USER',
    allowedTabs: [] as string[]
  });

  const availableTabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'whatsapp', label: 'Conversas' },
    { id: 'calendario', label: 'Calendário' },
    { id: 'agentes', label: 'Agentes' },
    { id: 'feedback', label: 'Feedback' },
    { id: 'relatorios', label: 'Relatórios' },
  ];

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadData();
    }
  }, [status, router, organizationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      let targetOrgId = organizationId;

      // If no ID in URL, try to fetch list and get the first one (fallback for normal users)
      if (!targetOrgId) {
        const orgRes = await fetch('/api/organizations', { credentials: 'include' });
        if (orgRes.ok) {
          const orgs = await orgRes.json();
          if (orgs.length > 0) {
            targetOrgId = orgs[0].id;
          }
        }
      }

      if (targetOrgId) {
        // Fetch full details including users
        const fullOrgRes = await fetch(`/api/organizations/${targetOrgId}`, { credentials: 'include' });
        if (fullOrgRes.ok) {
          const fullOrg = await fullOrgRes.json();
          setOrganization(fullOrg);
          setUsers(fullOrg.users || []);
          setCompanyForm({
            name: fullOrg.name || '',
            email: fullOrg.email || '',
            phone: fullOrg.phone || '',
            niche: fullOrg.niche || '',
            document: fullOrg.document || '',
            zipCode: fullOrg.zipCode || '',
            street: fullOrg.street || '',
            number: fullOrg.number || '',
            neighborhood: fullOrg.neighborhood || '',
            city: fullOrg.city || '',
            state: fullOrg.state || '',
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      addToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };


  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setCompanyForm(prev => ({
            ...prev,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf
          }));
        }
      } catch (error) {
        console.error('Error fetching CEP:', error);
      }
    }
  };

  const handleSaveCompany = async () => {
    if (!organization?.id) return;
    try {
      const res = await fetch(`/api/organizations/${organization.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyForm),
        credentials: 'include'
      });

      if (res.ok) {
        addToast('Dados da empresa atualizados!', 'success');
        loadData(); // Refresh to ensure sync
      } else {
        addToast('Erro ao salvar dados', 'error');
      }
    } catch (error) {
      addToast('Erro ao salvar dados', 'error');
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast('As senhas não coincidem', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      addToast('A senha deve ter pelo menos 6 caracteres', 'error');
      return;
    }

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: passwordForm.newPassword }),
        credentials: 'include'
      });

      if (res.ok) {
        addToast('Senha alterada com sucesso!', 'success');
        setPasswordForm({ newPassword: '', confirmPassword: '' });
      } else {
        addToast('Erro ao alterar senha', 'error');
      }
    } catch (error) {
      addToast('Erro ao alterar senha', 'error');
    }
  };

  const handleSaveUser = async () => {
    if (!organization?.id) return;
    if (!userForm.name || !userForm.email) {
      addToast('Preencha nome e email', 'error');
      return;
    }
    if (!editingUser && !userForm.password) {
      addToast('Senha é obrigatória para novos usuários', 'error');
      return;
    }

    try {
      const url = editingUser
        ? `/api/organizations/${organization.id}/users/${editingUser.id}`
        : `/api/organizations/${organization.id}/users`;

      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
        credentials: 'include'
      });

      if (res.ok) {
        addToast(`Usuário ${editingUser ? 'atualizado' : 'criado'} com sucesso!`, 'success');
        setShowUserModal(false);
        loadData();
      } else {
        const err = await res.json();
        addToast(err.error || 'Erro ao salvar usuário', 'error');
      }
    } catch (error) {
      addToast('Erro ao salvar usuário', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja remover este usuário?')) return;
    try {
      const res = await fetch(`/api/organizations/${organization.id}/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (res.ok) {
        addToast('Usuário removido', 'success');
        loadData();
      } else {
        addToast('Erro ao remover usuário', 'error');
      }
    } catch (error) {
      addToast('Erro ao remover usuário', 'error');
    }
  };

  // WhatsApp Functions (Reused)
  const handleConnect = async () => {
    if (!organization?.id) return;
    setConnecting(true);
    try {
      const response = await fetch(`/api/organizations/${organization.id}/whatsapp`, {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qrCode);
        startPolling();
      } else {
        addToast('Erro ao gerar QR Code', 'error');
      }
    } catch (error) {
      addToast('Erro ao conectar WhatsApp', 'error');
    } finally {
      setConnecting(false);
    }
  };

  const startPolling = () => {
    const interval = setInterval(async () => {
      await checkStatus();
    }, 3000);
    setTimeout(() => clearInterval(interval), 120000);
  };

  const checkStatus = async () => {
    if (!organization?.id) return;
    setChecking(true);
    try {
      const response = await fetch(`/api/organizations/${organization.id}/whatsapp`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.connected) {
          setQrCode('');
          loadData();
        }
      }
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleDisconnect = async () => {
    if (!organization?.id) return;
    if (!confirm('Deseja realmente desconectar o WhatsApp?')) return;
    try {
      const response = await fetch(`/api/organizations/${organization.id}/whatsapp`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        loadData();
      }
    } catch (error) {
      addToast('Erro ao desconectar', 'error');
    }
  };

  if (loading || !organization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Perfil e Configurações</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('company')}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${activeTab === 'company'
            ? 'text-indigo-600 border-b-2 border-indigo-600'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          <Building2 className="w-4 h-4" />
          Dados da Empresa
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${activeTab === 'security'
            ? 'text-indigo-600 border-b-2 border-indigo-600'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          <Lock className="w-4 h-4" />
          Segurança
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${activeTab === 'team'
            ? 'text-indigo-600 border-b-2 border-indigo-600'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          <Users className="w-4 h-4" />
          Colaboradores
        </button>
      </div>

      {/* Company Tab */}
      {activeTab === 'company' && (
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Informações Básicas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
                <input
                  type="text"
                  value={companyForm.name}
                  onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })}
                  className="input-primary w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nicho de Atuação</label>
                <input
                  type="text"
                  value={companyForm.niche}
                  onChange={e => setCompanyForm({ ...companyForm, niche: e.target.value })}
                  className="input-primary w-full"
                  placeholder="Ex: Clínica Odontológica"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Comercial</label>
                <input
                  type="email"
                  value={companyForm.email}
                  onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })}
                  className="input-primary w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="text"
                  value={companyForm.phone}
                  onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  className="input-primary w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF ou CNPJ</label>
                <input
                  type="text"
                  value={companyForm.document}
                  onChange={e => setCompanyForm({ ...companyForm, document: e.target.value })}
                  className="input-primary w-full"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Endereço</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                <div className="relative">
                  <input
                    type="text"
                    value={companyForm.zipCode}
                    onChange={e => setCompanyForm({ ...companyForm, zipCode: e.target.value })}
                    onBlur={handleCepBlur}
                    className="input-primary w-full pr-10"
                    placeholder="00000-000"
                  />
                  <Search className="w-4 h-4 absolute right-3 top-3 text-gray-400" />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Rua</label>
                <input
                  type="text"
                  value={companyForm.street}
                  onChange={e => setCompanyForm({ ...companyForm, street: e.target.value })}
                  className="input-primary w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                <input
                  type="text"
                  value={companyForm.number}
                  onChange={e => setCompanyForm({ ...companyForm, number: e.target.value })}
                  className="input-primary w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                <input
                  type="text"
                  value={companyForm.neighborhood}
                  onChange={e => setCompanyForm({ ...companyForm, neighborhood: e.target.value })}
                  className="input-primary w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                <input
                  type="text"
                  value={companyForm.city}
                  onChange={e => setCompanyForm({ ...companyForm, city: e.target.value })}
                  className="input-primary w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <input
                  type="text"
                  value={companyForm.state}
                  onChange={e => setCompanyForm({ ...companyForm, state: e.target.value })}
                  className="input-primary w-full"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveCompany}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                Salvar Alterações
              </button>
            </div>
          </div>

          {/* WhatsApp Connection (Moved here) */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Conexão WhatsApp</h3>
            {organization.whatsappConnected ? (
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">Conectado</p>
                    <p className="text-sm text-green-700">{organization.whatsappPhone}</p>
                  </div>
                </div>
                <button onClick={handleDisconnect} className="text-red-600 hover:text-red-800 text-sm font-medium">
                  Desconectar
                </button>
              </div>
            ) : (
              <div>
                {!qrCode ? (
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                  >
                    {connecting ? <Loader className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                    Conectar WhatsApp
                  </button>
                ) : (
                  <div className="text-center">
                    <img src={qrCode} alt="QR Code" className="w-64 h-64 mx-auto border-2 border-gray-200 rounded-lg" />
                    <p className="mt-2 text-sm text-gray-600">Escaneie com seu WhatsApp</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Alterar Senha</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="input-primary w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="input-primary w-full"
              />
            </div>
            <div className="pt-4">
              <button
                onClick={handleChangePassword}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                Atualizar Senha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Colaboradores</h2>
            <button
              onClick={() => {
                setEditingUser(null);
                setUserForm({ name: '', email: '', password: '', role: 'USER', allowedTabs: [] });
                setShowUserModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar Colaborador
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 font-semibold text-gray-600">Nome</th>
                  <th className="pb-3 font-semibold text-gray-600">Email</th>
                  <th className="pb-3 font-semibold text-gray-600">Função</th>
                  <th className="pb-3 font-semibold text-gray-600 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                  <tr key={user.id} className="group hover:bg-gray-50">
                    <td className="py-3">{user.name}</td>
                    <td className="py-3 text-gray-600">{user.email}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                        }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setUserForm({
                              name: user.name,
                              email: user.email,
                              password: '', // Don't show password
                              role: user.role,
                              allowedTabs: user.allowedTabs || []
                            });
                            setShowUserModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title={editingUser ? 'Editar Colaborador' : 'Novo Colaborador'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={userForm.name}
              onChange={e => setUserForm({ ...userForm, name: e.target.value })}
              className="input-primary w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={userForm.email}
              onChange={e => setUserForm({ ...userForm, email: e.target.value })}
              className="input-primary w-full"
              disabled={!!editingUser}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {editingUser ? 'Nova Senha (opcional)' : 'Senha'}
            </label>
            <input
              type="password"
              value={userForm.password}
              onChange={e => setUserForm({ ...userForm, password: e.target.value })}
              className="input-primary w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
            <select
              value={userForm.role}
              onChange={e => setUserForm({ ...userForm, role: e.target.value })}
              className="input-primary w-full"
            >
              <option value="USER">Usuário</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Permissões de Acesso (Abas)</label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {availableTabs.map(tab => (
                <label key={tab.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={userForm.allowedTabs.includes(tab.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setUserForm(prev => ({ ...prev, allowedTabs: [...prev.allowedTabs, tab.id] }));
                      } else {
                        setUserForm(prev => ({ ...prev, allowedTabs: prev.allowedTabs.filter(t => t !== tab.id) }));
                      }
                    }}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">{tab.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowUserModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveUser}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
