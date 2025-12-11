import { useEffect, useState } from 'react';
import { X, Copy, ExternalLink, Download, AlertCircle, Trash2, MessageSquare, History } from 'lucide-react';
import { Feedback, DebugLogEntry, getFeedbackDebugLogs, FeedbackResponse, getFeedbackResponses } from '../services/feedbackService';
import { useSession } from 'next-auth/react';

interface FeedbackSidebarProps {
    feedback: Feedback | null;
    isOpen: boolean;
    onClose: () => void;
    onRespond: (feedback: Feedback) => void;
    onResolve: (feedbackId: string) => void;
    onReopen: (feedbackId: string) => void;
    onDelete: (feedbackId: string) => void;
    onResponseAdded?: () => void;
}

export default function FeedbackSidebar({
    feedback,
    isOpen,
    onClose,
    onRespond,
    onResolve,
    onReopen,
    onDelete,
    onResponseAdded,
}: FeedbackSidebarProps) {
    const { data: session } = useSession();
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

    if (!isOpen || !feedback) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className="fixed right-0 top-0 h-full w-[500px] bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col animate-slide-in">
                {/* Header */}
                <div className="border-b border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                {feedback.customerName}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{feedback.date}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${feedback.status === 'RESOLVED'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                        }`}>
                        {feedback.status === 'RESOLVED' ? '✓ Resolvido' : '⏳ Aberto'}
                    </span>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Problem Reported */}
                    <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-4">
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

                    {/* Customer Info */}
                    {feedback.phone && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Informações do Cliente
                            </h3>
                            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
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

                    {/* AI State at Problem Time */}
                    {feedback.currentState && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                🧠 Estado da IA
                            </h3>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                <span className="text-sm font-mono text-gray-900 dark:text-white">
                                    {feedback.currentState}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* AI Thinking at Problem Time */}
                    {feedback.aiThinking && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                💭 Pensamento da IA
                            </h3>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                    {feedback.aiThinking}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div>
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
                            <div>
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
                                            <div key={log.id} className="relative">
                                                {/* Timeline Line */}
                                                {index < debugLogs.length - 1 && (
                                                    <div className="absolute left-[15px] top-[40px] bottom-[-16px] w-[2px] bg-gray-200 dark:bg-gray-700" />
                                                )}

                                                {/* Client Message */}
                                                <div className="flex gap-3 mb-3">
                                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm">
                                                        👤
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                                                            <p className="text-sm text-gray-900 dark:text-white">
                                                                {log.clientMessage}
                                                            </p>
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {new Date(log.createdAt).toLocaleTimeString('pt-BR')}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* AI Response */}
                                                <div className="flex gap-3 mb-2">
                                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 dark:bg-gray-100 flex items-center justify-center text-sm">
                                                        🤖
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                                                            <p className="text-sm text-gray-900 dark:text-white">
                                                                {log.aiResponse}
                                                            </p>
                                                            {log.currentState && (
                                                                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-mono">
                                                                    🧠 {log.currentState}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* AI Thinking (Collapsible) */}
                                                        {log.aiThinking && (
                                                            <div className="mt-2">
                                                                <button
                                                                    onClick={() => toggleThinking(log.id)}
                                                                    className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
                                                                >
                                                                    💭 {expandedThinking.has(log.id) ? '▼' : '▶'} Pensamento
                                                                </button>
                                                                {expandedThinking.has(log.id) && (
                                                                    <div className="mt-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2">
                                                                        <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                                                            {log.aiThinking}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Responses Tab Content */}
                        {activeTab === 'responses' && (
                            <div>
                                {loadingResponses ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                                    </div>
                                ) : responses.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                                        Nenhuma resposta ainda
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {responses.map((response) => (
                                            <div key={response.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                            {response.userName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {response.userName}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                {new Date(response.createdAt).toLocaleString('pt-BR')}
                                                            </p>
                                                        </div>
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

                {/* Actions */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-6 space-y-3">
                    <div className={`grid ${session?.user?.role === 'SUPER_ADMIN' ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                        <button
                            onClick={() => onRespond(feedback)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm"
                        >
                            Responder
                        </button>
                        {session?.user?.role === 'SUPER_ADMIN' && (
                            feedback.status === 'PENDING' ? (
                                <button
                                    onClick={() => onResolve(feedback.id)}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm"
                                >
                                    ✓ Resolver
                                </button>
                            ) : (
                                <button
                                    onClick={() => onReopen(feedback.id)}
                                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors text-sm"
                                >
                                    ↺ Reabrir
                                </button>
                            )
                        )}
                    </div>

                    {debugLogs.length > 0 && (
                        <button
                            onClick={exportLogs}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm flex items-center justify-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Exportar Logs
                        </button>
                    )}

                    {/* Delete Button - SUPER_ADMIN only */}
                    {session?.user?.role === 'SUPER_ADMIN' && (
                        <button
                            onClick={() => onDelete(feedback.id)}
                            className="w-full px-4 py-2 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm flex items-center justify-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Deletar Feedback
                        </button>
                    )}
                </div>
            </div >

            <style jsx>{`
                @keyframes slide-in {
                    from {
                        transform: translateX(100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }
            `}</style>
        </>
    );
}
