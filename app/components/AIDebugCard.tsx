
import React, { useMemo } from 'react';
import { Brain, CheckCircle, XCircle, AlertCircle, ArrowRight, Terminal } from 'lucide-react';

interface AIDebugCardProps {
    thought: string;
    currentState?: string;
    clientMessage?: string;
    aiResponse?: string;
    extractedData?: any;
    dataReferencia?: any;
    className?: string;
}

interface ParsedThinking {
    header?: string;
    steps: string[];
    verdict?: 'SUCCESS' | 'FAILURE' | 'UNKNOWN';
    chosenState?: string;
    rawJson?: any;
    rawText: string;
}


// Helper to fix common JSON string issues (like unescaped newlines)
function fixInvalidJson(str: string): string {
    let inString = false;
    let escaped = false;
    let result = '';

    for (let i = 0; i < str.length; i++) {
        const char = str[i];

        if (char === '"' && !escaped) {
            inString = !inString;
        }

        if (char === '\\' && !escaped) {
            escaped = true;
        } else {
            escaped = false;
        }

        if (inString && (char === '\n' || char === '\r' || char === '\t')) {
            // Escape control characters inside strings
            if (char === '\n') result += '\\n';
            else if (char === '\r') result += '\\r';
            else if (char === '\t') result += '\\t';
        } else {
            // Keep as is (valid whitespace outside strings)
            result += char;
        }
    }
    return result;
}

