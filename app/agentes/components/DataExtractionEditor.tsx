'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save, RotateCcw, Info, Database } from 'lucide-react';
import { DataExtractionEditorProps } from './interfaces';
import api from '@/app/lib/api-client';

export default function DataExtractionEditor({ agentId }: DataExtractionEditorProps) {
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
            const extractionPrompt = data.dataExtractionPrompt || null;
            setPrompt(extractionPrompt);
            setOriginalPrompt(extractionPrompt);
        } catch (error) {
            console.error('Error loading data extraction prompt:', error);
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
            await api.agents.update(agentId, { dataExtractionPrompt: prompt });
            setOriginalPrompt(prompt);
            showMessage('success', 'Prompt de extração de dados salvo com sucesso');
        } catch (error) {
            console.error('Error saving data extraction prompt:', error);
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

    const defaultPromptExample = `# Variáveis de Extração de Dados

Defina abaixo todas as variáveis que devem ser extraídas das conversas com os clientes:

* \`horario_escolhido\`: (string) Valor string que representa o dia e o horário preferido do cliente para agendamento de reunião, com validação rigorosa para evitar ambiguidades (ex.: 'segunda-feira manhã', 'terça-feira 10h', 'quarta-feira 13:00'; rejeitar se vago como 'qualquer dia' ou inválido). Antes de salvar a variável, deve fazer uma confirmação caso a mensagem do lead não indique horário claro para agendar.

* \`nome_cliente\`: (string) Use esse campo para armazenar o nome do cliente após ele informar seu nome ou confirmar que estamos falando com ele após mencionarmos o nome.

* \`valor_divida\`: (number) O valor que deve ser armazenado dentro da variável valor_divida deve corresponder ao montante total efetivo da dívida do cliente. **Antes de consolidar o valor da variavel verifique se o valor informado pelo cliente está correto se ele informar valores como '400', '50', '250,00'. Retome com a pergunta 'O valor da sua dívida é de R$ 400,00 ou R$ 400.000,00?'**.

* \`garantia\`: (string) O cliente informou se a dívida possui garantia e o tipo dela. (Casa, carro, terreno, contas a receber, etc..)

* \`divida_banco\`: (string) Banco onde o cliente possui dívidas.

# Instruções de Extração

- Extraia APENAS as variáveis listadas acima
- Valide os dados conforme as regras específicas de cada variável
- Se houver dúvida, peça confirmação ao cliente antes de salvar
- Retorne JSON com as variáveis extraídas`;

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
                    <Database className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Definição de Variáveis de Extração</p>
                        <p>
                            Defina todas as variáveis que devem ser extraídas das conversas, com suas regras de validação e tipos.
                            Isso substitui o sistema antigo de dataKey/dataType individual por estado.
                        </p>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Prompt de Extração de Dados</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Defina todas as variáveis que a IA deve extrair das conversas e suas regras de validação
                    </p>
                </div>
                <div className="p-6 space-y-4">
                    <textarea
                        value={prompt || ''}
                        onChange={(e) => setPrompt(e.target.value || null)}
                        placeholder={defaultPromptExample}
                        className="w-full min-h-[500px] p-4 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                <h4 className="text-sm font-semibold text-gray-900 mb-2">💡 Exemplo de Prompt</h4>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-white p-3 rounded border border-gray-200 max-h-[300px] overflow-y-auto">
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
