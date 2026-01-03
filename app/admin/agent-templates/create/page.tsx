'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import api from '@/app/lib/api-client';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

export default function CreateTemplatePage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        thumbnail: '',
        tone: 'FRIENDLY' as 'FRIENDLY' | 'PROFESSIONAL' | 'CASUAL' | 'FORMAL',
        language: 'pt-BR',
        personality: '',
        prohibitions: '',
        writingStyle: '',
        messageBufferEnabled: false,
        messageBufferDelayMs: 2000,
        audioResponseEnabled: true,
        aiControlEnabled: false,
        aiDisableEmoji: '',
        dataExtractionPrompt: '',
        fsmDataExtractorPrompt: '',
        fsmStateDeciderPrompt: '',
        fsmValidatorPrompt: '',
        isPublic: true,
        isActive: true,
    });

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
            } else if (user.role !== 'SUPER_ADMIN') {
                router.push('/dashboard');
            }
        }
    }, [user, authLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name) {
            alert('Nome do template é obrigatório');
            return;
        }

        try {
            setSaving(true);
            const template = await api.agentTemplates.create(formData);
            // Redirecionar para a página de edição para configurar o resto
            router.push(`/admin/agent-templates/${template.id}/edit`);
        } catch (error: any) {
            console.error('Erro ao criar template:', error);
            alert(error.response?.data?.message || 'Erro ao criar template');
        } finally {
            setSaving(false);
        }
    };

    if (authLoading) {
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
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/admin/agent-templates')}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para Templates
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Criar Novo Template
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Configure as informações básicas. Após criar, você poderá adicionar estados, conhecimento e outras configurações avançadas.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
                    {/* Informações Básicas */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            Informações Básicas
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nome do Template *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Ex: Agente de Vendas"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Categoria
                                </label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Ex: Vendas, Suporte, Agendamento"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Descrição
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Descreva o propósito deste template..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Tom de Voz
                                </label>
                                <select
                                    value={formData.tone}
                                    onChange={(e) => setFormData({ ...formData, tone: e.target.value as any })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="FRIENDLY">Amigável</option>
                                    <option value="PROFESSIONAL">Profissional</option>
                                    <option value="CASUAL">Casual</option>
                                    <option value="FORMAL">Formal</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Idioma
                                </label>
                                <input
                                    type="text"
                                    value={formData.language}
                                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="pt-BR"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Personalidade */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            Personalidade e Estilo
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Personalidade
                                </label>
                                <textarea
                                    value={formData.personality}
                                    onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Descreva a personalidade do agente..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Proibições
                                </label>
                                <textarea
                                    value={formData.prohibitions}
                                    onChange={(e) => setFormData({ ...formData, prohibitions: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="O que o agente NÃO deve fazer..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Estilo de Escrita
                                </label>
                                <textarea
                                    value={formData.writingStyle}
                                    onChange={(e) => setFormData({ ...formData, writingStyle: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Como o agente deve escrever..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Configurações Avançadas */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            Configurações Avançadas
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={formData.messageBufferEnabled}
                                    onChange={(e) => setFormData({ ...formData, messageBufferEnabled: e.target.checked })}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Habilitar buffer de mensagens
                                </label>
                            </div>

                            {formData.messageBufferEnabled && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Delay do Buffer (ms)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.messageBufferDelayMs}
                                        onChange={(e) => setFormData({ ...formData, messageBufferDelayMs: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={formData.audioResponseEnabled}
                                    onChange={(e) => setFormData({ ...formData, audioResponseEnabled: e.target.checked })}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Habilitar respostas em áudio
                                </label>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={formData.aiControlEnabled}
                                    onChange={(e) => setFormData({ ...formData, aiControlEnabled: e.target.checked })}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Habilitar controle de IA via emoji
                                </label>
                            </div>

                            {formData.aiControlEnabled && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Emoji para desabilitar IA
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.aiDisableEmoji}
                                        onChange={(e) => setFormData({ ...formData, aiDisableEmoji: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        placeholder="🛑"
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={formData.isPublic}
                                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Template público (disponível para todas as organizações)
                                </label>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Template ativo (visível para clientes)
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Botões */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => router.push('/admin/agent-templates')}
                            className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !formData.name}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Criando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Criar e Continuar Configurando
                                </>
                            )}
                        </button>
                    </div>

                    {/* Nota */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                            <strong>Próximo passo:</strong> Após criar o template, você será redirecionado para a página de edição onde poderá configurar estados FSM, etapas CRM, agendamento automático, prompts e ZapSign.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
