"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Brain, RefreshCw, Loader2, Play } from "lucide-react";
import dynamic from "next/dynamic";
import { useToast, ToastContainer } from "../components/Toast";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

function generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

interface Message {
    id: string;
    content: string;
    fromMe: boolean;
    timestamp: Date;
    thinking?: string;
    state?: string;
}

export default function TestAIPage() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [selectedOrg, setSelectedOrg] = useState<string>("");
    const [selectedAgent, setSelectedAgent] = useState<string>("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageInput, setMessageInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [thinking, setThinking] = useState<string>("");
    const [currentState, setCurrentState] = useState<string>("");
    const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { toasts, addToast, removeToast } = useToast();

    useEffect(() => {
        const loadOrganizations = async () => {
            try {
                const res = await fetch('/api/organizations');
                if (res.ok) {
                    const data = await res.json();
                    setOrganizations(data);
                    if (data.length > 0) {
                        setSelectedOrg(data[0].id);
                    }
                }
            } catch (error) {
                console.error('Error loading organizations:', error);
            }
        };
        loadOrganizations();
    }, []);

    // Load agents when organization changes
    useEffect(() => {
        const loadAgents = async () => {
            if (!selectedOrg) return;
            try {
                const res = await fetch(`/api/agents?organizationId=${selectedOrg}`);
                if (res.ok) {
                    const data = await res.json();
                    setAgents(data);
                    if (data.length > 0) {
                        setSelectedAgent(data[0].id);
                    }
                }
            } catch (error) {
                console.error('Error loading agents:', error);
            }
        };
        loadAgents();
    }, [selectedOrg]);

    // Load conversation history
    useEffect(() => {
        const loadHistory = async () => {
            if (!selectedOrg) return;
            setLoading(true);
            try {
                const res = await fetch(`/api/test-ai?organizationId=${selectedOrg}`);
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data);

                    // Set thinking/state from last AI message
                    const lastAiMsg = [...data].reverse().find((m: Message) => m.fromMe);
                    if (lastAiMsg) {
                        setThinking(lastAiMsg.thinking || "");
                        setCurrentState(lastAiMsg.state || "");
                        setSelectedMessageId(lastAiMsg.id);
                    } else {
                        setThinking("");
                        setCurrentState("");
                        setSelectedMessageId(null);
                    }
                }
            } catch (error) {
                console.error('Error loading history:', error);
            } finally {
                setLoading(false);
            }
        };
        loadHistory();
    }, [selectedOrg]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSelectMessage = (message: Message) => {
        if (message.fromMe) {
            setThinking(message.thinking || "Pensamento não disponível para esta mensagem.");
            setCurrentState(message.state || "Estado não registrado");
            setSelectedMessageId(message.id);
        }
    };

    const handleSendMessage = async () => {
        console.log('=== handleSendMessage called ===');
        console.log('messageInput:', messageInput);
        console.log('selectedOrg:', selectedOrg);
        console.log('selectedAgent:', selectedAgent);
        console.log('messageInput.trim():', messageInput.trim());

        if (!messageInput.trim() || !selectedOrg || !selectedAgent) {
            console.log('Validation failed!');
            addToast("Preencha todos os campos", "error");
            return;
        }

        const userMessage: Message = {
            id: generateUUID(),
            content: messageInput,
            fromMe: false,
            timestamp: new Date(),
        };

        console.log('Adding user message:', userMessage);
        setMessages(prev => [...prev, userMessage]);
        setMessageInput("");
        setLoading(true);

        try {
            const payload = {
                message: messageInput,
                organizationId: selectedOrg,
                agentId: selectedAgent,
                conversationHistory: messages.map(m => ({
                    content: m.content,
                    fromMe: m.fromMe,
                })),
            };

            console.log('Sending request with payload:', payload);

            const res = await fetch('/api/test-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            console.log('Response status:', res.status);
            console.log('Response ok:', res.ok);

            if (!res.ok) {
                const errorText = await res.text();
                console.error('Error response:', errorText);
                throw new Error(`Failed to send message: ${res.status} - ${errorText}`);
            }

            const data = await res.json();
            console.log('Response data:', data);

            const aiMessage: Message = {
                id: generateUUID(),
                content: data.response,
                fromMe: true,
                timestamp: new Date(),
                thinking: data.thinking,
                state: data.state,
            };

            console.log('Adding AI message:', aiMessage);
            setMessages(prev => [...prev, aiMessage]);
            setThinking(data.thinking || "");
            setCurrentState(data.state || "");
            setSelectedMessageId(aiMessage.id);
        } catch (error) {
            console.error('Error in handleSendMessage:', error);
            addToast("Erro ao enviar mensagem", "error");
        } finally {
            setLoading(false);
            console.log('=== handleSendMessage completed ===');
        }
    };


    const handleReset = async () => {
        if (!selectedOrg) return;

        if (!confirm('Tem certeza que deseja apagar todo o histórico desta conversa?')) {
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/test-ai?organizationId=${selectedOrg}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setMessages([]);
                setThinking("");
                setCurrentState("");
                setSelectedMessageId(null);
                addToast("Conversa resetada com sucesso", "success");
            } else {
                addToast("Erro ao resetar conversa", "error");
            }
        } catch (error) {
            console.error('Error resetting conversation:', error);
            addToast("Erro ao resetar conversa", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleTriggerFollowUp = async () => {
        if (!selectedOrg || !selectedAgent) return;

        setLoading(true);
        try {
            const res = await fetch('/api/test-ai/trigger-followup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organizationId: selectedOrg,
                    agentId: selectedAgent,
                }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                addToast(data.message, "success");
                // Refresh messages
                const historyRes = await fetch(`/api/test-ai?organizationId=${selectedOrg}`);
                if (historyRes.ok) {
                    const historyData = await historyRes.json();
                    setMessages(historyData);
                }
            } else {
                addToast(data.message || "Erro ao simular follow-up", "info");
            }
        } catch (error) {
            console.error('Error triggering follow-up:', error);
            addToast("Erro ao simular follow-up", "error");
        } finally {
            setLoading(false);
        }
    };

    if (session?.user?.role !== 'SUPER_ADMIN') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
                    <p className="text-gray-600">Apenas SUPER_ADMIN pode acessar esta página</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                            <Brain className="w-8 h-8 text-indigo-600" />
                            Teste de IA
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Simule conversas com a IA para testar raciocínio e respostas
                        </p>
                    </div>

                    {/* Selectors */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Organização
                                </label>
                                <select
                                    value={selectedOrg}
                                    onChange={(e) => setSelectedOrg(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    {organizations.map(org => (
                                        <option key={org.id} value={org.id}>{org.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Agente
                                </label>
                                <select
                                    value={selectedAgent}
                                    onChange={(e) => setSelectedAgent(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    {agents.map(agent => (
                                        <option key={agent.id} value={agent.id}>{agent.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-end gap-2">
                                <button
                                    onClick={handleTriggerFollowUp}
                                    className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm"
                                    title="Simular verificação de follow-up"
                                >
                                    <Play className="w-4 h-4" />
                                    Simular
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm"
                                    title="Resetar Conversa"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Resetar
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Chat */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[600px]">
                            <div className="p-4 border-b border-gray-200">
                                <h2 className="font-semibold text-gray-900">Chat</h2>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.length === 0 ? (
                                    <div className="text-center text-gray-500 mt-8">
                                        Envie uma mensagem para começar o teste
                                    </div>
                                ) : (
                                    messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${!message.fromMe ? "justify-end" : "justify-start"}`}
                                        >
                                            <div
                                                onClick={() => handleSelectMessage(message)}
                                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg cursor-pointer transition-all ${!message.fromMe
                                                    ? "bg-indigo-600 text-white"
                                                    : selectedMessageId === message.id
                                                        ? "bg-indigo-100 border-2 border-indigo-500 text-gray-900"
                                                        : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                                                    }`}
                                            >
                                                <p className="text-sm">{message.content}</p>
                                                <div className="flex items-center justify-between mt-1 gap-2">
                                                    {message.fromMe && (
                                                        <span className="text-[10px] flex items-center gap-1 opacity-70">
                                                            <Brain className="w-3 h-3" />
                                                            {message.thinking ? "Ver pensamento" : "Sem pensamento"}
                                                        </span>
                                                    )}
                                                    <span
                                                        className={`text-xs ${!message.fromMe ? "text-indigo-100" : "text-gray-500"
                                                            }`}
                                                    >
                                                        {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="p-4 border-t border-gray-200">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onKeyPress={(e) => e.key === "Enter" && !loading && handleSendMessage()}
                                        placeholder="Digite sua mensagem..."
                                        disabled={loading}
                                        className="flex-1 px-4 py-2 bg-gray-100 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 disabled:opacity-50"
                                    />

                                    <div className="relative">
                                        <button
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                            disabled={loading}
                                        >
                                            <span className="text-xl">😊</span>
                                        </button>

                                        {showEmojiPicker && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-10"
                                                    onClick={() => setShowEmojiPicker(false)}
                                                />
                                                <div className="absolute bottom-12 right-0 z-20">
                                                    <EmojiPicker
                                                        onEmojiClick={(emojiData) => {
                                                            setMessageInput(messageInput + emojiData.emoji);
                                                            setShowEmojiPicker(false);
                                                        }}
                                                        width={300}
                                                        height={400}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => {
                                            console.log('Send button clicked!');
                                            console.log('Button disabled?', loading || !messageInput.trim());
                                            handleSendMessage();
                                        }}
                                        disabled={loading || !messageInput.trim()}
                                        className="p-2 bg-indigo-600 hover:bg-indigo-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                                        ) : (
                                            <Send className="w-5 h-5 text-white" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* AI Thinking */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[600px]">
                            <div className="p-4 border-b border-gray-200 flex items-center gap-2">
                                <Brain className="w-5 h-5 text-indigo-600" />
                                <h2 className="font-semibold text-gray-900">Pensamento da IA</h2>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4">
                                {currentState && (
                                    <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                                        <p className="text-sm font-medium text-indigo-900">
                                            Estado Atual: <span className="font-bold">{currentState}</span>
                                        </p>
                                    </div>
                                )}

                                {thinking ? (
                                    <div className="prose prose-sm max-w-none">
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                            <p className="text-gray-700 whitespace-pre-wrap">{thinking}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 mt-8">
                                        {selectedMessageId
                                            ? "Nenhum pensamento registrado para esta mensagem."
                                            : "Selecione uma mensagem da IA para ver seu pensamento."}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
