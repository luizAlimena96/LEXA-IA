"use client";

import { X, Brain, Terminal } from "lucide-react";
import { useMemo } from "react";

interface MessageWithThought {
    id: string;
    content: string;
    thought?: string | null;
    fromMe: boolean;
    timestamp: string;
    type?: string;
}

interface AIDebugModalProps {
    isOpen: boolean;
    onClose: () => void;
    messages: MessageWithThought[];
    chatName: string;
}

interface DebugLogEntry {
    id: string;
    createdAt: string;
    clientMessage: string;
    aiResponse: string;
    aiThinking: string;
    currentState?: string;
}

export default function AIDebugModal({
    isOpen,
    onClose,
    messages,
    chatName,
}: AIDebugModalProps) {

    // Process messages to build logs
    const logs = useMemo(() => {
        const processedLogs: DebugLogEntry[] = [];

        // Sort messages by timestamp just in case
        const sortedMessages = [...messages].sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        for (let i = 0; i < sortedMessages.length; i++) {
            const msg = sortedMessages[i];

            // Look for AI messages that have thoughts
            if (msg.fromMe && msg.thought && msg.thought.trim() !== '') {
                // Find immediate previous user message
                let clientMsg = "(Inicio da conversa)";
                for (let j = i - 1; j >= 0; j--) {
                    if (!sortedMessages[j].fromMe) {
                        clientMsg = sortedMessages[j].content;
                        break;
                    }
                }

                // Try to extract state from thought (common pattern)
                // Patterns: "Current State: STATE" or "State: STATE" or "Estado: STATE"
                let state = '?';
                const stateMatch = msg.thought.match(/(?:Current State|State|Estado Atual|Estado):\s*([A-Z_0-9]+)/i);
                if (stateMatch) {
                    state = stateMatch[1].toUpperCase();
                }

                processedLogs.push({
                    id: msg.id,
                    createdAt: msg.timestamp,
                    clientMessage: clientMsg,
                    aiResponse: msg.content,
                    aiThinking: msg.thought,
                    currentState: state
                });
            }
        }
        return processedLogs;
    }, [messages]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#12121d] rounded-xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <Terminal className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Depuração FSM
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {chatName} • {logs.length} eventos registrados
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content - Terminal Style */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-900 dark:bg-gray-950 font-mono text-xs text-gray-300">
                    {logs.length === 0 ? (
                        <div className="text-center py-12">
                            <Brain className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                            <p className="text-gray-600">
                                Nenhum log de FSM encontrado nesta conversa.
                            </p>
                            <p className="text-gray-700 mt-2">
                                Certifique-se que a IA está ativa e gerando pensamentos.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-1 leading-relaxed">
                            {logs.map((log, index) => (
                                <span key={log.id} className="inline">
                                    <span className="text-gray-500">[{new Date(log.createdAt).toLocaleTimeString()}]</span>{' '}
                                    <span className="text-green-400">[{log.currentState || 'UNKNOWN'}]</span>{' '}
                                    <span className="text-cyan-400">IN:</span>{' '}
                                    <span className="text-white">{log.clientMessage}</span>{' '}
                                    {log.aiThinking && (
                                        <>
                                            <span className="text-yellow-400">THINK:</span>{' '}
                                            <span className="text-yellow-200" title={log.aiThinking}>
                                                {log.aiThinking.replace(/\n/g, ' ')}
                                            </span>{' '}
                                        </>
                                    )}
                                    <span className="text-indigo-400">OUT:</span>{' '}
                                    <span className="text-indigo-200">{log.aiResponse}</span>
                                    {index < logs.length - 1 && <span className="text-gray-600"> | </span>}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
