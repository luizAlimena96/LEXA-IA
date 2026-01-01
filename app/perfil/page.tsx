'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Building2, Wifi, WifiOff, QrCode, CheckCircle, Loader,
  Lock, Users, User, Save, Search, Plus, Trash2, Edit, Shield, Calendar,
  Smartphone, Building, Bot, AlertCircle, CircleCheck
} from 'lucide-react';
import { useToast, ToastContainer } from '../components/Toast';
import Modal from '../components/Modal';
import api from '../lib/api-client';

export default function PerfilPage() {
  const { user, loading: authLoading, refreshUser, updateUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const organizationId = searchParams.get('organizationId');
  const { toasts, addToast, removeToast } = useToast();

  const [activeTab, setActiveTab] = useState<'company' | 'security' | 'team'>('company');
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  const [qrCode, setQrCode] = useState('');
  const [qrTimer, setQrTimer] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [showAlertPhoneModal, setShowAlertPhoneModal] = useState(false);
  const [companyPhone, setCompanyPhone] = useState('');
  const [monitoringStatus, setMonitoringStatus] = useState<any>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [googleConnecting, setGoogleConnecting] = useState(false);
  const [googleSyncing, setGoogleSyncing] = useState(false);
  const [imgCacheBuster, setImgCacheBuster] = useState(Date.now());

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
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else {
        loadData();
      }
    }
  }, [user, authLoading, router, organizationId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const orgId = params.get('organizationId');

    if (success === 'calendar_connected' && orgId && organization?.id === orgId) {
      const autoSync = async () => {
        setGoogleSyncing(true);
        try {
          const response = await fetch('/api/google/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ organizationId: orgId, daysAhead: 30 }),
            credentials: 'include',
          });
          if (response.ok) {
            const data = await response.json();
            addToast(`Calendário conectado! ${data.syncedCount} eventos sincronizados.`, 'success');
          }
        } catch (error) {
          console.error('Auto-sync error:', error);
        } finally {
          setGoogleSyncing(false);
          const newUrl = window.location.pathname + (organizationId ? `?organizationId=${organizationId}` : '');
          window.history.replaceState({}, '', newUrl);
        }
      };
      autoSync();
    }
    if (success === 'calendar_connected' && orgId && organization?.id === orgId) {
      const autoSync = async () => {
        setGoogleSyncing(true);
        try {
          const response = await fetch('/api/google/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ organizationId: orgId, daysAhead: 30 }),
            credentials: 'include',
          });
          if (response.ok) {
            const data = await response.json();
            addToast(`Calendário conectado! ${data.syncedCount} eventos sincronizados.`, 'success');
          }
        } catch (error) {
          console.error('Auto-sync error:', error);
        } finally {
          setGoogleSyncing(false);
          const newUrl = window.location.pathname + (organizationId ? `?organizationId=${organizationId}` : '');
          window.history.replaceState({}, '', newUrl);
        }
      };
      autoSync();
    }
  }, [organization?.id, organizationId]);

  useEffect(() => {
    if (!qrCode || qrTimer <= 0) return;

    const timer = setInterval(() => {
      setQrTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [qrCode, qrTimer]);

  const loadData = async () => {
    try {
      setLoading(true);
      let targetOrgId = organizationId;

      if (!targetOrgId) {
        const orgs = await api.organizations.list();
        if (orgs.length > 0) {
          targetOrgId = orgs[0].id;
        }
      }

      if (targetOrgId) {
        const fullOrg = await api.organizations.get(targetOrgId);
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

        if (fullOrg.whatsappConnected) {
          await checkStatus(fullOrg.id);
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
      await api.organizations.update(organization.id, companyForm);
      addToast('Dados da empresa atualizados!', 'success');
      loadData();
    } catch (error: any) {
      console.error('Error saving company:', error);
      addToast(error?.response?.data?.message || 'Erro ao salvar dados', 'error');
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
      await api.put('/users/profile', { newPassword: passwordForm.newPassword });
      addToast('Senha alterada com sucesso!', 'success');
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Error changing password:', error);
      addToast(error?.response?.data?.message || 'Erro ao alterar senha', 'error');
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // Debug Log
  useEffect(() => {
    if (user?.image) {
      console.log('User Image Path:', user.image);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
      console.log('Full Image URL:', `${baseUrl}${user.image}`);
    }
  }, [user?.image]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      addToast('Imagem muito grande. Máximo 5MB.', 'error');
      return;
    }

    try {
      const response = await api.users.uploadAvatar(file);
      addToast('Foto de perfil atualizada!', 'success');
      // Optimistically update user context
      // Note: Backend returns the updated user object. We can use the image property from it if available,
      // or just trust the logic that it was saved. Ideally we want the URL.
      if (response && response.image) {
        updateUser({ image: response.image });
      } else {
        // Fallback if needed, though UsersService.update usually returns the object
        await refreshUser();
      }
      setImgCacheBuster(Date.now());
    } catch (error) {
      console.error('Error uploading avatar:', error);
      addToast('Erro ao enviar imagem', 'error');
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
    if (userForm.allowedTabs.length === 0) {
      addToast('Selecione pelo menos uma aba permitida', 'error');
      return;
    }

    try {
      if (editingUser) {
        await api.put(`/organizations/${organization.id}/users/${editingUser.id}`, userForm);
      } else {
        await api.post(`/organizations/${organization.id}/users`, userForm);
      }
      addToast(`Usuário ${editingUser ? 'atualizado' : 'criado'} com sucesso!`, 'success');
      setShowUserModal(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving user:', error);
      addToast(error?.response?.data?.error || 'Erro ao salvar usuário', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja remover este usuário?')) return;
    try {
      await api.delete(`/organizations/${organization.id}/users/${userId}`);
      addToast('Usuário removido', 'success');
      loadData();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      addToast(error?.response?.data?.message || 'Erro ao remover usuário', 'error');
    }
  };

  // Phone validation helper
  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return /^55\d{10,11}$/.test(cleaned);
  };

  const formatPhoneForDisplay = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('55')) {
      const ddd = cleaned.substring(2, 4);
      const number = cleaned.substring(4);
      return `(${ddd}) ${number.substring(0, number.length - 4)}-${number.substring(number.length - 4)}`;
    }
    return phone;
  };

  const handleConnect = async () => {
    if (!organization?.id) return;
    setShowAlertPhoneModal(true);
  };

  const handleConnectWithAlertPhones = async () => {
    if (!organization?.id) return;

    if (!companyPhone) {
      addToast('Por favor, informe o número da empresa', 'error');
      return;
    }
    if (!validatePhone(companyPhone)) {
      addToast('Número inválido. Use formato: 5511999999999', 'error');
      return;
    }

    setConnecting(true);
    setShowAlertPhoneModal(false);

    try {
      const response = await api.organizations.whatsapp.connect(organization.id, {
        alertPhone1: companyPhone,
        alertPhone2: process.env.NEXT_PUBLIC_LEXA_PHONE || undefined,
      }) as { success: boolean; qrCode?: string; error?: string };

      if (response.success) {
        setQrCode(response.qrCode || '');
        setQrTimer(40); // Reset timer to 40s
        startPolling();
      } else {
        const errorMessage = response.error || 'Erro ao gerar QR Code';

        if (errorMessage.includes('already in use') || errorMessage.includes('already exists')) {
          addToast('WhatsApp já está conectado ou em processo de conexão', 'info');
          loadData();
        } else {
          addToast(errorMessage, 'error');
        }
      }
    } catch (error: any) {
      console.error('Error connecting WhatsApp:', error);
      addToast(error?.response?.data?.error || 'Erro ao conectar WhatsApp', 'error');
    } finally {
      setConnecting(false);
    }
  };

  const startPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    pollingIntervalRef.current = setInterval(async () => {
      await checkStatus();
    }, 30000);

    pollingTimeoutRef.current = setTimeout(() => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }, 60000);
  };

  const checkStatus = async (orgId?: string) => {
    const targetOrgId = orgId || organization?.id;
    if (!targetOrgId) return;
    setChecking(true);
    try {
      const data: any = await api.organizations.whatsapp.status(targetOrgId);

      setMonitoringStatus(data);
      if (data.connected) {
        setQrCode('');
        const updatedOrg = await api.organizations.get(targetOrgId);
        setOrganization(updatedOrg);

        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
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
      await api.organizations.whatsapp.disconnect(organization.id);
      loadData();
      addToast('WhatsApp desconectado com sucesso', 'success');
    } catch (error) {
      addToast('Erro ao desconectar', 'error');
    }
  };
  const handleGoogleConnect = async () => {
    if (!organization?.id) return;
    setGoogleConnecting(true);
    try {
      const data = await api.google.auth(organization.id);
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else if (data.connected) {
        addToast('Google Calendar já está conectado!', 'info');
        setGoogleConnecting(false);
      } else {
        addToast('Erro: URL de autenticação não foi gerada', 'error');
        setGoogleConnecting(false);
      }
    } catch (error) {
      addToast('Erro ao conectar Google Calendar', 'error');
      setGoogleConnecting(false);
    }
  };
  const handleGoogleDisconnect = async () => {
    if (!organization?.id) return;
    if (!confirm('Deseja realmente desconectar o Google Calendar?')) return;
    try {
      const result = await api.google.disconnect(organization.id);
      if (result.success) {
        addToast('Google Calendar desconectado', 'success');
        loadData();
      } else {
        addToast('Erro ao desconectar', 'error');
      }
    } catch (error) {
      addToast('Erro ao desconectar', 'error');
    }
  };

  const handleGoogleSync = async () => {
    if (!organization?.id) return;
    setGoogleSyncing(true);
    try {
      const response = await fetch('/api/google/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: organization.id, daysAhead: 30 }),
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        addToast(`${data.syncedCount} eventos sincronizados com sucesso!`, 'success');
      } else {
        const error = await response.json();
        addToast(error.error || 'Erro ao sincronizar calendário', 'error');
      }
    } catch (error) {
      addToast('Erro ao sincronizar calendário', 'error');
    } finally {
      setGoogleSyncing(false);
    }
  };

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, []);


  if (loading || !organization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Perfil e Configurações</h1>
        <p className="text-gray-600 dark:text-gray-400">Gerencie as informações da sua organização</p>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('company')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'company'
            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
        >
          Dados da Empresa
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'security'
            ? 'border-indigo-600 text-indigo-600 border-b-2 border-indigo-600'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
        >
          Segurança
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'team'
            ? 'border-indigo-600 text-indigo-600 border-b-2 border-indigo-600'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
        >
          Colaboradores
        </button>
      </div>

      {activeTab === 'company' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#12121d] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Foto de Perfil</h2>
            <div className="flex items-center gap-6">
              <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                {user?.image ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')}${user.image}?t=${imgCacheBuster}`}
                    alt={user.name}
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 group-hover:opacity-75 transition-opacity"
                    onError={(e) => {
                      console.error('Error loading image:', e.currentTarget.src);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 group-hover:border-indigo-500 transition-colors">
                    <User className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black/50 rounded-full p-2">
                    <Edit className="w-5 h-5 text-white" />
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors mb-2"
                >
                  Alterar foto
                </button>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  JPG, GIF ou PNG. Máximo de 5MB.
                </p>
              </div>
            </div>
          </div>
          {/* Basic Info */}
          <div className="bg-white dark:bg-[#12121d] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Informações Básicas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Empresa</label>
                <input
                  type="text"
                  value={companyForm.name}
                  onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })}
                  className="input-primary w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nicho de Atuação</label>
                <input
                  type="text"
                  value={companyForm.niche}
                  onChange={e => setCompanyForm({ ...companyForm, niche: e.target.value })}
                  className="input-primary w-full"
                  placeholder="Ex: Clínica Odontológica"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Comercial</label>
                <input
                  type="email"
                  value={companyForm.email}
                  onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })}
                  className="input-primary w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone</label>
                <input
                  type="text"
                  value={companyForm.phone}
                  onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  className="input-primary w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPF ou CNPJ</label>
                <input
                  type="text"
                  value={companyForm.document}
                  onChange={e => setCompanyForm({ ...companyForm, document: e.target.value })}
                  className="input-primary w-full"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#12121d] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Endereço</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CEP</label>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rua</label>
                <input
                  type="text"
                  value={companyForm.street}
                  onChange={e => setCompanyForm({ ...companyForm, street: e.target.value })}
                  className="input-primary w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número</label>
                <input
                  type="text"
                  value={companyForm.number}
                  onChange={e => setCompanyForm({ ...companyForm, number: e.target.value })}
                  className="input-primary w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bairro</label>
                <input
                  type="text"
                  value={companyForm.neighborhood}
                  onChange={e => setCompanyForm({ ...companyForm, neighborhood: e.target.value })}
                  className="input-primary w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cidade</label>
                <input
                  type="text"
                  value={companyForm.city}
                  onChange={e => setCompanyForm({ ...companyForm, city: e.target.value })}
                  className="input-primary w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
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

          <div className="bg-white dark:bg-[#12121d] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Conexão WhatsApp</h3>
            {organization.whatsappConnected ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-900 dark:text-green-100 flex items-center gap-1">Conectado</p>
                      <p className="text-sm text-green-700 dark:text-green-300">{organization.whatsappPhone}</p>
                      {monitoringStatus?.lastConnected && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Última verificação: {new Date(monitoringStatus.lastConnected).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                  <button onClick={handleDisconnect} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium">
                    Desconectar
                  </button>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-1">Números que receberão alertas:</p>
                  <div className="space-y-1">
                    {monitoringStatus?.alertPhone1 && (
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Empresa:</strong> {formatPhoneForDisplay(monitoringStatus.alertPhone1)}
                      </p>
                    )}
                    {monitoringStatus?.alertPhone2 && (
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>LEXA (Suporte):</strong> {formatPhoneForDisplay(monitoringStatus.alertPhone2)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {!qrCode ? (
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-medium rounded-lg disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {connecting ? (
                      <Loader className="w-5 h-5 animate-spin text-white" />
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                    )}
                    Conectar WhatsApp
                  </button>
                ) : (
                  <div className="text-center">
                    <div className="relative inline-block">
                      <img
                        src={qrCode}
                        alt="QR Code"
                        className={`w-64 h-64 mx-auto border-2 border-gray-200 rounded-lg ${qrTimer === 0 ? 'opacity-20 blur-sm' : ''}`}
                      />
                      {qrTimer === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <button
                            onClick={handleConnectWithAlertPhones}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
                          >
                            Gerar Novo QR Code
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex flex-col items-center gap-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Escaneie com seu WhatsApp</p>
                      {qrTimer > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                          <span className={`text-sm font-bold font-mono ${qrTimer < 10 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                            {qrTimer}s
                          </span>
                          <span className="text-xs text-gray-500">para expirar</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Google Calendar Connection */}
          <div className="bg-white dark:bg-[#12121d] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Integração Google Calendar</h3>
            {organization.googleCalendarEnabled ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold text-blue-900">Conectado</p>
                      <p className="text-sm text-blue-700">Sincronização automática ativa</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleGoogleDisconnect} className="text-red-600 hover:text-red-800 text-sm font-medium">
                      Desconectar
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  Os eventos do Google Calendar são sincronizados automaticamente após a conexão (próximos 30 dias).
                </p>
              </div>
            ) : (
              <div>
                <button
                  onClick={handleGoogleConnect}
                  disabled={googleConnecting}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {googleConnecting ? (
                    <Loader className="w-5 h-5 animate-spin text-gray-600" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <title>Google</title>
                      <g fill="none" fillRule="evenodd">
                        <path
                          d="M20.64 12.2045c0-.6381-.0573-1.2518-.1636-1.8409H12v3.4818h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.6154z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 21c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.8604-3.0477.8604-2.344 0-4.3282-1.5831-5.036-3.7104H3.9574v2.3318C5.4382 18.9832 8.5382 21 12 21z"
                          fill="#34A853"
                        />
                        <path
                          d="M6.964 13.7114c-.1766-.5284-.2775-1.0916-.2775-1.666 0-.5743.1009-1.1375.2775-1.666V8.0477H3.9574c-.615 1.2266-.9657 2.6243-.9657 4.0977 0 1.4735.3507 2.8712.9657 4.0977l3.0066-2.3318z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.0455c1.3214 0 2.5091.4541 3.4405 1.3459l2.5813-2.5813C16.4632 2.3991 14.426 1.5 12 1.5 8.5382 1.5 5.4382 3.5168 3.9574 6.425l3.0066 2.3318c.7078-2.1273 2.692-3.7114 5.036-3.7114z"
                          fill="#EA4335"
                        />
                      </g>
                    </svg>
                  )}
                  Conectar com Google
                </button>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Conecte seu Google Calendar para que a IA verifique sua disponibilidade.
                </p>
              </div>
            )}
          </div>
          {organization.instagramMessagesEnabled && (
            <div className="bg-white dark:bg-[#12121d] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Instagram Direct Messages</h3>
              {organization.instagramAccountId ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-semibold text-purple-900 dark:text-purple-100">Conectado</p>
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          Conta: @{organization.instagramUsername || organization.instagramAccountId}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Deseja realmente desconectar o Instagram?')) {
                          api.instagram.disconnect(organization.id)
                            .then(() => {
                              addToast('Instagram desconectado', 'success');
                              loadData();
                            })
                            .catch(() => addToast('Erro ao desconectar', 'error'));
                        }
                      }}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                    >
                      Desconectar
                    </button>
                  </div>
                  {organization.instagramWelcomeMessage && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mensagem de Boas-vindas:</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{organization.instagramWelcomeMessage}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>

                  <button
                    onClick={() => {
                      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
                      window.location.href = `${backendUrl}/instagram/auth?organizationId=${organization.id}`;
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0095F6] hover:bg-[#0085d6] text-white font-medium rounded-lg transition-colors shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    Conectar com Instagram
                  </button>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Conecte sua conta do Instagram para que a IA possa responder mensagens diretas automaticamente.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">


          <div className="bg-white dark:bg-[#12121d] rounded-lg shadow p-6 max-w-2xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Alterar Senha</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nova Senha</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="input-primary w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar Nova Senha</label>
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
        </div>
      )}

      {activeTab === 'team' && (
        <div className="bg-white dark:bg-[#12121d] rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Colaboradores</h2>
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
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="pb-3 font-semibold text-gray-600 dark:text-gray-400">Nome</th>
                  <th className="pb-3 font-semibold text-gray-600 dark:text-gray-400">Email</th>
                  <th className="pb-3 font-semibold text-gray-600 dark:text-gray-400">Função</th>
                  <th className="pb-3 font-semibold text-gray-600 dark:text-gray-400 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {users.map(user => (
                  <tr key={user.id} className="group hover:bg-gray-50 dark:hover:bg-[#1a1a28]">
                    <td className="py-3 text-gray-900 dark:text-white">{user.name}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">{user.email}</td>
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
                              password: '',
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
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title={editingUser ? 'Editar Colaborador' : 'Novo Colaborador'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Nome</label>
            <input
              type="text"
              value={userForm.name}
              onChange={e => setUserForm({ ...userForm, name: e.target.value })}
              className="input-primary w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Email</label>
            <input
              type="email"
              value={userForm.email}
              onChange={e => setUserForm({ ...userForm, email: e.target.value })}
              className="input-primary w-full"
              disabled={!!editingUser}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Função</label>
            <select
              value={userForm.role}
              onChange={e => {
                const newRole = e.target.value;
                if (newRole === 'ADMIN') {
                  setUserForm({ ...userForm, role: newRole, allowedTabs: availableTabs.map(t => t.id) });
                } else {
                  setUserForm({ ...userForm, role: newRole, allowedTabs: [] });
                }
              }}
              className="input-primary w-full"
            >
              <option value="USER">Usuário</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Permissões de Acesso (Abas)</label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800">
              {availableTabs.map(tab => (
                <label key={tab.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded">
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
                  <span className="text-sm text-gray-700 dark:text-gray-200">{tab.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowUserModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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

      <Modal isOpen={showAlertPhoneModal} onClose={() => setShowAlertPhoneModal(false)} title="Configurar Número de Alerta">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure o número da sua empresa para receber alertas caso o WhatsApp seja desconectado.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Número da Empresa <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={companyPhone}
              onChange={e => setCompanyPhone(e.target.value)}
              placeholder="5511999999999"
              className="input-primary w-full"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Formato: 55 + DDD + número (ex: 5511999999999)
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <Smartphone className="w-4 h-4 inline mr-1" /><strong>Atenção:</strong> Este número receberá os alertas de desconexão juntamente com a LEXA para melhor atendimento e suporte.
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p className="text-sm text-green-900 dark:text-green-100">
              <CircleCheck className="w-4 h-4 inline mr-1" /><strong>LEXA também será notificada</strong> automaticamente para garantir suporte rápido em caso de problemas.
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowAlertPhoneModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConnectWithAlertPhones}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Conectar WhatsApp
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
