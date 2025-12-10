"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Brain, RefreshCw, Loader2, Play, Paperclip, X, FileAudio, FileText, Terminal, AlignLeft, Info, Mic, Square, Trash2 } from "lucide-react";
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

interface ExtractedData {
    [key: string]: any;
}

interface DebugLogEntry {
    id: string;
    clientMessage: string;
    aiResponse: string;
    currentState: string;
    aiThinking: string;
    createdAt: string; // Date string
    extractedData?: ExtractedData; // Optional, if backend provides it
}

interface Message {
    id: string;
    content: string;
    fromMe: boolean;
    timestamp: Date;
    thinking?: string;
    state?: string;
    type?: 'TEXT' | 'AUDIO' | 'DOCUMENT';
    audioBase64?: string; // Ephemeral audio data for this session
    debugLogId?: string;
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

    const [activeTab, setActiveTab] = useState<'chat' | 'debug'>('chat');
    const [debugLogs, setDebugLogs] = useState<DebugLogEntry[]>([]);
    const [currentExtractedData, setCurrentExtractedData] = useState<ExtractedData>({});

    // File upload state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Audio Recording state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

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
                    // Handle both legacy (array) and new (object) response formats
                    const msgs = Array.isArray(data) ? data : data.messages || [];
                    setMessages(msgs);

                    if (!Array.isArray(data)) {
                        setDebugLogs(data.debugLogs || []);
                        setCurrentExtractedData(data.extractedData || {});
                    }

                    // Set thinking/state from last AI message
                    const lastAiMsg = [...msgs].reverse().find((m: Message) => m.fromMe);
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

    // Cleanup recording on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

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

    // Audio Recording Functions
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                // Create a file from blob
                const file = new File([audioBlob], "gravacao_de_voz.webm", { type: 'audio/webm' });
                setSelectedFile(file);
                // Trigger send immediately after stopping? Or let user review?
                // User asked for WhatsApp style: "falar na hora". 
                // Usually WA sends immediately on release (or explicit send button).
                // Let's set the file and call handleSendMessage immediately for seamless experience.

                // We need to wait a tiny bit for state to update? 
                // Actually handleSendMessage uses currentFile from ref or local var if passed?
                // current implementation of handleSendMessage relies on selectedFile state.
                // We should refactor handleSendMessage to accept a file argument optionally to avoid race conditions.
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingDuration(0);

            timerRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error("Error accessing microphone:", error);
            addToast("Erro ao acessar microfone", "error");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.onstop = async () => {
                if (timerRef.current) clearInterval(timerRef.current);
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const file = new File([audioBlob], "gravacao_de_voz.webm", { type: 'audio/webm' });

                mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
                setIsRecording(false);
                setRecordingDuration(0);

                await handleSendMessage(file);
            };

