'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/api-client';

type DataType = 'leads' | 'followups' | 'knowledge' | 'states' | 'appointments' | 'conversations';

export default function SuperAdminDataPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [organizations, setOrganizations] = useState<any[]>([]);
    const [selectedOrg, setSelectedOrg] = useState<string>('');
    const [dataType, setDataType] = useState<DataType>('leads');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

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
        return <div className="p-8">Carregando...</div>;
    }

    if (user?.role !== 'SUPER_ADMIN') {
        return null;
    }

    const selectedOrgData = organizations.find((o) => o.id === selectedOrg);

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2 dark:text-white">🔧 Super Admin - Dados Multi-Tenant</h1>
                <p className="text-gray-600 dark:text-gray-400">Visualize e gerencie dados de todas as organizações</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Organização</label>
                <select
                    value={selectedOrg}
                    onChange={(e) => setSelectedOrg(e.target.value)}
                    className="w-full p-3 border rounded-lg text-lg font-medium dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                    {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                            {org.name} ({org.slug})
                        </option>
                    ))}
                </select>

                {selectedOrgData && (
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Email:</span>{' '}
                            <span className="font-medium dark:text-white">{selectedOrgData.email || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">WhatsApp:</span>{' '}
                            <span
                                className={`font - medium ${selectedOrgData.whatsappConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                    } `}
                            >
                                {selectedOrgData.whatsappConnected ? 'Conectado' : 'Desconectado'}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">CRM:</span>{' '}
                            <span
                                className={`font - medium ${selectedOrgData.crmEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
                                    } `}
                            >
                                {selectedOrgData.crmEnabled ? selectedOrgData.crmType : 'Desabilitado'}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
                <div className="flex border-b dark:border-gray-700 overflow-x-auto">
                    {[
                        { key: 'leads', label: 'Leads', icon: '👥' },
                        { key: 'followups', label: 'Follow-ups', icon: '📨' },
                        { key: 'knowledge', label: 'Conhecimento', icon: '📚' },
                        { key: 'states', label: 'Estados FSM', icon: '🔄' },
                        { key: 'appointments', label: 'Agendamentos', icon: '📅' },
                        { key: 'conversations', label: 'Conversas', icon: '💬' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setDataType(tab.key as DataType)}
                            className={`px - 6 py - 4 font - medium whitespace - nowrap ${dataType === tab.key
                                    ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                } `}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="text-center py-8 dark:text-gray-300">Carregando...</div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold dark:text-white">
                                    {data.length} {dataType}
                                </h2>
                                <button
                                    onClick={loadData}
                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    🔄 Atualizar
                                </button>
                            </div>

                            {data.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                    Nenhum registro encontrado
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                {dataType === 'leads' && (
                                                    <>
                                                        <th className="p-3 text-left dark:text-gray-300">Nome</th>
                                                        <th className="p-3 text-left dark:text-gray-300">Telefone</th>
                                                        <th className="p-3 text-left dark:text-gray-300">Email</th>
                                                        <th className="p-3 text-left dark:text-gray-300">Status</th>
                                                        <th className="p-3 text-left dark:text-gray-300">Estado</th>
                                                        <th className="p-3 text-left dark:text-gray-300">Criado</th>
                                                    </>
                                                )}
                                                {dataType === 'followups' && (
                                                    <>
                                                        <th className="p-3 text-left dark:text-gray-300">Nome</th>
                                                        <th className="p-3 text-left dark:text-gray-300">Delay (h)</th>
                                                        <th className="p-3 text-left dark:text-gray-300">Tipo Mídia</th>
                                                        <th className="p-3 text-left dark:text-gray-300">Horário Comercial</th>
                                                        <th className="p-3 text-left dark:text-gray-300">IA Decision</th>
                                                        <th className="p-3 text-left dark:text-gray-300">Ativo</th>
                                                    </>
                                                )}
                                                {dataType === 'knowledge' && (
                                                    <>
                                                        <th className="p-3 text-left dark:text-gray-300">Título</th>
                                                        <th className="p-3 text-left dark:text-gray-300">Tipo</th>
                                                        <th className="p-3 text-left dark:text-gray-300">Conteúdo</th>
                                                        <th className="p-3 text-left dark:text-gray-300">Criado</th>
                                                    </>
                                                )}
                                                {dataType === 'states' && (
                                                    <>
                                                        <th className="p-3 text-left dark:text-gray-300">Nome</th>
                                                        <th className="p-3 text-left dark:text-gray-300">Missão</th>
                                                        <th className="p-3 text-left dark:text-gray-300">Ordem</th>
                                                        <th className="p-3 text-left dark:text-gray-300">Criado</th>
                                                    </>
                                                )}
                                                {dataType === 'appointments' && (
                                                    <>
                                                        <th className="p-3 text-left dark:text-gray-300">Título</th>
                                                        <th className="p-3 text-left dark:text-gray-300">Lead</th>
                                                        <th className="p-3 text-left dark:text-gray-300">Data/Hora</th>
                                                        <th className="p-3 text-left dark:text-gray-300">Status</th>
                                                        <th className="p-3 text-left dark:text-gray-300">Duração</th>
                                                    </>
                                                )}
                                                {dataType === 'conversations' && (
                                                    <>
                                                        <th className="p-3 text-left dark:text-gray-300">WhatsApp</th>
                                                        <th className="p-3 text-left dark:text-gray-300">Lead</th>
                                                        <th className="p-3 text-left dark:text-gray-300">Mensagens</th>
                                                        <th className="p-3 text-left dark:text-gray-300">Última Atualização</th>
                                                    </>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y dark:divide-gray-700">
                                            {data.map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    {dataType === 'leads' && (
                                                        <>
                                                            <td className="p-3 dark:text-gray-300">{item.name || 'N/A'}</td>
                                                            <td className="p-3 font-mono text-xs dark:text-gray-300">{item.phone}</td>
                                                            <td className="p-3 dark:text-gray-300">{item.email || 'N/A'}</td>
                                                            <td className="p-3">
                                                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-xs dark:text-blue-300">
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 dark:text-gray-300">{item.currentState}</td>
                                                            <td className="p-3 text-xs text-gray-500 dark:text-gray-400">
                                                                {new Date(item.createdAt).toLocaleString('pt-BR')}
                                                            </td>
                                                        </>
                                                    )}
                                                    {dataType === 'followups' && (
                                                        <>
                                                            <td className="p-3 font-medium dark:text-gray-300">{item.name}</td>
                                                            <td className="p-3 dark:text-gray-300">{item.delayHours}h</td>
                                                            <td className="p-3 dark:text-gray-300">{item.mediaType}</td>
                                                            <td className="p-3">
                                                                {item.respectBusinessHours ? '✅' : '❌'}
                                                            </td>
                                                            <td className="p-3">
                                                                {item.aiDecisionEnabled ? '✅' : '❌'}
                                                            </td>
                                                            <td className="p-3">
                                                                {item.isActive ? (
                                                                    <span className="text-green-600 dark:text-green-400">✓ Ativo</span>
                                                                ) : (
                                                                    <span className="text-red-600 dark:text-red-400">✗ Inativo</span>
                                                                )}
                                                            </td>
                                                        </>
                                                    )}
                                                    {dataType === 'knowledge' && (
                                                        <>
                                                            <td className="p-3 font-medium dark:text-gray-300">{item.title}</td>
                                                            <td className="p-3">
                                                                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded text-xs dark:text-purple-300">
                                                                    {item.type}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 max-w-md truncate dark:text-gray-300">{item.content}</td>
                                                            <td className="p-3 text-xs text-gray-500 dark:text-gray-400">
                                                                {new Date(item.createdAt).toLocaleString('pt-BR')}
                                                            </td>
                                                        </>
                                                    )}
                                                    {dataType === 'states' && (
                                                        <>
                                                            <td className="p-3 font-medium dark:text-gray-300">{item.name}</td>
                                                            <td className="p-3 max-w-md truncate dark:text-gray-300">{item.mission}</td>
                                                            <td className="p-3 dark:text-gray-300">{item.order}</td>
                                                            <td className="p-3 text-xs text-gray-500 dark:text-gray-400">
                                                                {new Date(item.createdAt).toLocaleString('pt-BR')}
                                                            </td>
                                                        </>
                                                    )}
                                                    {dataType === 'appointments' && (
                                                        <>
                                                            <td className="p-3 font-medium dark:text-gray-300">{item.title}</td>
                                                            <td className="p-3 dark:text-gray-300">{item.lead?.name || 'N/A'}</td>
                                                            <td className="p-3 text-xs dark:text-gray-300">
                                                                {new Date(item.scheduledAt).toLocaleString('pt-BR')}
                                                            </td>
                                                            <td className="p-3">
                                                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded text-xs dark:text-green-300">
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 dark:text-gray-300">{item.duration}min</td>
                                                        </>
                                                    )}
                                                    {dataType === 'conversations' && (
                                                        <>
                                                            <td className="p-3 font-mono text-xs dark:text-gray-300">{item.whatsapp}</td>
                                                            <td className="p-3 dark:text-gray-300">{item.lead?.name || 'N/A'}</td>
                                                            <td className="p-3 dark:text-gray-300">{item._count?.messages || 0}</td>
                                                            <td className="p-3 text-xs text-gray-500 dark:text-gray-400">
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
