'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save, RotateCcw, Info, Clock } from 'lucide-react';
import { FollowUpDeciderEditorProps } from './interfaces';
import api from '@/app/lib/api-client';

export default function FollowUpDeciderEditor({ agentId }: FollowUpDeciderEditorProps) {
    const [prompt, setPrompt] = useState<string | null>(null);
    const [originalPrompt, setOriginalPrompt] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadPrompt();
    }, [agentId]);

    const loadPrompt = async () => {
        try {
            setLoading(true);
            const data = await api.agents.get(agentId);
            const followUpPrompt = data.followUpDeciderPrompt || null;
            setPrompt(followUpPrompt);
            setOriginalPrompt(followUpPrompt);
        } catch (error) {
            console.error('Error loading follow-up decider prompt:', error);
            showMessage('error', 'Não foi possível carregar o prompt');
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
            await api.agents.update(agentId, { followUpDeciderPrompt: prompt });
            setOriginalPrompt(prompt);
            showMessage('success', 'Prompt do decisor de follow-up salvo com sucesso');
        } catch (error) {
            console.error('Error saving follow-up decider prompt:', error);
            showMessage('error', 'Não foi possível salvar o prompt');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setPrompt(originalPrompt);
        showMessage('success', 'Prompt resetado para o valor salvo');
    };

    const handleResetToDefault = () => {
        setPrompt(null);
        showMessage('success', 'Prompt configurado para usar o padrão do sistema');
    };

    const hasChanges = prompt !== originalPrompt;

    const defaultPromptExample = `# Objetivo
Você será uma ferramenta de análise de mensagens de texto de conversas entre vendedores e clientes. Sua tarefa é avaliar o tom e a intenção de cada mensagem recebida e classificar como "pergunta" ou "final".

# Instruções
1. Analise a mensagem recebida e determine se ela indica interesse em continuar a conversa (como uma pergunta ou comentário que espera resposta) ou se ela tem a intenção de encerrar a interação (como "tchau", "fico à disposição", "qualquer coisa me avise", etc.).
2. Sua resposta deve ser exclusivamente uma palavra:
   - Use "pergunta" para mensagens que indicam interesse em continuar a conversa.
   - Use "final" para mensagens que indicam encerramento da conversa.
3. Ignore qualquer outro contexto além do significado e intenção da mensagem.

# Output
Responda apenas com uma única palavra: "pergunta" ou "final".`;

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
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    <div className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        <span>{message.text}</span>
                    </div>
                </div>
            )}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-2">
                    <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Decisor Inteligente de Follow-ups</p>
                        <p>Este prompt é usado pela IA para analisar a última mensagem do lead e decidir quando enviar o próximo follow-up. Deixe em branco para usar o prompt padrão do sistema.</p>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Prompt do Decisor de Follow-up</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Customize como a IA analisa mensagens para agendar follow-ups automaticamente
                    </p>
                </div>
                <div className="p-6 space-y-4">
                    <textarea
                        value={prompt || ''}
                        onChange={(e) => setPrompt(e.target.value || null)}
                        placeholder={defaultPromptExample}
                        className="w-full min-h-[400px] p-4 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleReset}
                            disabled={prompt === originalPrompt}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Desfazer
                        </button>
                        <button
                            onClick={handleResetToDefault}
                            disabled={prompt === null}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Usar Padrão
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">💡 Exemplo de Prompt Padrão</h4>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-white p-3 rounded border border-gray-200">
                    {defaultPromptExample}
                </pre>
            </div>

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
