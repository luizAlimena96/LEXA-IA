'use client';

import { PenTool, RotateCcw } from 'lucide-react';
import { WritingStyleEditorProps } from './interfaces';

export default function WritingStyleEditor({ value, onChange }: WritingStyleEditorProps) {
    const exampleWritingStyle = `<identidade>
Você é um formatador de texto para WhatsApp. Sua função é dividir um texto usando /n como separador e polir o resultado final.
</identidade>`;

    return (
        <div className="space-y-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <div className="flex gap-2">
                    <PenTool className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-purple-800 dark:text-purple-200">
                        <p className="font-medium mb-1">Estilo de Escrita e Formatação</p>
                        <p>
                            Defina como a IA deve formatar e estruturar as mensagens (divisão de texto,
                            pontuação, capitalização, etc.). Útil para WhatsApp e outras plataformas.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Prompt de Formatação de Texto</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Configure regras de formatação, divisão de mensagens e estilo de escrita
                    </p>
                </div>
                <div className="p-6 space-y-4">
                    <textarea
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value || null)}
                        placeholder={exampleWritingStyle}
                        className="w-full min-h-[400px] p-4 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => onChange(null)}
                            disabled={value === null}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Limpar / Resetar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