            mediaRecorderRef.current.stop();
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.onstop = () => {
                mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorderRef.current.stop();
            if (timerRef.current) clearInterval(timerRef.current);
            setIsRecording(false);
            setRecordingDuration(0);
            audioChunksRef.current = [];
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                let encoded = reader.result as string;
                encoded = encoded.replace(/^data:(.*,)?/, '');
                resolve(encoded);
            };
            reader.onerror = error => reject(error);
        });
    };

    const handleSendMessage = async (directFile?: File) => {
        const fileToSend = directFile || selectedFile;

        if ((!messageInput.trim() && !fileToSend) || !selectedOrg || !selectedAgent) {
            if (!directFile) {
                addToast("Digite uma mensagem ou envie um arquivo", "error");
            }
            return;
        }

        const userMessage: Message = {
            id: generateUUID(),
            content: messageInput || (fileToSend ? `[Arquivo]: ${fileToSend.name}` : ''),
            fromMe: false,
            timestamp: new Date(),
            type: fileToSend ? (fileToSend.type.startsWith('audio') ? 'AUDIO' : 'DOCUMENT') : 'TEXT',
        };

        if (fileToSend && fileToSend.type.startsWith('audio')) {
            const base64ForPlayback = await convertToBase64(fileToSend);
            userMessage.audioBase64 = base64ForPlayback;
            userMessage.type = 'AUDIO';
        }

        setMessages(prev => [...prev, userMessage]);

        const currentInput = messageInput;
        if (!directFile) {
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
        setMessageInput("");

        setLoading(true);

        try {
            let fileData = undefined;
            if (fileToSend) {
                const base64 = await convertToBase64(fileToSend);
                fileData = {
                    name: fileToSend.name,
                    type: fileToSend.type,
                    base64: base64
                };
            }

            const payload = {
                message: currentInput,
                organizationId: selectedOrg,
                agentId: selectedAgent,
                conversationHistory: messages.map(m => ({
                    content: m.content,
                    fromMe: m.fromMe,
                })),
                file: fileData
            };

            const res = await fetch('/api/test-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Failed to send message: ${res.status} - ${errorText}`);
            }

            const data = await res.json();

            const aiMessage: Message = {
                id: generateUUID(),
                content: data.response,
                fromMe: true,
                timestamp: new Date(),
                thinking: data.thinking,
                state: data.state,
                type: data.audioBase64 ? 'AUDIO' : 'TEXT',
                audioBase64: data.audioBase64
            };

            setMessages(prev => [...prev, aiMessage]);
            setThinking(data.thinking || "");
            setCurrentState(data.state || "");
            setSelectedMessageId(aiMessage.id);
            if (data.extractedData) setCurrentExtractedData(data.extractedData);
            if (data.newDebugLog) setDebugLogs(prev => [data.newDebugLog, ...prev]);

            if (data.audioBase64) {
                const audio = new Audio(`data:audio/mpeg;base64,${data.audioBase64}`);
                audio.play().catch(e => console.error("Auto-play failed:", e));
            }

        } catch (error) {
            console.error('Error in handleSendMessage:', error);
            addToast("Erro ao enviar mensagem", "error");
        } finally {
            setLoading(false);
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
                const historyRes = await fetch(`/api/test-ai?organizationId=${selectedOrg}`);
                if (historyRes.ok) {
                    const historyData = await historyRes.json();
                    // Handle both legacy (array) and new (object) response formats
                    const msgs = Array.isArray(historyData) ? historyData : historyData.messages || [];
                    setMessages(msgs);
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
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Acesso Negado</h1>
                    <p className="text-gray-600 dark:text-gray-400">Apenas SUPER_ADMIN pode acessar esta página</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Brain className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                            Teste de IA
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Simule conversas com a IA para testar raciocínio e respostas
                        </p>
                    </div>

                    {/* Selectors */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Organização
                                </label>
                                <select
                                    value={selectedOrg}
                                    onChange={(e) => setSelectedOrg(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                >
                                    {organizations.map(org => (
                                        <option key={org.id} value={org.id}>{org.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Agente
                                </label>
                                <select
                                    value={selectedAgent}
                                    onChange={(e) => setSelectedAgent(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'chat'
                                ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            <Brain className="w-4 h-4" />
                            Chat & Feedback
                        </button>
                        <button
                            onClick={() => setActiveTab('debug')}
                            className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'debug'
                                ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            <Terminal className="w-4 h-4" />
                            Debug FSM
                        </button>
                    </div>

                    {activeTab === 'chat' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Chat */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-[600px]">
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                    <h2 className="font-semibold text-gray-900 dark:text-white">Chat</h2>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.length === 0 ? (
                                        <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
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
                                                            ? "bg-indigo-100 dark:bg-indigo-900/40 border-2 border-indigo-500 text-gray-900 dark:text-white"
                                                            : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                                                        }`}
                                                >
                                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                                                    {/* Audio Player if available */}
                                                    {message.audioBase64 && (
                                                        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                                                            <audio controls className="w-full h-8 max-w-[200px]">
                                                                <source src={`data:audio/mpeg;base64,${message.audioBase64}`} type="audio/mpeg" />
                                                                Seu navegador não suporta áudio.
                                                            </audio>
                                                        </div>
                                                    )}

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

                                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            accept="audio/*,.pdf,.txt,.doc,.docx,image/*"
                                        />

                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`p-2 rounded-full transition-colors ${selectedFile ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-500'}`}
                                            title="Anexar arquivo ou áudio"
                                            disabled={loading}
                                        >
                                            <Paperclip className="w-5 h-5" />
                                        </button>

                                        <div className="flex-1 relative">
                                            {selectedFile && !isRecording && (
                                                <div className="absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-2 shadow-lg flex items-center justify-between z-10">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        {selectedFile.type.startsWith('audio') ? (
                                                            <FileAudio className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                                        ) : (
                                                            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                                        )}
                                                        <span className="text-sm truncate max-w-[150px] dark:text-white">{selectedFile.name}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedFile(null);
                                                            if (fileInputRef.current) fileInputRef.current.value = "";
                                                        }}
                                                        className="text-gray-400 hover:text-red-500"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}

                                            {isRecording ? (
                                                <div className="w-full px-4 py-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between animate-pulse">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                                                        <span className="text-red-700 dark:text-red-300 font-medium">Gravando... {formatDuration(recordingDuration)}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={messageInput}
                                                    onChange={(e) => setMessageInput(e.target.value)}
                                                    onKeyPress={(e) => e.key === "Enter" && !loading && handleSendMessage()}
                                                    placeholder={selectedFile ? "Adicione um comentário (opcional)..." : "Digite sua mensagem..."}
                                                    disabled={loading}
                                                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50"
                                                />
                                            )}
                                        </div>

                                        <div className="relative">
                                            {!isRecording && (
                                                <button
                                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                                    disabled={loading}
                                                >
                                                    <span className="text-xl">😊</span>
                                                </button>
                                            )}

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

                                        {isRecording ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={cancelRecording}
                                                    className="p-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-full transition-colors text-gray-600 dark:text-gray-200"
                                                    title="Cancelar"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={stopRecording}
                                                    className="p-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors text-white"
                                                    title="Parar e Enviar"
                                                >
                                                    <Send className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                {/* Mic Button - Always visible when not recording */}
                                                <button
                                                    onClick={startRecording}
                                                    disabled={loading}
                                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                                                    title="Gravar áudio"
                                                >
                                                    <Mic className="w-5 h-5" />
                                                </button>

                                                {/* Send Button */}
                                                <button
                                                    onClick={() => handleSendMessage()}
                                                    disabled={loading || (!messageInput.trim() && !selectedFile)}
                                                    className={`p-2 rounded-full transition-colors ${loading || (!messageInput.trim() && !selectedFile)
                                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                                        }`}
                                                    title="Enviar"
                                                >
                                                    {loading ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <Send className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* AI Thinking */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-[600px]">
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                                    <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    <h2 className="font-semibold text-gray-900 dark:text-white">Pensamento da IA</h2>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4">
                                    {currentState && (
                                        <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                                            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
                                                Estado Atual: <span className="font-bold">{currentState}</span>
                                            </p>
                                        </div>
                                    )}

                                    {thinking ? (
                                        <div className="prose prose-sm max-w-none">
                                            <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                                <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{thinking}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                                            {selectedMessageId
                                                ? "Nenhum pensamento registrado para esta mensagem."
                                                : "Selecione uma mensagem da IA para ver seu pensamento."}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Live Machine State */}
                            <div className="space-y-6">
                                {/* Estado Atual */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                        Estado da Máquina
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                                            <div className="text-sm text-indigo-700 dark:text-indigo-300 font-medium mb-1">Estado Atual</div>
                                            <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{currentState || "AGUARDANDO..."}</div>
                                            {currentState === "INICIO" && (
                                                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">
                                                    (Se sua IA está travada em INICIO, verifique se você criou estados no editor)
                                                </p>
                                            )}
                                        </div>

                                        <div className="p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                                            <div className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-2 flex items-center gap-2">
                                                <AlignLeft className="w-4 h-4" />
                                                Dados Extraídos
                                            </div>
                                            <pre className="text-xs bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600 overflow-auto max-h-[300px] text-gray-800 dark:text-gray-200">
                                                {JSON.stringify(currentExtractedData, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Logs Stream */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-[600px]">
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Terminal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                        <h2 className="font-semibold text-gray-900 dark:text-white">Logs do Sistema</h2>
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{debugLogs.length} eventos</span>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {debugLogs.length === 0 ? (
                                        <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                                            Nenhum log registrado ainda.
                                        </div>
                                    ) : (
                                        debugLogs.map((log) => (
                                            <div key={log.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                                                        {new Date(log.createdAt).toLocaleTimeString()}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.currentState ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                        }`}>
                                                        {log.currentState || 'UNKNOWN'}
                                                    </span>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 block">ENTRADA</span>
                                                        <p className="text-gray-800 dark:text-gray-200">{log.clientMessage}</p>
                                                    </div>

                                                    {log.aiThinking && (
                                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded border-l-2 border-yellow-400 dark:border-yellow-600">
                                                            <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400 block">RACIOCÍNIO</span>
                                                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-xs">{log.aiThinking}</p>
                                                        </div>
                                                    )}

                                                    <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded">
                                                        <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 block">SAÍDA</span>
                                                        <p className="text-indigo-900 dark:text-indigo-200">{log.aiResponse}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
