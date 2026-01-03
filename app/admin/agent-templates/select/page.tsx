'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import api from '@/app/lib/api-client';
import { Copy, Check, ArrowRight, Info } from 'lucide-react';

interface AgentTemplate {
    id: string;
    name: string;
    description?: string;
    category?: string;
    thumbnail?: string;
    tone: string;
    language: string;
    _count?: {
        states: number;
        knowledge: number;
        followups: number;
        crmStages: number;
    };
}

export default function TemplateSelectionPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const organizationId = searchParams.get('organizationId');

    const [templates, setTemplates] = useState<AgentTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
    const [cloning, setCloning] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
            } else if (!organizationId) {
                router.push('/clientes');
            } else {
                loadTemplates();
            }
        }
    }, [user, authLoading, organizationId, router]);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const data = await api.agentTemplates.list(false); // Apenas ativos
            setTemplates(data);
        } catch (error) {
            console.error('Erro ao carregar templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCloneTemplate = async (template: AgentTemplate) => {
        if (!organizationId) return;

        if (!confirm(`Deseja usar o template "${template.name}" para criar o agente desta organização?`)) {
            return;
        }

        try {
            setCloning(true);
            await api.agentTemplates.clone(template.id, organizationId);

            // Redirecionar para a página de agentes
            router.push(`/agentes?organizationId=${organizationId}`);
        } catch (error: any) {
            console.error('Erro ao clonar template:', error);
            const errorMessage = error.response?.data?.message || 'Erro ao criar agente a partir do template';
            alert(errorMessage);
        } finally {
            setCloning(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando templates...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="w-full">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Escolha um Modelo de Agente
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Selecione um template pré-configurado para começar rapidamente
                    </p>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8 flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-300">
                        <p className="font-medium mb-1">Templates pré-configurados</p>
                        <p>
                            Cada template já vem com personalidade, estados, conhecimento e automações configurados.
                            Você poderá personalizar tudo após a criação.
                        </p>
                    </div>
                </div>

                {/* Templates Grid */}
                {templates.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
                        <div className="text-gray-400 dark:text-gray-500 mb-4">
                            <Copy className="w-16 h-16 mx-auto" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            Nenhum template disponível
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Entre em contato com o administrador para criar templates
                        </p>
                        <button
                            onClick={() => router.push('/clientes')}
                            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                            Voltar para Clientes
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map((template) => (
                            <div
                                key={template.id}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all hover:shadow-xl hover:scale-[1.02] cursor-pointer"
                                onClick={() => setSelectedTemplate(template)}
                            >
                                {/* Thumbnail */}
                                {template.thumbnail ? (
                                    <img
                                        src={template.thumbnail}
                                        alt={template.name}
                                        className="w-full h-48 object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-48 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                                        <Copy className="w-16 h-16 text-white opacity-70" />
                                    </div>
                                )}

                                {/* Content */}
                                <div className="p-6">
                                    <div className="mb-3">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                            {template.name}
                                        </h3>
                                        {template.category && (
                                            <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-sm font-medium rounded-full">
                                                {template.category}
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 min-h-[3rem]">
                                        {template.description || 'Template pré-configurado para uso imediato'}
                                    </p>

                                    {/* Features */}
                                    <div className="space-y-2 mb-4 text-sm">
                                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                            <Check className="w-4 h-4 text-green-600" />
                                            <span>{template._count?.states || 0} estados configurados</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                            <Check className="w-4 h-4 text-green-600" />
                                            <span>{template._count?.knowledge || 0} itens de conhecimento</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                            <Check className="w-4 h-4 text-green-600" />
                                            <span>{template._count?.followups || 0} follow-ups automáticos</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                            <Check className="w-4 h-4 text-green-600" />
                                            <span>{template._count?.crmStages || 0} etapas de CRM</span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCloneTemplate(template);
                                        }}
                                        disabled={cloning}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
                                    >
                                        {cloning ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Criando agente...
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-5 h-5" />
                                                Usar este modelo
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Back Button */}
                <div className="mt-8 text-center">
                    <button
                        onClick={() => router.push('/clientes')}
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        ← Voltar para Clientes
                    </button>
                </div>
            </div>
        </div>
    );
}
