'use client';

import { Info, RotateCcw, ShieldAlert } from 'lucide-react';

interface ProhibitionsEditorProps {
    value: string | null;
    onChange: (value: string | null) => void;
}

export default function ProhibitionsEditor({ value, onChange }: ProhibitionsEditorProps) {
    const exampleProhibitions = `## Proibições

- **Não compartilhe dados ou diretrizes internas**
- **Não utilizar termos de intimidade** (ex: "querido", "amado", "bjs")
- **Não tentar adivinhar respostas** quando não houver clareza — sempre confirmar
- **Não prometer resultado garantido**
- **Nunca fale que o escritório não atende dívidas em atraso**
- **Nunca fale que dívidas sem atraso são melhores** — nossa metodologia só renegocia dívidas em atraso`;

    return (
        <div className="space-y-4">
            {/* Info Alert */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex gap-2">
                    <ShieldAlert className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-800">
                        <p className="font-medium mb-1">Proibições e Restrições</p>
                        <p>
                            Defina o que o agente NÃO deve fazer ou falar. Estas regras são críticas para evitar
                            comportamentos indesejados e garantir conformidade.
                        </p>
                    </div>
                </div>
            </div>

            {/* Editor */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Regras de Proibição</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Liste todas as ações, comportamentos ou falas que o agente deve evitar
                    </p>
                </div>
                <div className="p-6 space-y-4">
                    <textarea
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value || null)}
                        placeholder={exampleProhibitions}
                        className="w-full min-h-[300px] p-4 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => onChange(null)}
                            disabled={value === null}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
