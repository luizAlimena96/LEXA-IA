'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import api from '@/app/lib/api-client';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import PersonalityEditor from '@/app/agentes/components/PersonalityEditor';
import ProhibitionsEditor from '@/app/agentes/components/ProhibitionsEditor';
import WritingStyleEditor from '@/app/agentes/components/WritingStyleEditor';
import TemplateStatesWrapper from '@/app/admin/agent-templates/components/TemplateStatesWrapper';
import TemplateCRMStagesEditor from '@/app/admin/agent-templates/components/TemplateCRMStagesEditor';
import TemplateAutoSchedulingEditor from '@/app/admin/agent-templates/components/TemplateAutoSchedulingEditor';
import TemplateFSMPromptsEditor from '@/app/admin/agent-templates/components/TemplateFSMPromptsEditor';
import TemplateZapSignEditor from '@/app/admin/agent-templates/components/TemplateZapSignEditor';
import TemplateKnowledgeEditor from '@/app/admin/agent-templates/components/TemplateKnowledgeEditor';
import TemplateFollowUpsEditor from '@/app/admin/agent-templates/components/TemplateFollowUpsEditor';

type Tab = 'basic' | 'personality' | 'knowledge' | 'followups' | 'states' | 'prompts' | 'crm-stages' | 'auto-scheduling' | 'zapsign';

