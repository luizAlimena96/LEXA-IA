import { useEffect, useState } from 'react';
import { Copy, Download, AlertCircle, Trash2, MessageSquare, History } from 'lucide-react';
import type { Feedback, DebugLogEntry, FeedbackResponse } from '../../types';
import api from '../../lib/api-client';
import { useAuth } from '@/app/contexts/AuthContext';
import Modal from '../Modal';

// API wrapper functions
const getFeedbackDebugLogs = async (feedbackId: string): Promise<DebugLogEntry[]> => {
    try {
        const response = await api.feedback.debugLogs(feedbackId);
        return response || [];
    } catch {
        return [];
    }
};

const getFeedbackResponses = async (feedbackId: string): Promise<FeedbackResponse[]> => {
    try {
        const response = await api.feedback.responses(feedbackId);
        return response || [];
    } catch {
        return [];
    }
};

interface FeedbackDetailsModalProps {
    feedback: Feedback | null;
    isOpen: boolean;
    onClose: () => void;
    onRespond: (feedback: Feedback) => void;
    onResolve: (feedbackId: string) => void;
    onReopen: (feedbackId: string) => void;
    onDelete: (feedbackId: string) => void;
    onResponseAdded?: () => void;
}

export default function FeedbackDetailsModal({
    feedback,
    isOpen,
    onClose,
    onRespond,
    onResolve,
    onReopen,
    onDelete,
    onResponseAdded,
}: FeedbackDetailsModalProps) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'history' | 'responses'>('history');
    const [debugLogs, setDebugLogs] = useState<DebugLogEntry[]>([]);
    const [responses, setResponses] = useState<FeedbackResponse[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [loadingResponses, setLoadingResponses] = useState(false);
    const [expandedThinking, setExpandedThinking] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (feedback && isOpen) {
            loadDebugLogs();
            loadResponses();
        }
    }, [feedback, isOpen]);

    const loadDebugLogs = async () => {
        if (!feedback) return;
        setLoadingLogs(true);
        try {
            const logs = await getFeedbackDebugLogs(feedback.id);
            setDebugLogs(logs);
        } catch (error) {
            console.error('Error loading debug logs:', error);
        } finally {
            setLoadingLogs(false);
        }
    };

    const loadResponses = async () => {
        if (!feedback) return;
        setLoadingResponses(true);
        try {
            const fetchedResponses = await getFeedbackResponses(feedback.id);
            setResponses(fetchedResponses);
        } catch (error) {
            console.error('Error loading responses:', error);
        } finally {
            setLoadingResponses(false);
        }
    };

    // Reload responses when feedback changes OR when explicitly triggered
    useEffect(() => {
        if (feedback && isOpen) {
            loadResponses();
        }
    }, [feedback?.id, isOpen, onResponseAdded]);

    const toggleThinking = (logId: string) => {
        const newExpanded = new Set(expandedThinking);
        if (newExpanded.has(logId)) {
            newExpanded.delete(logId);
        } else {
            newExpanded.add(logId);
        }
        setExpandedThinking(newExpanded);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const exportLogs = () => {
        if (!feedback) return;
        const content = `Feedback Report - ${feedback.customerName}\n\n` +
            `Problem: ${feedback.comment}\n` +
            `Date: ${feedback.date}\n` +
            `Status: ${feedback.status}\n` +
            `Severity: ${feedback.severity}\n\n` +
            `=== Conversation History ===\n\n` +
            debugLogs.map((log, idx) => (
                `[${idx + 1}] ${new Date(log.createdAt).toLocaleString()}\n` +
                `Client: ${log.clientMessage}\n` +
                `AI: ${log.aiResponse}\n` +
                `State: ${log.currentState || 'N/A'}\n` +
                `Thinking: ${log.aiThinking || 'N/A'}\n\n`
            )).join('');

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `feedback-${feedback.id}-logs.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (!feedback) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do Feedback" size="xl">
            <div className="space-y-6">
                {/* Header Information */}
                <div>
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                {feedback.customerName}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{feedback.date}</p>
                        </div>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${feedback.status === 'RESOLVED'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                            }`}>
                            {feedback.status === 'RESOLVED' ? '✓ Resolvido' : '⏳ Aberto'}
                        </span>
                    </div>

                    {/* Problem Reported */}
                    <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-4 rounded-r-lg">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-red-900 dark:text-red-200 mb-1">
                                    Problema Reportado
                                </p>
                                <p className="text-sm text-red-800 dark:text-red-300">
                                    {feedback.comment}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Context Info */}
                    <div className="space-y-6">
                        {/* Customer Info */}
                        {feedback.phone && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Informações do Cliente
                                </h3>
                                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                    <span className="text-sm text-gray-900 dark:text-white">{feedback.phone}</span>
                                    <button
                                        onClick={() => copyToClipboard(feedback.phone!)}
                                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        title="Copiar telefone"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* AI State */}
                        {feedback.currentState && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    🧠 Estado da IA
                                </h3>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                    <span className="text-sm font-mono text-gray-900 dark:text-white">
                                        {feedback.currentState}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Actions Panel */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 space-y-3 sticky top-4">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ações</h3>

                            <button
                                onClick={() => onRespond(feedback)}
                                className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                            >
                                <MessageSquare className="w-4 h-4" />
                                Responder
                            </button>

                            {user?.role === 'SUPER_ADMIN' && (
                                <>
                                    {feedback.status === 'PENDING' ? (
                                        <button
                                            onClick={() => onResolve(feedback.id)}
                                            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm"
                                        >
                                            ✓ Resolver
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => onReopen(feedback.id)}
                                            className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors text-sm"
                                        >
                                            ↺ Reabrir
                                        </button>
                                    )}

                                    <button
                                        onClick={() => onDelete(feedback.id)}
                                        className="w-full px-4 py-2 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Deletar
                                    </button>
                                </>
                            )}

                            {debugLogs.length > 0 && (
                                <button
                                    onClick={exportLogs}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm flex items-center justify-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Exportar Logs
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Tabs (History/Responses) */}
                    <div>
                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`flex-1 px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'history'
                                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                            >
                                <History className="w-4 h-4" />
                                Histórico
                                {debugLogs.length > 0 && (
                                    <span className="ml-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">
                                        {debugLogs.length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('responses')}
                                className={`flex-1 px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'responses'
                                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                            >
                                <MessageSquare className="w-4 h-4" />
                                Respostas
                                {responses.length > 0 && (
                                    <span className="ml-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">
                                        {responses.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* History Tab Content */}
                        {activeTab === 'history' && (
                            <div className="h-[500px] overflow-y-auto pr-2">
                                {loadingLogs ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                                    </div>
                                ) : !debugLogs || debugLogs.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                                        Nenhum log de conversa disponível
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {debugLogs.map((log, index) => (
                                            <div key={log.id} className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-800">
                                                {/* Time */}
                                                <div className="text-[10px] text-gray-400 mb-1 font-mono">
                                                    {new Date(log.createdAt).toLocaleTimeString('pt-BR')}
                                                </div>

                                                {/* Client */}
                                                <div className="bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm mb-2">
                                                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Usuário</p>
                                                    <p className="text-sm text-gray-900 dark:text-white">{log.clientMessage}</p>
                                                </div>

                                                {/* AI */}
                                                <div className="bg-indigo-50 dark:bg-indigo-900/10 p-2.5 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Lexa IA</span>
                                                        {log.currentState && (
                                                            <span className="text-[9px] px-1 py-0.5 rounded bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                                                {log.currentState}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-900 dark:text-white mb-2">{log.aiResponse}</p>

                                                    {/* Collapsible Thinking */}
                                                    {log.aiThinking && (
                                                        <div>
                                                            <button
                                                                onClick={() => toggleThinking(log.id)}
                                                                className="text-[10px] text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
                                                            >
                                                                {expandedThinking.has(log.id) ? '▼' : '▶'} Raciocínio
                                                            </button>
                                                            {expandedThinking.has(log.id) && (
                                                                <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-black/20 p-2 rounded border border-gray-200 dark:border-gray-700 font-mono whitespace-pre-wrap">
                                                                    {log.aiThinking}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Responses Tab Content */}
                        {activeTab === 'responses' && (
                            <div className="h-[500px] overflow-y-auto pr-2">
                                {loadingResponses ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                                    </div>
                                ) : responses.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                                        Nenhuma resposta ainda
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {responses.map((response) => (
                                            <div key={response.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                                        {response.userName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-900 dark:text-white">
                                                            {response.userName}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                                            {new Date(response.createdAt).toLocaleString('pt-BR')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                                    {response.message}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
}
