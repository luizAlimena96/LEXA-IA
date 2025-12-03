"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Brain, RefreshCw, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useToast, ToastContainer } from "../components/Toast";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

// Dynamic import for emoji picker to avoid SSR issues
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

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
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { toasts, addToast, removeToast } = useToast();

    // Load organizations
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

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedOrg || !selectedAgent) {
            addToast("Preencha todos os campos", "error");
            return;
        }

        const userMessage: Message = {
            id: crypto.randomUUID(),
            content: messageInput,
            fromMe: false,
            timestamp: new Date(),
        };

        setMessages([...messages, userMessage]);
        setMessageInput("");
        setLoading(true);

        try {
            const res = await fetch('/api/test-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    message: messageInput,
                    organizationId: selectedOrg,
                    agentId: selectedAgent,
                    conversationHistory: messages.map(m => ({
                        content: m.content,
                        fromMe: m.fromMe,
                    })),
                }),
            });

            if (!res.ok) {
                throw new Error('Failed to send message');
            }

            const data = await res.json();

            const aiMessage: Message = {
                id: crypto.randomUUID(),
                content: data.response,
                fromMe: true,
                timestamp: new Date(),
                thinking: data.thinking,
                state: data.state,
            };

            setMessages(prev => [...prev, aiMessage]);
            setThinking(data.thinking || "");
            setCurrentState(data.state || "");
        } catch (error) {
            console.error('Error:', error);
            addToast("Erro ao enviar mensagem", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setMessages([]);
        setThinking("");
        setCurrentState("");
        addToast("Conversa resetada", "success");
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

                            <div className="flex items-end">
                                <button
                                    onClick={handleReset}
                                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Resetar Conversa
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
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
                                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${!message.fromMe
                                                    ? "bg-indigo-600 text-white"
                                                    : "bg-gray-200 text-gray-900"
                                                    }`}
                                            >
                                                <p className="text-sm">{message.content}</p>
                                                <div className="flex items-center justify-end mt-1">
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
                                        onClick={handleSendMessage}
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
                                        O pensamento da IA aparecerá aqui após enviar uma mensagem
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
