'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/api-client';
import {
    Users,
    Send,
    BookOpen,
    GitBranch,
    Calendar,
    MessageSquare,
    RefreshCw,
    Building2,
    Mail,
    Phone,
    CheckCircle2,
    XCircle,
    Database
} from 'lucide-react';

type DataType = 'leads' | 'followups' | 'knowledge' | 'states' | 'appointments' | 'conversations';

const dataTypeConfig = {
    leads: { label: 'Leads', icon: Users, color: 'blue' },
    followups: { label: 'Follow-ups', icon: Send, color: 'purple' },
    knowledge: { label: 'Conhecimento', icon: BookOpen, color: 'green' },
    states: { label: 'Estados FSM', icon: GitBranch, color: 'orange' },
    appointments: { label: 'Agendamentos', icon: Calendar, color: 'pink' },
    conversations: { label: 'Conversas', icon: MessageSquare, color: 'indigo' },
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
    const Icon = config.icon;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Database className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Super Admin
                        </h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                        Visualize e gerencie dados de todas as organizações
                    </p>
                </div>
                <button
                    onClick={() => setShowPasswordModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Alterar Senha
                    </div>
                </button>
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
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {selectedOrgData.email || 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* WhatsApp Status */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <Phone className="w-5 h-5 text-gray-400" />
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400">WhatsApp</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {selectedOrgData.whatsappConnected ? (
                                        <>
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                                Conectado
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-4 h-4 text-red-500" />
                                            <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                                Desconectado
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* CRM Status */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <Building2 className="w-5 h-5 text-gray-400" />
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
                        const TabIcon = config.icon;
                        const isActive = dataType === key;

                        return (
                            <button
                                key={key}
                                onClick={() => setDataType(key)}
                                className={`
                                    flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-all
                                    ${isActive
                                        ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }
                                `}
                            >
                                <TabIcon className="w-5 h-5" />
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
                                    <Icon className={`w-6 h-6 text-${config.color}-600`} />
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {data.length} {config.label}
                                    </h2>
                                </div>
                                <button
                                    onClick={loadData}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Atualizar
                                </button>
                            </div>

                            {data.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <Icon className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
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
                                                            <td className="p-4">
                                                                {item.respectBusinessHours ? (
                                                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                                ) : (
                                                                    <XCircle className="w-5 h-5 text-gray-300" />
                                                                )}
                                                            </td>
                                                            <td className="p-4">
                                                                {item.aiDecisionEnabled ? (
                                                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                                ) : (
                                                                    <XCircle className="w-5 h-5 text-gray-300" />
                                                                )}
                                                            </td>
                                                            <td className="p-4">
                                                                {item.isActive ? (
                                                                    <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400">
                                                                        <CheckCircle2 className="w-4 h-4" />
                                                                        Ativo
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400">
                                                                        <XCircle className="w-4 h-4" />
                                                                        Inativo
                                                                    </span>
                                                                )}
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