export default function AIDebugCard({
    thought,
    currentState,
    clientMessage,
    aiResponse,
    extractedData,
    className = ""
}: AIDebugCardProps) {

    // Parse the thought string to extract JSON and structured data
    const parsed: ParsedThinking = useMemo(() => {
        if (!thought) return { steps: [], rawText: '', verdict: 'UNKNOWN' };

        let result: ParsedThinking = {
            steps: [],
            rawText: thought,
            verdict: 'UNKNOWN'
        };

        try {
            // 1. Try to find the JSON block "json{ ... }" OR just "{ ... }"
            const jsonMatch = thought.match(/json\s*({[\s\S]*})/) || thought.match(/({[\s\S]*})/);

            if (jsonMatch) {
                const jsonStr = jsonMatch[1];
                try {
                    const jsonObj = JSON.parse(jsonStr);
                    result.rawJson = jsonObj;

                    if (jsonObj.pensamento && Array.isArray(jsonObj.pensamento)) {
                        result.steps = jsonObj.pensamento;
                    }
                    if (jsonObj.estado_escolhido) {
                        result.chosenState = jsonObj.estado_escolhido;
                    }
                } catch (e) {
                    // Try to fix common JSON errors (unescaped newlines in strings)
                    try {
                        const fixedJsonStr = fixInvalidJson(jsonStr);
                        const jsonObj = JSON.parse(fixedJsonStr);
                        result.rawJson = jsonObj;

                        if (jsonObj.pensamento && Array.isArray(jsonObj.pensamento)) {
                            result.steps = jsonObj.pensamento;
                        }
                        if (jsonObj.estado_escolhido) {
                            result.chosenState = jsonObj.estado_escolhido;
                        }
                    } catch (e2) {
                        console.error("Error parsing thought JSON even after fix:", e2);
                        // Fallback: split by newlines if JSON fail
                        result.steps = thought.split('\n').filter(l => l.trim().length > 0);
                    }
                }
            } else {
                // Fallback: split by newlines
                result.steps = thought.split('\n').filter(l => l.trim().length > 0);
            }

            // 2. Extract potential header (before JSON)
            const headerMatch = thought.match(/^(Pensamento \d+)/);
            if (headerMatch) result.header = headerMatch[1];

            // 3. Determine Verdict from text (heuristic)
            if (thought.includes('VEREDITO: SUCESSO') || thought.includes('VEREDITO: SUCCESS')) result.verdict = 'SUCCESS';
            else if (thought.includes('VEREDITO: FALHA') || thought.includes('VEREDITO: FAILURE') || thought.includes('VEREDITO: FAIL')) result.verdict = 'FAILURE';

        } catch (e) {
            console.error("Error parsing AI thought:", e);
            result.steps = [thought];
        }

        return result;
    }, [thought]);

    return (
        <div className={`bg-gray-50 dark:bg-[#0f111a] rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden font-mono text-sm ${className}`}>
            {/* Header / Meta Info */}
            <div className="bg-gray-100 dark:bg-[#1a1b26] p-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="font-bold text-gray-700 dark:text-gray-200">
                        {parsed.header || "Processamento Cognitivo IA"}
                    </span>
                </div>
                {parsed.chosenState && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        ➡️ {parsed.chosenState}
                    </span>
                )}
            </div>

            {/* Content Grid */}
            <div className="divide-y divide-gray-200 dark:divide-gray-800">

                {/* 1. Context: User Message & Current State */}
                {(clientMessage || currentState) && (
                    <div className="p-3 bg-white dark:bg-[#0f111a]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {clientMessage && (
                                <div>
                                    <span className="text-xs text-gray-500 uppercase font-semibold block mb-1">Entrada (Usuário)</span>
                                    <div className="text-gray-800 dark:text-gray-300 break-words bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-100 dark:border-gray-800">
                                        {clientMessage}
                                    </div>
                                </div>
                            )}
                            {currentState && (
                                <div>
                                    <span className="text-xs text-gray-500 uppercase font-semibold block mb-1">Estado Inicial</span>
                                    <div className="text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded border border-indigo-100 dark:border-indigo-800/50">
                                        {currentState}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 2. Extracted Data & Refs */}
                {extractedData && Object.keys(extractedData).length > 0 && (
                    <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10">
                        <span className="text-xs text-blue-600 dark:text-blue-400 uppercase font-semibold block mb-1">Dados da Memória</span>
                        <pre className="text-xs text-blue-800 dark:text-blue-200 overflow-x-auto">
                            {JSON.stringify(extractedData, null, 2)}
                        </pre>
                    </div>
                )}

                {/* 3. Thinking Steps (The Core) */}
                <div className="p-4 bg-white dark:bg-[#0f111a]">
                    <span className="text-xs text-gray-500 uppercase font-semibold block mb-3">Raciocínio Lógico (Passo a Passo)</span>
                    <div className="space-y-2">
                        {parsed.steps.map((step, idx) => {
                            // Style heuristics based on content
                            let stepClass = "text-gray-600 dark:text-gray-400 border-l-2 border-gray-200 dark:border-gray-700 pl-3";
                            let icon = null;

                            // Headers inside steps (e.g. "PASSO 1: ...")
                            if (step.match(/^(PASSO|STEP) \d+:/i)) {
                                stepClass = "font-bold text-gray-800 dark:text-gray-200 mt-4 border-l-4 border-indigo-500 pl-2 bg-indigo-50 dark:bg-indigo-900/20 p-1 rounded-r";
                            }
                            // Important checks
                            else if (step.includes('VEREDITO:') || step.match(/^VEREDITO/)) {
                                if (step.includes('FALHA') || step.includes('FAIL')) {
                                    stepClass = "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 pl-2 p-1 font-semibold rounded-r";
                                    icon = <XCircle className="w-3 h-3 inline mr-2 text-red-500" />;
                                } else {
                                    stepClass = "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 pl-2 p-1 font-semibold rounded-r";
                                    icon = <CheckCircle className="w-3 h-3 inline mr-2 text-green-500" />;
                                }
                            }
                            // Logic flow
                            else if (step.startsWith('- ')) {
                                stepClass = "text-gray-600 dark:text-gray-400 ml-2 pl-3 border-l border-gray-200 dark:border-gray-800";
                            }

                            return (
                                <div key={idx} className={`${stepClass} text-sm whitespace-pre-wrap`}>
                                    {icon}{step.replace(/json{.*?}/g, '') /* hide raw json in steps if mixed */}
                                </div>
                            );
                        })}

                        {/* If parsing failed or empty, show raw */}
                        {parsed.steps.length === 0 && (
                            <pre className="text-xs text-gray-500 whitespace-pre-wrap">{parsed.rawText}</pre>
                        )}
                    </div>
                </div>

                {/* 4. AI Response (Output) */}
                {aiResponse && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-xs text-gray-500 uppercase font-semibold block mb-1">Resposta Gerada</span>
                        <div className="flex gap-2 items-start">
                            <ArrowRight className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                            <p className="text-gray-800 dark:text-gray-200 font-medium">
                                {aiResponse}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

