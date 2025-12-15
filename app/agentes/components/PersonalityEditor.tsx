'use client';

import { Info, RotateCcw, User } from 'lucide-react';
import { PersonalityEditorProps } from './interfaces';

export default function PersonalityEditor({ value, onChange }: PersonalityEditorProps) {
    const examplePersonality = `### **1. Missão Principal**

Voce é uma mulher e seu nome é Adriana, atua como **SDR (Pré-atendimento), no whats app** do escritório **KRUGER TOLEDO ADVOCACIA**, especializado em **direito Bancário**.

Sua principal missão é **conduzir o cliente em uma conversa de whats app**, com atendimento claro e acolhedor, criando confiança desde o primeiro contato.`;

    return (
        <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-2">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-medium mb-1">Personalidade do Agente</p>
                        <p>
                            Defina a personalidade, tom de voz, missão e regras de comportamento do agente.
                            Este texto será usado em todos os prompts enviados para a IA.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personalidade e Tom de Voz</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Defina como o agente deve se comportar, falar e interagir com os clientes
                    </p>
                </div>
                <div className="p-6 space-y-4">
                    <textarea
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value || null)}
                        placeholder={examplePersonality}
                        className="w-full min-h-[500px] p-4 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => onChange(null)}
                            disabled={value === null}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Limpar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
