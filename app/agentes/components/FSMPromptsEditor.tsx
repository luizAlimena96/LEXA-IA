'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save, RotateCcw, Info } from 'lucide-react';

interface FSMPromptsEditorProps {
    agentId: string;
}

interface Prompts {
    dataExtractor: string | null;
    stateDecider: string | null;
    validator: string | null;
}

type PromptType = 'dataExtractor' | 'stateDecider' | 'validator';

export default function FSMPromptsEditor({ agentId }: FSMPromptsEditorProps) {
    const [prompts, setPrompts] = useState<Prompts>({
        dataExtractor: null,
        stateDecider: null,
        validator: null,
    });
    const [originalPrompts, setOriginalPrompts] = useState<Prompts>({
        dataExtractor: null,
        stateDecider: null,
        validator: null,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<PromptType>('dataExtractor');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Carregar prompts ao montar
    useEffect(() => {
        loadPrompts();
    }, [agentId]);

    const loadPrompts = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/agents/${agentId}/fsm-prompts`);

            if (!response.ok) {
                throw new Error('Erro ao carregar prompts');
            }

            const data = await response.json();
            setPrompts(data.prompts);
            setOriginalPrompts(data.prompts);
        } catch (error) {
            console.error('Error loading FSM prompts:', error);
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
            const response = await fetch(`/api/agents/${agentId}/fsm-prompts`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompts }),
            });

            if (!response.ok) {
                throw new Error('Erro ao salvar prompts');
            }

            const data = await response.json();
            setPrompts(data.agent.prompts);
            setOriginalPrompts(data.agent.prompts);

            showMessage('success', 'Prompts FSM salvos com sucesso');
        } catch (error) {
            console.error('Error saving FSM prompts:', error);
            showMessage('error', 'Não foi possível salvar os prompts FSM');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = (promptType: PromptType) => {
        setPrompts(prev => ({
            ...prev,
            [promptType]: originalPrompts[promptType],
        }));
        showMessage('success', 'Prompt resetado para o valor salvo');
    };

    const handleResetToDefault = (promptType: PromptType) => {
        setPrompts(prev => ({
            ...prev,
            [promptType]: null,
        }));
        showMessage('success', 'Prompt configurado para usar o padrão do sistema');
    };

    const hasChanges = JSON.stringify(prompts) !== JSON.stringify(originalPrompts);

    const tabs = [
        { id: 'dataExtractor' as PromptType, label: 'Data Extractor', description: 'Prompt usado pela IA 1 para extrair dados estruturados das mensagens do usuário' },
        { id: 'stateDecider' as PromptType, label: 'State Decider', description: 'Prompt usado pela IA 2 para decidir transições de estado baseado no motor de decisão hierárquico' },
        { id: 'validator' as PromptType, label: 'Validator', description: 'Prompt usado pela IA 3 para validar se a decisão de transição faz sentido no contexto geral' },
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
            {/* Message Toast */}
            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    <div className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        <span>{message.text}</span>
                    </div>
                </div>
            )}

            {/* Info Alert */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-2">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Customize os prompts do motor FSM</p>
                        <p>Deixe em branco para usar os prompts padrão do sistema. Variáveis disponíveis: <code className="bg-blue-100 px-1 rounded">{'{{dataKey}}'}</code>, <code className="bg-blue-100 px-1 rounded">{'{{lastMessage}}'}</code>, <code className="bg-blue-100 px-1 rounded">{'{{currentState}}'}</code></p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            {tabs.map((tab) => (
                <div key={tab.id} className={activeTab === tab.id ? 'block' : 'hidden'}>
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">{tab.label} Prompt</h3>
                            <p className="text-sm text-gray-600 mt-1">{tab.description}</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <textarea
                                value={prompts[tab.id] || ''}
                                onChange={(e) => setPrompts(prev => ({ ...prev, [tab.id]: e.target.value || null }))}
                                placeholder="Deixe em branco para usar o prompt padrão..."
                                className="w-full min-h-[400px] p-4 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleReset(tab.id)}
                                    disabled={prompts[tab.id] === originalPrompts[tab.id]}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Desfazer
                                </button>
                                <button
                                    onClick={() => handleResetToDefault(tab.id)}
                                    disabled={prompts[tab.id] === null}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Usar Padrão
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* Save Button */}
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
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
