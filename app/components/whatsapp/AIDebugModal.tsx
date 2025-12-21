"use client";

import { X, Brain, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

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

export default function AIDebugModal({
    isOpen,
    onClose,
    messages,
    chatName,
}: AIDebugModalProps) {
    const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

    if (!isOpen) return null;

    // Filter messages that have thought (AI responses)
    const messagesWithThoughts = messages.filter(m => m.thought && m.thought.trim() !== '');

    const toggleExpand = (id: string) => {
        setExpandedMessages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#12121d] rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Depuração de IA
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {chatName} • {messagesWithThoughts.length} pensamentos
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

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messagesWithThoughts.length === 0 ? (
                        <div className="text-center py-12">
                            <Brain className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">
                                Nenhum pensamento de IA encontrado nesta conversa.
                            </p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                                Os pensamentos são gerados quando a IA responde ao lead.
                            </p>
                        </div>
                    ) : (
                        messagesWithThoughts.map((message) => (
                            <div
                                key={message.id}
                                className="bg-gray-50 dark:bg-gray-800/50 rounded-lg overflow-hidden"
                            >
                                {/* Message Header */}
                                <button
                                    onClick={() => toggleExpand(message.id)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <div className="flex-1 text-left">
                                        <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                                            {message.content}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {formatTimestamp(message.timestamp)}
                                        </p>
                                    </div>
                                    {expandedMessages.has(message.id) ? (
                                        <ChevronUp className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
                                    )}
                                </button>

                                {/* Thought Content */}
                                {expandedMessages.has(message.id) && (
                                    <div className="px-4 pb-4">
                                        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                                                    Pensamento da IA
                                                </span>
                                            </div>
                                            <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                                                {message.thought}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
