'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, Tag, Loader2, Power, PowerOff, ChevronDown, Trash2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '@/app/lib/api-client';

interface Message {
    id: string;
    content: string;
    fromMe: boolean;
    timestamp: string;
    thought?: string;
}

interface Lead {
    id: string;
    name: string | null;
    phone: string;
    email?: string;
    conversationSummary?: string;
    extractedData?: any;
    crmStageId?: string;
    currentState?: string;
    conversations?: Array<{
        id: string;
        aiEnabled?: boolean;
        tags?: Array<{ id: string; name: string; color: string }>;
    }>;
}

interface CRMStage {
    id: string;
    name: string;
    color: string;
}

interface Tag {
    id: string;
    name: string;
    color: string;
}

interface LeadChatModalProps {
    lead: Lead;
    stages: CRMStage[];
    tags: Tag[];
    onClose: () => void;
    onLeadUpdate: () => void;
    onLeadDelete?: () => void;
}

export default function LeadChatModal({
    lead,
    stages,
    tags,
    onClose,
    onLeadUpdate,
    onLeadDelete
}: LeadChatModalProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [aiEnabled, setAiEnabled] = useState(true);
    const [selectedStageId, setSelectedStageId] = useState(lead.crmStageId || '');
    const [leadTags, setLeadTags] = useState<Tag[]>([]);
    const [showTagSelector, setShowTagSelector] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const conversation = lead.conversations?.[0];

    useEffect(() => {
        if (conversation?.id) {
            loadMessages();
            setAiEnabled(conversation.aiEnabled !== false);
            setLeadTags(conversation.tags || []);
        } else {
            setLoading(false);
        }
    }, [conversation?.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadMessages = async () => {
        if (!conversation?.id) return;

        try {
            setLoading(true);
            const response = await api.conversations.getMessages(conversation.id);
            setMessages(response);
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async () => {
        if (!inputValue.trim() || !conversation?.id || sending) return;

        const message = inputValue.trim();
        setInputValue('');
        setSending(true);

        // Optimistic update
        const tempMessage: Message = {
            id: 'temp-' + Date.now(),
            content: message,
            fromMe: true,
            timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMessage]);

        try {
            await api.conversations.sendMessage(conversation.id, { content: message, role: 'assistant' });
            await loadMessages(); // Reload to get actual message
        } catch (error) {
            console.error('Error sending message:', error);
            // Remove temp message on error
            setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleToggleAI = async () => {
        if (!conversation?.id) return;

        try {
            await api.conversations.toggleAI(conversation.id, !aiEnabled);
            setAiEnabled(!aiEnabled);
        } catch (error) {
            console.error('Error toggling AI:', error);
        }
    };

    const handleStageChange = async (stageId: string) => {
        try {
            setSelectedStageId(stageId);
            await api.leads.update(lead.id, { crmStageId: stageId });
            onLeadUpdate();
        } catch (error) {
            console.error('Error updating stage:', error);
        }
    };

    const handleAddTag = async (tagId: string) => {
        if (!conversation?.id || leadTags.some(t => t.id === tagId)) return;

        try {
            await api.conversations.addTag(conversation.id, tagId);
            const tag = tags.find(t => t.id === tagId);
            if (tag) {
                setLeadTags(prev => [...prev, tag]);
            }
            onLeadUpdate();
        } catch (error) {
            console.error('Error adding tag:', error);
        }
    };

    const handleRemoveTag = async (tagId: string) => {
        if (!conversation?.id) return;

        try {
            await api.conversations.removeTag(conversation.id, tagId);
            setLeadTags(prev => prev.filter(t => t.id !== tagId));
            onLeadUpdate();
        } catch (error) {
            console.error('Error removing tag:', error);
        }
    };

    const handleDeleteLead = async () => {
        if (!confirm(`Deseja realmente excluir o lead "${lead.name || lead.phone}"? Esta ação não pode ser desfeita.`)) {
            return;
        }

        try {
            await api.leads.delete(lead.id);
            onLeadDelete?.();
            onClose();
        } catch (error) {
            console.error('Error deleting lead:', error);
            alert('Erro ao excluir lead');
        }
    };

    const extractedDataEntries = lead.extractedData
        ? Object.entries(lead.extractedData).filter(([_, value]) => value != null && value !== '')
        : [];

    return (
        <div className="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-5xl h-[90vh] flex shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">

                {/* Left: Chat Area */}
                <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
                    {/* Chat Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-600 flex items-center justify-center">
                                <User className="w-5 h-5 text-indigo-600 dark:text-white" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-gray-900 dark:text-white">{lead.name || 'Sem nome'}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{lead.phone.replace(/:\d+$/, '')}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleToggleAI}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${aiEnabled
                                    ? 'bg-green-100 dark:bg-green-600/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-600/30'
                                    : 'bg-red-100 dark:bg-red-600/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-600/30'
                                    }`}
                            >
                                {aiEnabled ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                                IA {aiEnabled ? 'Ativa' : 'Desativada'}
                            </button>

                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-500" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                Nenhuma mensagem ainda
                            </div>
                        ) : (
                            messages.map(message => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${message.fromMe
                                            ? 'bg-indigo-600 text-white rounded-br-sm'
                                            : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-sm border border-gray-200 dark:border-transparent'
                                            }`}
                                    >
                                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                        <div className={`text-xs mt-1 ${message.fromMe ? 'text-indigo-200' : 'text-gray-400 dark:text-gray-400'}`}>
                                            {format(new Date(message.timestamp), 'HH:mm', { locale: ptBR })}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <div className="flex gap-2">
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Digite sua mensagem..."
                                rows={1}
                                className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim() || sending}
                                className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                {sending ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                        {!aiEnabled && (
                            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                                ⚠️ A IA está desativada. Você está respondendo manualmente.
                            </p>
                        )}
                    </div>
                </div>

                {/* Right: Sidebar */}
                <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-y-auto custom-scrollbar">
                    {/* Summary */}
                    {lead.conversationSummary && (
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">📋 Resumo</h3>
                            <div className="bg-white dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-transparent">
                                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                                    {lead.conversationSummary}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Stage Selector */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">📊 Etapa do CRM</h3>
                        <select
                            value={selectedStageId}
                            onChange={(e) => handleStageChange(e.target.value)}
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="">Sem etapa</option>
                            {stages.map(stage => (
                                <option key={stage.id} value={stage.id}>
                                    {stage.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tags */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">🏷️ Tags</h3>
                        <div className="flex flex-wrap gap-1 mb-2">
                            {leadTags.map(tag => (
                                <span
                                    key={tag.id}
                                    className="text-xs px-2 py-1 rounded-full flex items-center gap-1 group border border-transparent"
                                    style={{ backgroundColor: tag.color + '30', color: tag.color, borderColor: tag.color + '40' }}
                                >
                                    {tag.name}
                                    <button
                                        onClick={() => handleRemoveTag(tag.id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setShowTagSelector(!showTagSelector)}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
                            >
                                + Adicionar tag
                                <ChevronDown className="w-3 h-3" />
                            </button>

                            {showTagSelector && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowTagSelector(false)} />
                                    <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-700 rounded-lg shadow-xl z-20 py-1 min-w-[150px] max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600">
                                        {tags.filter(t => !leadTags.some(lt => lt.id === t.id)).map(tag => (
                                            <button
                                                key={tag.id}
                                                onClick={() => {
                                                    handleAddTag(tag.id);
                                                    setShowTagSelector(false);
                                                }}
                                                className="w-full px-3 py-1.5 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 text-gray-900 dark:text-white"
                                            >
                                                <span
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: tag.color }}
                                                />
                                                {tag.name}
                                            </button>
                                        ))}
                                        {tags.filter(t => !leadTags.some(lt => lt.id === t.id)).length === 0 && (
                                            <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                                                Todas as tags já foram adicionadas
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Extracted Data */}
                    {extractedDataEntries.length > 0 && (
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">📝 Dados Extraídos</h3>
                            <div className="space-y-2">
                                {extractedDataEntries.map(([key, value]) => (
                                    <div key={key} className="bg-white dark:bg-gray-700/50 rounded-lg p-2 border border-gray-200 dark:border-transparent">
                                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                            {key.replace(/_/g, ' ')}
                                        </span>
                                        <p className="text-sm text-gray-900 dark:text-white truncate">
                                            {String(value)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Current State */}
                    {lead.currentState && (
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">🤖 Estado FSM</h3>
                            <span className="text-xs bg-indigo-100 dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded border border-indigo-200 dark:border-transparent">
                                {lead.currentState}
                            </span>
                        </div>
                    )}

                    {/* Delete Lead */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
                        <button
                            onClick={handleDeleteLead}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"
                        >
                            <Trash2 className="w-4 h-4" />
                            Excluir Lead
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