export default function EditTemplatePage() {
    const router = useRouter();
    const params = useParams();
    const templateId = params.id as string;
    const { user, loading: authLoading } = useAuth();

    const [activeTab, setActiveTab] = useState<Tab>('basic');
    const [activePersonalityTab, setActivePersonalityTab] = useState<'personality' | 'prohibitions' | 'writing'>('personality');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [template, setTemplate] = useState<any>(null);

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
        zapSignFieldMapping: null as any,
        isActive: true,
    });

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
            } else if (user.role !== 'SUPER_ADMIN') {
                router.push('/dashboard');
            } else {
                loadTemplate();
            }
        }
    }, [user, authLoading, router, templateId]);

    const loadTemplate = async () => {
        try {
            setLoading(true);
            const data = await api.agentTemplates.get(templateId);
            setTemplate(data);
            setFormData({
                name: data.name || '',
                description: data.description || '',
                category: data.category || '',
                thumbnail: data.thumbnail || '',
                tone: data.tone || 'FRIENDLY',
                language: data.language || 'pt-BR',
                personality: data.personality || '',
                prohibitions: data.prohibitions || '',
                writingStyle: data.writingStyle || '',
                messageBufferEnabled: data.messageBufferEnabled || false,
                messageBufferDelayMs: data.messageBufferDelayMs || 2000,
                audioResponseEnabled: data.audioResponseEnabled !== false,
                aiControlEnabled: data.aiControlEnabled || false,
                aiDisableEmoji: data.aiDisableEmoji || '',
                dataExtractionPrompt: data.dataExtractionPrompt || '',
                fsmDataExtractorPrompt: data.fsmDataExtractorPrompt || '',
                fsmStateDeciderPrompt: data.fsmStateDeciderPrompt || '',
                fsmValidatorPrompt: data.fsmValidatorPrompt || '',
                zapSignFieldMapping: data.zapSignFieldMapping || null,
                isActive: data.isActive !== false,
            });
        } catch (error) {
            console.error('Erro ao carregar template:', error);
            alert('Erro ao carregar template');
            router.push('/admin/agent-templates');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveBasic = async () => {
        try {
            setSaving(true);
            await api.agentTemplates.update(templateId, formData);
            alert('Template atualizado com sucesso!');
            await loadTemplate();
        } catch (error: any) {
            console.error('Erro ao salvar:', error);
            alert(error.response?.data?.message || 'Erro ao salvar template');
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando template...</p>
                </div>
            </div>
        );
    }

    if (!template) {
        return null;
    }

    const tabs = [
        { id: 'basic', name: 'Informações Básicas' },
        { id: 'personality', name: 'Personalidade' },
        { id: 'knowledge', name: 'Conhecimento' },
        { id: 'followups', name: 'Follow-ups' },
        { id: 'states', name: 'Estados FSM' },
        { id: 'prompts', name: 'Prompts FSM' },
        { id: 'crm-stages', name: 'Etapas CRM' },
        { id: 'auto-scheduling', name: 'Agendamento' },
        { id: 'zapsign', name: 'ZapSign' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="w-full">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.push('/admin/agent-templates')}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para Templates
                    </button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Editar Template: {template.name}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                Configure todas as opções do template
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Template Ativo
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="flex overflow-x-auto">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as Tab)}
                                    className={`
                                        px-6 py-4 text-sm font-medium whitespace-nowrap
                                        border-b-2 transition-colors
                                        ${activeTab === tab.id
                                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300'
                                        }
                                    `}
                                >
                                    {tab.name}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    {activeTab === 'basic' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                Informações Básicas
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Nome *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                                        placeholder="Ex: Vendas, Suporte"
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
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        URL da Thumbnail
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.thumbnail}
                                        onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={handleSaveBasic}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            Salvar Alterações
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'personality' && (
                        <div className="space-y-6">
                            {/* Sub-tabs de Personalidade */}
                            <div className="border-b border-gray-200 dark:border-gray-700">
                                <nav className="flex gap-4">
                                    {[
                                        { id: 'personality', label: 'Personalidade' },
                                        { id: 'prohibitions', label: 'Proibições' },
                                        { id: 'writing', label: 'Formatação de Texto' },
                                    ].map((subTab) => (
                                        <button
                                            key={subTab.id}
                                            onClick={() => setActivePersonalityTab(subTab.id as any)}
                                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activePersonalityTab === subTab.id
                                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                                }`}
                                        >
                                            {subTab.label}
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            {/* Conteúdo das sub-tabs */}
                            {activePersonalityTab === 'personality' && (
                                <PersonalityEditor
                                    value={formData.personality}
                                    onChange={(value) => setFormData({ ...formData, personality: value })}
                                />
                            )}
                            {activePersonalityTab === 'prohibitions' && (
                                <ProhibitionsEditor
                                    value={formData.prohibitions}
                                    onChange={(value) => setFormData({ ...formData, prohibitions: value })}
                                />
                            )}
                            {activePersonalityTab === 'writing' && (
                                <WritingStyleEditor
                                    value={formData.writingStyle}
                                    onChange={(value) => setFormData({ ...formData, writingStyle: value })}
                                />
                            )}
                        </div>
                    )}


                    {activeTab === 'followups' && (
                        <TemplateFollowUpsEditor
                            templateId={templateId}
                            onUpdate={loadTemplate}
                        />
                    )}

                    {activeTab === 'knowledge' && (
                        <TemplateKnowledgeEditor
                            templateId={templateId}
                            onUpdate={loadTemplate}
                        />
                    )}

                    {activeTab === 'states' && template && (
                        <TemplateStatesWrapper
                            templateId={templateId}
                            onUpdate={loadTemplate}
                        />
                    )}

                    {activeTab === 'prompts' && (
                        <TemplateFSMPromptsEditor
                            templateId={templateId}
                            onUpdate={loadTemplate}
                        />
                    )}

                    {activeTab === 'crm-stages' && (
                        <TemplateCRMStagesEditor
                            templateId={templateId}
                            onUpdate={loadTemplate}
                        />
                    )}

                    {activeTab === 'auto-scheduling' && (
                        <TemplateAutoSchedulingEditor
                            templateId={templateId}
                            onUpdate={loadTemplate}
                        />
                    )}

                    {activeTab === 'zapsign' && (
                        <TemplateZapSignEditor
                            templateId={templateId}
                            onUpdate={loadTemplate}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
