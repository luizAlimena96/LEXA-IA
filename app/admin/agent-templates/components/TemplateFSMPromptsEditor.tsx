'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, RotateCcw, Info } from 'lucide-react';
import api from '@/app/lib/api-client';

interface TemplateFSMPromptsEditorProps {
    templateId: string;
    onUpdate: () => void;
}

type PromptType = 'fsmDataExtractor' | 'fsmStateDecider';

export default function TemplateFSMPromptsEditor({ templateId, onUpdate }: TemplateFSMPromptsEditorProps) {
    const [prompts, setPrompts] = useState({
        fsmDataExtractorPrompt: '',
        fsmStateDeciderPrompt: '',
    });
    const [originalPrompts, setOriginalPrompts] = useState({
        fsmDataExtractorPrompt: '',
        fsmStateDeciderPrompt: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<PromptType>('fsmDataExtractor');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadPrompts();
    }, [templateId]);

    const loadPrompts = async () => {
        try {
            setLoading(true);
            const template = await api.agentTemplates.get(templateId);
            const loadedPrompts = {
                fsmDataExtractorPrompt: template.fsmDataExtractorPrompt || '',
                fsmStateDeciderPrompt: template.fsmStateDeciderPrompt || '',
            };
            setPrompts(loadedPrompts);
            setOriginalPrompts(loadedPrompts);
        } catch (error) {
            console.error('Erro ao carregar prompts:', error);
            showMessage('error', 'Não foi possível carregar os prompts FSM');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.agentTemplates.update(templateId, prompts);
            setOriginalPrompts(prompts);
            showMessage('success', 'Prompts FSM salvos com sucesso');
            onUpdate();
        } catch (error: any) {
            console.error('Erro ao salvar prompts:', error);
            showMessage('error', error.response?.data?.message || 'Não foi possível salvar os prompts FSM');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = (promptKey: keyof typeof prompts) => {
        setPrompts(prev => ({
            ...prev,
            [promptKey]: originalPrompts[promptKey],
        }));
        showMessage('success', 'Prompt resetado para o valor salvo');
    };

    const handleResetToDefault = (promptKey: keyof typeof prompts) => {
        setPrompts(prev => ({
            ...prev,
            [promptKey]: '',
        }));
        showMessage('success', 'Prompt configurado para usar o padrão do sistema');
    };

    const hasChanges = JSON.stringify(prompts) !== JSON.stringify(originalPrompts);

    const tabs = [
        {
            id: 'fsmDataExtractor' as PromptType,
            key: 'fsmDataExtractorPrompt' as keyof typeof prompts,
            label: 'Data Extractor',
            description: 'Prompt usado pela IA 1 para extrair dados estruturados das mensagens do usuário'
        },
        {
            id: 'fsmStateDecider' as PromptType,
            key: 'fsmStateDeciderPrompt' as keyof typeof prompts,
            label: 'State Decider',
            description: 'Prompt usado pela IA 2 para decidir transições de estado baseado no motor de decisão hierárquico'
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'}`}>
                    <div className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        <span>{message.text}</span>
                    </div>
                </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-2">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-medium mb-1">Customize os prompts do motor FSM</p>
                        <p>Deixe em branco para usar os prompts padrão do sistema. Variáveis disponíveis: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{'{{dataKey}}'}</code>, <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{'{{lastMessage}}'}</code>, <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{'{{currentState}}'}</code></p>
                    </div>
                </div>
            </div>

            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {tabs.map((tab) => (
                <div key={tab.id} className={activeTab === tab.id ? 'block' : 'hidden'}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{tab.label} Prompt</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{tab.description}</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <textarea
                                value={prompts[tab.key]}
                                onChange={(e) => setPrompts(prev => ({ ...prev, [tab.key]: e.target.value }))}
                                placeholder="Deixe em branco para usar o prompt padrão..."
                                className="w-full min-h-[400px] p-4 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleReset(tab.key)}
                                    disabled={prompts[tab.key] === originalPrompts[tab.key]}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Desfazer
                                </button>
                                <button
                                    onClick={() => handleResetToDefault(tab.key)}
                                    disabled={prompts[tab.key] === ''}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Usar Padrão
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {saving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            Salvar Alterações
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
