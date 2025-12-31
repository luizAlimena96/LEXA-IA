"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Brain, RefreshCw, Loader2, Play, Paperclip, X, FileAudio, FileText, Terminal, AlignLeft, Info, Mic, Square, Trash2, Image, Download, Volume2, Pause, Timer, ChevronDown, ChevronUp } from "lucide-react";
import dynamic from "next/dynamic";
import { useToast, ToastContainer } from "../components/Toast";
import { useAuth } from "@/app/contexts/AuthContext";
import { useSearchParams } from "next/navigation";
import api from "@/app/lib/api-client";
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
    createdAt: string;
    extractedData?: ExtractedData;
}

interface MediaItem {
    id: string;
    url: string;
    type: 'image' | 'video' | 'document' | 'audio';
    fileName?: string;
    caption?: string;
}

interface Message {
    id: string;
    content: string;
    fromMe: boolean;
    timestamp: Date;
    thinking?: string;
    state?: string;
    type?: 'TEXT' | 'AUDIO' | 'DOCUMENT';
    audioBase64?: string;
    debugLogId?: string;
    mediaItems?: MediaItem[];
}

export default function TestAIPage() {
    const { user } = useAuth();
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
    const [showMediaMenu, setShowMediaMenu] = useState(false);

    const [debugLogs, setDebugLogs] = useState<DebugLogEntry[]>([]);
    const [currentExtractedData, setCurrentExtractedData] = useState<ExtractedData>({});

    // UI Toggle for Variables Box
    const [showVariablesBox, setShowVariablesBox] = useState(true);

    // File upload state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Audio Recording state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Buffer state for testing
    const [bufferEnabled, setBufferEnabled] = useState(false);
    const [bufferCount, setBufferCount] = useState(0);
    const [bufferProcessing, setBufferProcessing] = useState(false);
    const [bufferCountdown, setBufferCountdown] = useState(0);
    const bufferMessagesRef = useRef<{ content: string; type: string }[]>([]);
    const bufferTimerRef = useRef<NodeJS.Timeout | null>(null);
    const bufferCountdownRef = useRef<NodeJS.Timeout | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const thoughtsEndRef = useRef<HTMLDivElement>(null);
    const { toasts, addToast, removeToast } = useToast();

    useEffect(() => {
        const loadOrganizations = async () => {
            try {
                const data = await api.organizations.list();
                setOrganizations(data);
                if (data.length > 0) {
                    setSelectedOrg(data[0].id);
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
                const data = await api.agents.list(selectedOrg);
                setAgents(data);
                if (data.length > 0) {
                    setSelectedAgent(data[0].id);
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
                const data = await api.testAI.getHistory(selectedOrg);
                const msgs = Array.isArray(data) ? data : data.messages || [];
                setMessages(msgs);

                if (!Array.isArray(data)) {
                    setDebugLogs(data.debugLogs || []);
                    setCurrentExtractedData(data.extractedData || {});
                }

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
            } catch (error) {
                console.error('Error loading history:', error);
            } finally {
                setLoading(false);
            }
        };
        loadHistory();
    }, [selectedOrg]);

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
        thoughtsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, showVariablesBox]);

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
                const file = new File([audioBlob], "gravacao_de_voz.webm", { type: 'audio/webm' });
                setSelectedFile(file);
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

    // Process buffered messages (called when buffer timer expires)
    const processBufferedMessages = async () => {
        if (bufferMessagesRef.current.length === 0) return;

        setBufferProcessing(true);
        const combinedContent = bufferMessagesRef.current.map(m => m.content).join('\n');

        // Clear buffer
        bufferMessagesRef.current = [];
        setBufferCount(0);

        setLoading(true);

        try {
            const payload = {
                message: combinedContent,
                organizationId: selectedOrg,
                agentId: selectedAgent,
                conversationHistory: messages.map(m => ({
                    content: m.content,
                    fromMe: m.fromMe,
                })),
            };

            const data = await api.testAI.processMessage(payload);

            const aiMessage: Message = {
                id: generateUUID(),
                content: data.response,
                fromMe: true,
                timestamp: new Date(),
                thinking: data.thinking,
                state: data.state,
                type: data.audioBase64 ? 'AUDIO' : 'TEXT',
                audioBase64: data.audioBase64,
                mediaItems: data.mediaItems || []
            };

            setMessages(prev => [...prev, aiMessage]);
            setThinking(data.thinking || "");
            setCurrentState(data.state || "");
            setSelectedMessageId(aiMessage.id);
            if (data.extractedData) setCurrentExtractedData(data.extractedData);
            if (data.newDebugLog) setDebugLogs(prev => [data.newDebugLog, ...prev]);

        } catch (error) {
            console.error('Error processing buffered messages:', error);
            addToast("Erro ao processar mensagens", "error");
        } finally {
            setLoading(false);
            setBufferProcessing(false);
        }
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

        // Buffer Mode Logic
        if (bufferEnabled) {
            const isFirstMessage = bufferMessagesRef.current.length === 0;
            bufferMessagesRef.current.push({
                content: currentInput || (fileToSend ? `[Arquivo]: ${fileToSend.name}` : ''),
                type: userMessage.type || 'TEXT',
            });
            setBufferCount(bufferMessagesRef.current.length);

            if (isFirstMessage) {
                const BUFFER_DELAY = 15;
                setBufferCountdown(BUFFER_DELAY);
                bufferCountdownRef.current = setInterval(() => {
                    setBufferCountdown(prev => {
                        if (prev <= 1) {
                            if (bufferCountdownRef.current) clearInterval(bufferCountdownRef.current);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);

                bufferTimerRef.current = setTimeout(() => {
                    if (bufferCountdownRef.current) clearInterval(bufferCountdownRef.current);
                    setBufferCountdown(0);
                    processBufferedMessages();
                }, BUFFER_DELAY * 1000);

                addToast(`Buffer iniciado - 15s para processar mensagens`, "info");
            } else {
                addToast(`+1 mensagem adicionada ao buffer (${bufferMessagesRef.current.length} total)`, "info");
            }
            return;
        }

        // Immediate Mode Logic
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

            const data = await api.testAI.processMessage(payload);

            if (data.sentMessages && Array.isArray(data.sentMessages)) {
                const newMessages: Message[] = data.sentMessages.map((msg: any, index: number) => ({
                    id: msg.id,
                    content: msg.content,
                    fromMe: true,
                    timestamp: new Date(msg.timestamp),
                    thinking: msg.thought,
                    state: msg.thought ? data.state : undefined,
                    type: msg.type,
                    audioBase64: msg.type === 'AUDIO' ? data.audioBase64 : undefined,
                    mediaItems: index === data.sentMessages.length - 1 ? (data.mediaItems || []) : []
                }));

                if (newMessages.length > 0) {
                    newMessages[newMessages.length - 1].state = data.state;
                    newMessages[newMessages.length - 1].thinking = data.thinking;
                    setSelectedMessageId(newMessages[newMessages.length - 1].id);
                }

                setMessages(prev => [...prev, ...newMessages]);
            } else {
                const aiMessage: Message = {
                    id: generateUUID(),
                    content: data.response,
                    fromMe: true,
                    timestamp: new Date(),
                    thinking: data.thinking,
                    state: data.state,
                    type: data.audioBase64 ? 'AUDIO' : 'TEXT',
                    audioBase64: data.audioBase64,
                    mediaItems: data.mediaItems || []
                };

                setMessages(prev => [...prev, aiMessage]);
                setSelectedMessageId(aiMessage.id);
            }

            setThinking(data.thinking || "");
            setCurrentState(data.state || "");
            if (data.extractedData) setCurrentExtractedData(data.extractedData);
            if (data.newDebugLog) setDebugLogs(prev => [data.newDebugLog, ...prev]);

        } catch (error) {
            console.error('Error in handleSendMessage:', error);
            addToast("Erro ao enviar mensagem", "error");
        } finally {
            setLoading(false);
        }
    };


    const handleReset = async () => {
        if (!selectedOrg) return;
        if (!confirm('Tem certeza que deseja apagar todo o histórico desta conversa?')) return;

        setLoading(true);
        try {
            await api.testAI.resetConversation(selectedOrg);
            setMessages([]);
            setThinking("");
            setCurrentState("");
            setCurrentExtractedData({});
            setSelectedMessageId(null);
            addToast("Conversa resetada com sucesso", "success");
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
            const data = await api.testAI.triggerFollowup({
                organizationId: selectedOrg,
                agentId: selectedAgent,
            });

            if (data.success) {
                addToast(data.message, "success");
                const historyData = await api.testAI.getHistory(selectedOrg);
                const msgs = Array.isArray(historyData) ? historyData : historyData.messages || [];
                setMessages(msgs);
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

    if (user?.role !== 'SUPER_ADMIN') {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Acesso Negado</h1>
                    <p className="text-gray-600 dark:text-gray-400">Apenas SUPER_ADMIN pode acessar esta página</p>
                </div>
            </div>
        );
    }

    // Variables Panel Component (Internal)
    const VariablesPanel = ({ data }: { data: ExtractedData }) => {
        const [search, setSearch] = useState("");
        const [viewJson, setViewJson] = useState(false);

        const filteredKeys = Object.keys(data).filter(key =>
            key.toLowerCase().includes(search.toLowerCase()) ||
            String(data[key]).toLowerCase().includes(search.toLowerCase())
        );

        return (
            <div className="p-3 bg-gray-50/50 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-700">
                {/* Toolbar */}
                <div className="flex gap-2 mb-3">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Buscar variável..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white focus:ring-1 focus:ring-indigo-500"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => setViewJson(!viewJson)}
                        className={`px-3 py-1.5 text-xs rounded border transition-colors ${viewJson
                            ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-800'
                            : 'bg-white text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'
                            }`}
                    >
                        {viewJson ? '{} JSON' : 'Grid'}
                    </button>
                </div>

                {/* Content Area */}
                <div className="max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    {Object.keys(data).length === 0 ? (
                        <div className="text-xs text-gray-400 italic text-center py-4">Nenhum dado extraído ainda.</div>
                    ) : viewJson ? (
                        <pre className="text-[10px] font-mono bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {filteredKeys.length > 0 ? (
                                filteredKeys.map(key => (
                                    <div key={key} className="bg-white dark:bg-gray-700/50 p-2 rounded border border-gray-100 dark:border-gray-600 break-words group hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <span className="font-semibold text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-0.5 truncate" title={key}>
                                                {key}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-800 dark:text-gray-200 font-mono break-all line-clamp-3" title={String(data[key])}>
                                            {String(data[key])}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center text-xs text-gray-500 py-4">
                                    Nenhum resultado para "{search}"
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
                <div className="w-full mx-auto flex flex-col h-[calc(100vh-3rem)]">
                    {/* Header with Variables Box */}
                    <div className="mb-4 flex-shrink-0">
                        <div className="flex items-center justify-between mb-2">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                Teste de IA
                            </h1>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleReset}
                                    className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                    title="Resetar"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-col md:flex-row gap-2 mb-2">
                            <div className="flex flex-1 gap-2">
                                <select
                                    value={selectedOrg}
                                    onChange={(e) => setSelectedOrg(e.target.value)}
                                    className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white"
                                >
                                    {organizations.map(org => (
                                        <option key={org.id} value={org.id}>{org.name}</option>
                                    ))}
                                </select>
                                <select
                                    value={selectedAgent}
                                    onChange={(e) => setSelectedAgent(e.target.value)}
                                    className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white"
                                >
                                    {agents.map(agent => (
                                        <option key={agent.id} value={agent.id}>{agent.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleTriggerFollowUp}
                                    disabled={loading}
                                    className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-2 whitespace-nowrap"
                                >
                                    <Timer className="w-4 h-4" />
                                    Simular Follow-up
                                </button>
                                <button
                                    onClick={() => setBufferEnabled(!bufferEnabled)}
                                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 whitespace-nowrap border ${bufferEnabled
                                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {bufferEnabled ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4" />}
                                    Buffer Audio {bufferEnabled ? 'ON' : 'OFF'}
                                </button>
                            </div>
                        </div>

                        {/* Variables / Context Box */}
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-inner mb-4">
                            <div
                                className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700"
                                onClick={() => setShowVariablesBox(!showVariablesBox)}
                            >
                                <div className="flex items-center gap-3">
                                    <AlignLeft className="w-4 h-4 text-indigo-500" />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Dados Extraídos</span>
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                            Estado Atual: <span className="font-bold text-indigo-600 dark:text-indigo-400">{currentState || 'INICIO'}</span> • {Object.keys(currentExtractedData).length} variáveis
                                        </span>
                                    </div>
                                </div>
                                {showVariablesBox ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                            </div>

                            {showVariablesBox && (
                                <VariablesPanel
                                    data={currentExtractedData}
                                />
                            )}
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Chat Column (Left) */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden relative">
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.length === 0 ? (
                                    <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                                        Envie uma mensagem para começar o teste
                                    </div>
                                ) : (
                                    messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex flex-col ${!message.fromMe ? "items-end" : "items-start"}`}
                                        >
                                            <div
                                                className={`max-w-[85%] px-4 py-2 rounded-2xl shadow-sm ${!message.fromMe
                                                    ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-tr-none"
                                                    : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-tl-none"
                                                    }`}
                                            >
                                                {message.type === 'AUDIO' ? (
                                                    <div className="flex items-center gap-2 min-w-[200px]">
                                                        <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                                                            <Play className="w-4 h-4 text-white" />
                                                        </button>
                                                        <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                                                            <div className="h-full bg-white/80 w-1/3" />
                                                        </div>
                                                        <span className="text-xs opacity-80">Áudio</span>
                                                    </div>
                                                ) : (
                                                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                                                )}
                                            </div>

                                            {/* Media Items */}
                                            {message.mediaItems && message.mediaItems.length > 0 && (
                                                <div className="mt-2 grid grid-cols-2 gap-2 max-w-[85%]">
                                                    {message.mediaItems.map((media, idx) => (
                                                        <div key={idx} className="bg-gray-100 dark:bg-gray-700 rounded p-1 border border-gray-200 dark:border-gray-600">
                                                            {media.type === 'image' && (
                                                                <div className="aspect-square bg-gray-200 dark:bg-gray-600 rounded overflow-hidden flex items-center justify-center">
                                                                    <Image className="w-6 h-6 text-gray-400" />
                                                                </div>
                                                            )}
                                                            <div className="text-[10px] p-1 truncate text-gray-500 dark:text-gray-400">{media.type}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-end gap-2">
                                <div className="relative">
                                    <button
                                        onClick={() => setShowMediaMenu(!showMediaMenu)}
                                        title="Anexar arquivo"
                                        disabled={loading || isRecording}
                                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"
                                    >
                                        <Paperclip className="w-5 h-5" />
                                    </button>

                                    {showMediaMenu && (
                                        <div className="absolute bottom-12 left-0 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px]">
                                            <button onClick={() => { setShowMediaMenu(false); fileInputRef.current?.click(); }} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                                                <FileText className="w-4 h-4" /> Arquivo
                                            </button>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                </div>

                                <div className="flex-1 relative">
                                    {isRecording ? (
                                        <div className="w-full px-4 py-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between animate-pulse">
                                            <span className="text-red-700 dark:text-red-300 font-medium">Gravando... {formatDuration(recordingDuration)}</span>
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            onKeyPress={(e) => e.key === "Enter" && !loading && handleSendMessage()}
                                            placeholder={selectedFile ? "Adicione um comentário..." : "Digite sua mensagem..."}
                                            disabled={loading}
                                            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                                        />
                                    )}
                                </div>

                                <div className="flex items-center gap-1">
                                    {isRecording ? (
                                        <>
                                            <button onClick={cancelRecording} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full"><Trash2 className="w-5 h-5" /></button>
                                            <button onClick={stopRecording} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"><Send className="w-5 h-5" /></button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={startRecording} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full dark:hover:bg-gray-700"><Mic className="w-5 h-5" /></button>
                                            <button
                                                onClick={() => handleSendMessage()}
                                                disabled={loading || (!messageInput.trim() && !selectedFile)}
                                                className={`p-2 rounded-full transition-colors ${loading || (!messageInput.trim() && !selectedFile) ? 'bg-gray-200 text-gray-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                            >
                                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {bufferEnabled && (
                                <div className="px-4 py-1 bg-amber-50 dark:bg-amber-900/20 text-center text-xs text-amber-600 dark:text-amber-400 border-t border-amber-100 dark:border-amber-800">
                                    {bufferCountdown > 0 ? `Processando em ${bufferCountdown}s...` : 'Buffer Ativo'}
                                </div>
                            )}
                        </div>

                        {/* Thought Column (Right) - Restored */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden h-full">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800">
                                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    Pensamentos da IA
                                </h2>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {messages.filter(m => m.fromMe && m.thinking).length} passos
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-gray-900/50">
                                {messages.filter(m => m.fromMe && m.thinking).length > 0 ? (
                                    messages
                                        .filter(m => m.fromMe && m.thinking)
                                        .map((m, index) => (
                                            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                                                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                                                        {new Date(m.timestamp).toLocaleTimeString()}
                                                    </span>
                                                    {m.state && (
                                                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
                                                            {m.state}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="p-3 text-[11px] font-mono text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                                    {Array.isArray(m.thinking) ? m.thinking.join('\n') : (m.thinking || '')}
                                                </div>
                                            </div>
                                        ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm italic gap-2">
                                        <Brain className="w-8 h-8 opacity-20" />
                                        <p>Envie uma mensagem para ver</p>
                                        <p>o raciocínio da IA aqui.</p>
                                    </div>
                                )}
                                <div ref={thoughtsEndRef} />
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        </>
    );
}
