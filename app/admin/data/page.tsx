'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type DataType = 'leads' | 'followups' | 'knowledge' | 'states' | 'appointments' | 'conversations';

export default function SuperAdminDataPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [organizations, setOrganizations] = useState<any[]>([]);
    const [selectedOrg, setSelectedOrg] = useState<string>('');
    const [dataType, setDataType] = useState<DataType>('leads');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (session?.user?.role !== 'SUPER_ADMIN') {
            router.push('/');
        } else {
            loadOrganizations();
        }
    }, [status, session]);

    const loadOrganizations = async () => {
        try {
            const res = await fetch('/api/organizations');
            const orgs = await res.json();
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
            const res = await fetch(`/api/admin/data?orgId=${selectedOrg}&type=${dataType}`);
            const result = await res.json();
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

    if (status === 'loading') {
        return <div className="p-8">Carregando...</div>;
    }

    if (session?.user?.role !== 'SUPER_ADMIN') {
        return null;
    }

    const selectedOrgData = organizations.find((o) => o.id === selectedOrg);

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">🔧 Super Admin - Dados Multi-Tenant</h1>
                <p className="text-gray-600">Visualize e gerencie dados de todas as organizações</p>
            </div>

            {/* Organization Selector */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <label className="block text-sm font-medium mb-2">Organização</label>
                <select
                    value={selectedOrg}
                    onChange={(e) => setSelectedOrg(e.target.value)}
                    className="w-full p-3 border rounded-lg text-lg font-medium"
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
                            <span className="text-gray-600">Email:</span>{' '}
                            <span className="font-medium">{selectedOrgData.email || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">WhatsApp:</span>{' '}
                            <span
                                className={`font-medium ${selectedOrgData.whatsappConnected ? 'text-green-600' : 'text-red-600'
                                    }`}
                            >
                                {selectedOrgData.whatsappConnected ? 'Conectado' : 'Desconectado'}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600">CRM:</span>{' '}
                            <span
                                className={`font-medium ${selectedOrgData.crmEnabled ? 'text-green-600' : 'text-gray-400'
                                    }`}
                            >
                                {selectedOrgData.crmEnabled ? selectedOrgData.crmType : 'Desabilitado'}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Data Type Tabs */}
            <div className="bg-white rounded-lg shadow mb-6">
                <div className="flex border-b overflow-x-auto">
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
                            className={`px-6 py-4 font-medium whitespace-nowrap ${dataType === tab.key
                                    ? 'border-b-2 border-blue-600 text-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="text-center py-8">Carregando...</div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">
                                    {data.length} {dataType}
                                </h2>
                                <button
                                    onClick={loadData}
                                    className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                >
                                    🔄 Atualizar
                                </button>
                            </div>

                            {data.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    Nenhum registro encontrado
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                {dataType === 'leads' && (
                                                    <>
                                                        <th className="p-3 text-left">Nome</th>
                                                        <th className="p-3 text-left">Telefone</th>
                                                        <th className="p-3 text-left">Email</th>
                                                        <th className="p-3 text-left">Status</th>
                                                        <th className="p-3 text-left">Estado</th>
                                                        <th className="p-3 text-left">Criado</th>
                                                    </>
                                                )}
                                                {dataType === 'followups' && (
                                                    <>
                                                        <th className="p-3 text-left">Nome</th>
                                                        <th className="p-3 text-left">Delay (h)</th>
                                                        <th className="p-3 text-left">Tipo Mídia</th>
                                                        <th className="p-3 text-left">Horário Comercial</th>
                                                        <th className="p-3 text-left">IA Decision</th>
                                                        <th className="p-3 text-left">Ativo</th>
                                                    </>
                                                )}
                                                {dataType === 'knowledge' && (
                                                    <>
                                                        <th className="p-3 text-left">Título</th>
                                                        <th className="p-3 text-left">Tipo</th>
                                                        <th className="p-3 text-left">Conteúdo</th>
                                                        <th className="p-3 text-left">Criado</th>
                                                    </>
                                                )}
                                                {dataType === 'states' && (
                                                    <>
                                                        <th className="p-3 text-left">Nome</th>
                                                        <th className="p-3 text-left">Missão</th>
                                                        <th className="p-3 text-left">Ordem</th>
                                                        <th className="p-3 text-left">Criado</th>
                                                    </>
                                                )}
                                                {dataType === 'appointments' && (
                                                    <>
                                                        <th className="p-3 text-left">Título</th>
                                                        <th className="p-3 text-left">Lead</th>
                                                        <th className="p-3 text-left">Data/Hora</th>
                                                        <th className="p-3 text-left">Status</th>
                                                        <th className="p-3 text-left">Duração</th>
                                                    </>
                                                )}
                                                {dataType === 'conversations' && (
                                                    <>
                                                        <th className="p-3 text-left">WhatsApp</th>
                                                        <th className="p-3 text-left">Lead</th>
                                                        <th className="p-3 text-left">Mensagens</th>
                                                        <th className="p-3 text-left">Última Atualização</th>
                                                    </>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {data.map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-50">
                                                    {dataType === 'leads' && (
                                                        <>
                                                            <td className="p-3">{item.name || 'N/A'}</td>
                                                            <td className="p-3 font-mono text-xs">{item.phone}</td>
                                                            <td className="p-3">{item.email || 'N/A'}</td>
                                                            <td className="p-3">
                                                                <span className="px-2 py-1 bg-blue-100 rounded text-xs">
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                            <td className="p-3">{item.currentState}</td>
                                                            <td className="p-3 text-xs text-gray-500">
                                                                {new Date(item.createdAt).toLocaleString('pt-BR')}
                                                            </td>
                                                        </>
                                                    )}
                                                    {dataType === 'followups' && (
                                                        <>
                                                            <td className="p-3 font-medium">{item.name}</td>
                                                            <td className="p-3">{item.delayHours}h</td>
                                                            <td className="p-3">{item.mediaType}</td>
                                                            <td className="p-3">
                                                                {item.respectBusinessHours ? '✅' : '❌'}
                                                            </td>
                                                            <td className="p-3">
                                                                {item.aiDecisionEnabled ? '✅' : '❌'}
                                                            </td>
                                                            <td className="p-3">
                                                                {item.isActive ? (
                                                                    <span className="text-green-600">✓ Ativo</span>
                                                                ) : (
                                                                    <span className="text-red-600">✗ Inativo</span>
                                                                )}
                                                            </td>
                                                        </>
                                                    )}
                                                    {dataType === 'knowledge' && (
                                                        <>
                                                            <td className="p-3 font-medium">{item.title}</td>
                                                            <td className="p-3">
                                                                <span className="px-2 py-1 bg-purple-100 rounded text-xs">
                                                                    {item.type}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 max-w-md truncate">{item.content}</td>
                                                            <td className="p-3 text-xs text-gray-500">
                                                                {new Date(item.createdAt).toLocaleString('pt-BR')}
                                                            </td>
                                                        </>
                                                    )}
                                                    {dataType === 'states' && (
                                                        <>
                                                            <td className="p-3 font-medium">{item.name}</td>
                                                            <td className="p-3 max-w-md truncate">{item.mission}</td>
                                                            <td className="p-3">{item.order}</td>
                                                            <td className="p-3 text-xs text-gray-500">
                                                                {new Date(item.createdAt).toLocaleString('pt-BR')}
                                                            </td>
                                                        </>
                                                    )}
                                                    {dataType === 'appointments' && (
                                                        <>
                                                            <td className="p-3 font-medium">{item.title}</td>
                                                            <td className="p-3">{item.lead?.name || 'N/A'}</td>
                                                            <td className="p-3 text-xs">
                                                                {new Date(item.scheduledAt).toLocaleString('pt-BR')}
                                                            </td>
                                                            <td className="p-3">
                                                                <span className="px-2 py-1 bg-green-100 rounded text-xs">
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                            <td className="p-3">{item.duration}min</td>
                                                        </>
                                                    )}
                                                    {dataType === 'conversations' && (
                                                        <>
                                                            <td className="p-3 font-mono text-xs">{item.whatsapp}</td>
                                                            <td className="p-3">{item.lead?.name || 'N/A'}</td>
                                                            <td className="p-3">{item._count?.messages || 0}</td>
                                                            <td className="p-3 text-xs text-gray-500">
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
