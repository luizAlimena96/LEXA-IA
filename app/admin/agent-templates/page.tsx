'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import api from '@/app/lib/api-client';
import { Plus, Edit2, Trash2, Copy } from 'lucide-react';

interface AgentTemplate {
    id: string;
    name: string;
    description?: string;
    category?: string;
    thumbnail?: string;
    isActive: boolean;
    createdAt: string;
    _count?: {
        states: number;
        knowledge: number;
        followups: number;
        crmStages: number;
    };
}

export default function AgentTemplatesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [templates, setTemplates] = useState<AgentTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<AgentTemplate | null>(null);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
            } else if (user.role !== 'SUPER_ADMIN') {
                router.push('/dashboard');
            } else {
                loadTemplates();
            }
        }
    }, [user, authLoading, router]);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const data = await api.agentTemplates.list(true);
            setTemplates(data);
        } catch (error) {
            console.error('Erro ao carregar templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja deletar este template?')) return;

        try {
            await api.agentTemplates.delete(id);
            await loadTemplates();
        } catch (error) {
            console.error('Erro ao deletar template:', error);
            alert('Erro ao deletar template');
        }
    };

    const handleToggleActive = async (template: AgentTemplate) => {
        try {
            await api.agentTemplates.update(template.id, {
                isActive: !template.isActive,
            });
            await loadTemplates();
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            alert('Erro ao atualizar status do template');
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="w-full">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Modelos de Agentes
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Gerencie templates pré-configurados para criação rápida de agentes
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/admin/agent-templates/create')}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Criar Template
                    </button>
                </div>

                {/* Templates Grid */}
                {templates.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
                        <div className="text-gray-400 dark:text-gray-500 mb-4">
                            <Copy className="w-16 h-16 mx-auto" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            Nenhum template criado
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Crie seu primeiro template de agente para facilitar o onboarding de novos clientes
                        </p>
                        <button
                            onClick={() => router.push('/admin/agent-templates/create')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Criar Primeiro Template
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map((template) => (
                            <div
                                key={template.id}
                                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg ${!template.isActive ? 'opacity-60' : ''
                                    }`}
                            >
                                {/* Thumbnail */}
                                {template.thumbnail ? (
                                    <img
                                        src={template.thumbnail}
                                        alt={template.name}
                                        className="w-full h-40 object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-40 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                        <Copy className="w-12 h-12 text-white opacity-50" />
                                    </div>
                                )}

                                {/* Content */}
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                                {template.name}
                                            </h3>
                                            {template.category && (
                                                <span className="inline-block px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded">
                                                    {template.category}
                                                </span>
                                            )}
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={template.isActive}
                                                onChange={() => handleToggleActive(template)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>

                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                        {template.description || 'Sem descrição'}
                                    </p>

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-gray-600 dark:text-gray-400">
                                        <div>Estados: {template._count?.states || 0}</div>
                                        <div>Conhecimento: {template._count?.knowledge || 0}</div>
                                        <div>Follow-ups: {template._count?.followups || 0}</div>
                                        <div>Etapas CRM: {template._count?.crmStages || 0}</div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => router.push(`/admin/agent-templates/${template.id}/edit`)}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(template.id)}
                                            className="px-3 py-2 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-700 dark:text-red-300 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
