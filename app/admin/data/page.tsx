'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/api-client';
type DataType = 'leads' | 'followups' | 'knowledge' | 'states' | 'appointments' | 'conversations';

const dataTypeConfig = {
    leads: { label: 'Leads', color: 'blue' },
    followups: { label: 'Follow-ups', color: 'purple' },
    knowledge: { label: 'Conhecimento', color: 'green' },
    states: { label: 'Estados FSM', color: 'orange' },
    appointments: { label: 'Agendamentos', color: 'pink' },
    conversations: { label: 'Conversas', color: 'indigo' },
};

import ChangePasswordModal from '../components/ChangePasswordModal';

export default function SuperAdminDataPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [organizations, setOrganizations] = useState<any[]>([]);
    const [selectedOrg, setSelectedOrg] = useState<string>('');
    const [dataType, setDataType] = useState<DataType>('leads');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // Global Settings State
    const [lexaPhone, setLexaPhone] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    useEffect(() => {
        if (user) {
            if (user.email) setAdminEmail(user.email);
            if (user.phone) setLexaPhone(user.phone);
        }
    }, [user]);

    const handleSaveSettings = async () => {
        setIsSavingSettings(true);
        try {
            // Save Settings to User Profile
            await api.users.updateProfile({
                email: adminEmail,
                phone: lexaPhone
            });

            // Update local user context if method exists (assuming reloadUser or similar)
            // If not available, next page reload will fetch updated data

            alert('Configurações salvas com sucesso!');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Erro ao salvar configurações.');
        } finally {
            setIsSavingSettings(false);
        }
    };

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (!authLoading && user?.role !== 'SUPER_ADMIN') {
            router.push('/');
        } else if (!authLoading && user?.role === 'SUPER_ADMIN') {
            loadOrganizations();
        }
    }, [authLoading, user, router]);

    const loadOrganizations = async () => {
        try {
            const orgs = await api.organizations.list();
            setOrganizations(orgs);
            if (orgs.length > 0) {
                setSelectedOrg(orgs[0].id);
            }
        } catch (error) {
            console.error('Error loading organizations:', error);
        }
    };

    const loadData = async () => {
        if (!selectedOrg) return;

        setLoading(true);
        try {
            const result = await api.admin.getData(selectedOrg, dataType);
            setData(result);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedOrg) {
            loadData();
        }
    }, [selectedOrg, dataType]);

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (user?.role !== 'SUPER_ADMIN') {
        return null;
    }

    const selectedOrgData = organizations.find((o) => o.id === selectedOrg);
    const config = dataTypeConfig[dataType];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Super Admin
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Gerencie dados e configurações do sistema
                    </p>
                </div>
                <button
                    onClick={() => setShowPasswordModal(true)}
                    className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm text-sm font-medium"
                >
                    Alterar Senha
                </button>
            </div>

            {/* Global Settings Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Configurações do Sistema</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Telefone da Lexa (WhatsApp)
                        </label>
                        <input
                            type="text"
                            value={lexaPhone}
                            onChange={(e) => setLexaPhone(e.target.value)}
                            placeholder="+55..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email do Super Admin
                        </label>
                        <input
                            type="email"
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={handleSaveSettings}
                        disabled={isSavingSettings}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        {isSavingSettings ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                </div>
            </div>

            {showPasswordModal && (
                <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
            )}

            {/* Organization Selector Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Organização
                </label>
                <select
                    value={selectedOrg}
                    onChange={(e) => setSelectedOrg(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                    {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                            {org.name} ({org.slug})
                        </option>
                    ))}
                </select>

                {selectedOrgData && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Email */}
                        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {selectedOrgData.email || 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* WhatsApp Status */}
                        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400">WhatsApp</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-sm font-medium ${selectedOrgData.whatsappConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {selectedOrgData.whatsappConnected ? 'Conectado' : 'Desconectado'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* CRM Status */}
                        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400">CRM</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                                    {selectedOrgData.crmEnabled ? selectedOrgData.crmType : 'Desabilitado'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Data Type Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                    {(Object.entries(dataTypeConfig) as [DataType, typeof dataTypeConfig[DataType]][]).map(([key, config]) => {
                        const isActive = dataType === key;

                        return (
                            <button
                                key={key}
                                onClick={() => setDataType(key)}
                                className={`
                                    flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-all
                                    ${isActive
                                        ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }
                                `}
                            >
                                <span>{config.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-gray-500 dark:text-gray-400">Carregando dados...</p>
                        </div>
                    ) : (
                        <>
                            {/* Header with count and refresh */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {data.length} {config.label}
                                    </h2>
                                </div>
                                <button
                                    onClick={loadData}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Atualizar
                                </button>
                            </div>

                            {data.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                                        Nenhum registro encontrado
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                                            <tr>
                                                {dataType === 'leads' && (
                                                    <>
                                                        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Nome</th>
                                                        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Telefone</th>
                                                        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Email</th>
                                                        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                                        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Estado</th>
                                                        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Criado</th>
                                                    </>
                                                )}
                                                {dataType === 'followups' && (
                                                    <>
                                                        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Nome</th>
                                                        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Delay (h)</th>
                                                        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Tipo Mídia</th>
                                                        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Horário Comercial</th>
                                                        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">IA Decision</th>
                                                        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                                    </>
                                                )}
                                                {dataType === 'knowledge' && (
                                                    <>
                                                        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Título</th>
                                                        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Tipo</th>
                                                        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Conteúdo</th>
                                                        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Criado</th>
                                                    </>
                                                )}
                                                {dataType === 'states' && (
                                                    <>
                                                        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Nome</th>
                                                        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Missão</th>
                                                        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Ordem</th>
                                                        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Criado</th>
                                                    </>
                                                )}
                                                {dataType === 'appointments' && (
                                                    <>
                                                        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Título</th>
                                                        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Lead</th>
                                                        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Data/Hora</th>
                                                        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                                        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Duração</th>
                                                    </>
                                                )}
                                                {dataType === 'conversations' && (
                                                    <>
                                                        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">WhatsApp</th>
                                                        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Lead</th>
                                                        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Mensagens</th>
                                                        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Última Atualização</th>
                                                    </>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {data.map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                                    {dataType === 'leads' && (
                                                        <>
                                                            <td className="p-4 font-medium text-gray-900 dark:text-gray-100">{item.name || 'N/A'}</td>
                                                            <td className="p-4 font-mono text-xs text-gray-600 dark:text-gray-400">{item.phone}</td>
                                                            <td className="p-4 text-gray-600 dark:text-gray-400">{item.email || 'N/A'}</td>
                                                            <td className="p-4">
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-gray-600 dark:text-gray-400">{item.currentState}</td>
                                                            <td className="p-4 text-xs text-gray-500 dark:text-gray-400">
                                                                {new Date(item.createdAt).toLocaleString('pt-BR')}
                                                            </td>
                                                        </>
                                                    )}
                                                    {dataType === 'followups' && (
                                                        <>
                                                            <td className="p-4 font-medium text-gray-900 dark:text-gray-100">{item.name}</td>
                                                            <td className="p-4 text-gray-600 dark:text-gray-400">{item.delayHours}h</td>
                                                            <td className="p-4 text-gray-600 dark:text-gray-400">{item.mediaType}</td>
                                                            <td className="p-4 text-gray-600 dark:text-gray-400">
                                                                {item.respectBusinessHours ? 'Sim' : 'Não'}
                                                            </td>
                                                            <td className="p-4 text-gray-600 dark:text-gray-400">
                                                                {item.aiDecisionEnabled ? 'Sim' : 'Não'}
                                                            </td>
                                                            <td className="p-4">
                                                                <span className={`inline-flex items-center gap-1 text-sm font-medium ${item.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                                    {item.isActive ? 'Ativo' : 'Inativo'}
                                                                </span>
                                                            </td>
                                                        </>
                                                    )}
                                                    {dataType === 'knowledge' && (
                                                        <>
                                                            <td className="p-4 font-medium text-gray-900 dark:text-gray-100">{item.title}</td>
                                                            <td className="p-4">
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                                                                    {item.type}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 max-w-md truncate text-gray-600 dark:text-gray-400">{item.content}</td>
                                                            <td className="p-4 text-xs text-gray-500 dark:text-gray-400">
                                                                {new Date(item.createdAt).toLocaleString('pt-BR')}
                                                            </td>
                                                        </>
                                                    )}
                                                    {dataType === 'states' && (
                                                        <>
                                                            <td className="p-4 font-medium text-gray-900 dark:text-gray-100">{item.name}</td>
                                                            <td className="p-4 max-w-md truncate text-gray-600 dark:text-gray-400">{item.mission}</td>
                                                            <td className="p-4 text-gray-600 dark:text-gray-400">{item.order}</td>
                                                            <td className="p-4 text-xs text-gray-500 dark:text-gray-400">
                                                                {new Date(item.createdAt).toLocaleString('pt-BR')}
                                                            </td>
                                                        </>
                                                    )}
                                                    {dataType === 'appointments' && (
                                                        <>
                                                            <td className="p-4 font-medium text-gray-900 dark:text-gray-100">{item.title}</td>
                                                            <td className="p-4 text-gray-600 dark:text-gray-400">{item.lead?.name || 'N/A'}</td>
                                                            <td className="p-4 text-xs text-gray-600 dark:text-gray-400">
                                                                {new Date(item.scheduledAt).toLocaleString('pt-BR')}
                                                            </td>
                                                            <td className="p-4">
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-gray-600 dark:text-gray-400">{item.duration}min</td>
                                                        </>
                                                    )}
                                                    {dataType === 'conversations' && (
                                                        <>
                                                            <td className="p-4 font-mono text-xs text-gray-600 dark:text-gray-400">{item.whatsapp}</td>
                                                            <td className="p-4 text-gray-600 dark:text-gray-400">{item.lead?.name || 'N/A'}</td>
                                                            <td className="p-4 text-gray-600 dark:text-gray-400">{item._count?.messages || 0}</td>
                                                            <td className="p-4 text-xs text-gray-500 dark:text-gray-400">
                                                                {new Date(item.updatedAt).toLocaleString('pt-BR')}
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
