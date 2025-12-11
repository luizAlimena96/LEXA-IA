"use client";

import { useState, useEffect } from "react";
import {
    Bot,
    Power,
    Save,
    Upload,
    FileText,
    Plus,
    Trash2,
    Edit,
    Clock,
    Bell,
    Search,
    Download,
    X,
    GitBranch,
    Settings,
    TrendingUp,
    Calendar,
} from "lucide-react";
import Loading from "../components/Loading";
import ErrorDisplay from "../components/Error";
import Modal from "../components/Modal";
import SearchInput from "../components/SearchInput";
import FollowupModal from "./components/modals/FollowupModal";
import { useToast, ToastContainer } from "../components/Toast";
import FSMPromptsEditor from "./components/FSMPromptsEditor";
import FollowUpDeciderEditor from "./components/FollowUpDeciderEditor";
import DataExtractionEditor from "./components/DataExtractionEditor";
import PersonalityEditor from "./components/PersonalityEditor";
import ProhibitionsEditor from "./components/ProhibitionsEditor";
import WritingStyleEditor from "./components/WritingStyleEditor";
import CRMStagesEditor from "./components/CRMStagesEditor";
import AutoSchedulingEditor from "./components/AutoSchedulingEditor";
import {
    getAgentConfig,
    updateAgentConfig,
    toggleAgentStatus,
    getKnowledge,
    uploadKnowledge,
    createKnowledge,
    updateKnowledge,
    deleteKnowledge,
    getFollowups,
    createFollowup,
    updateFollowup,
    deleteFollowup,
    type AgentConfig,
    type KnowledgeItem,
    type AgentFollowUp,
    getStates,
    createState,
    updateState,
    deleteState,
    type AgentState,
    type AvailableRoutes,
    getAgentFollowUps,
    createAgentFollowUp,
    updateAgentFollowUp,
    deleteAgentFollowUp,
} from "../services/agentService";

import { useSearchParams } from "next/navigation";
import ImportTab from "./components/ImportTab";
import StatesTab from "./components/StatesTab";
import StateModal from "./components/StateModal";
import ZapSignConfigEditor from "./components/ZapSignConfigEditor";

type Tab = "agente" | "conhecimento" | "followups" | "importacao" | "estados" | "prompts" | "crm-stages" | "auto-scheduling" | "zapsign";

export default function AgentesPage() {
    const searchParams = useSearchParams();
    const organizationId = searchParams.get("organizationId");

    const [activeTab, setActiveTab] = useState<Tab>("agente");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toasts, addToast, removeToast } = useToast();

    // Agent Config State
    const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
    const [agentStatus, setAgentStatus] = useState(false);

    // Knowledge State
    const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showEditKnowledgeModal, setShowEditKnowledgeModal] = useState(false);
    const [editingKnowledge, setEditingKnowledge] = useState<KnowledgeItem | null>(null);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadTitle, setUploadTitle] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [knowledgeForm, setKnowledgeForm] = useState({
        title: "",
        content: "",
        type: "TEXT" as "DOCUMENT" | "FAQ" | "TEXT",
    });


    // Followups State
    const [followups, setFollowups] = useState<AgentFollowUp[]>([]);
    const [showFollowupModal, setShowFollowupModal] = useState(false);
    const [editingFollowup, setEditingFollowup] = useState<AgentFollowUp | null>(null);
    const [followupForm, setFollowupForm] = useState({
        name: "",
        message: "",
        isActive: true,
        crmStageId: null as string | null,
        triggerMode: "TIMER",
        delayMinutes: 60,
        scheduledTime: "",
        mediaUrls: [] as string[],
        videoUrl: "",
        businessHoursEnabled: false,
        businessHoursStart: "08:00",
        businessHoursEnd: "18:00",
    });



    // States (FSM) State
    const [states, setStates] = useState<AgentState[]>([]);
    const [showStateModal, setShowStateModal] = useState(false);
    const [editingState, setEditingState] = useState<AgentState | null>(null);
    const [stateForm, setStateForm] = useState({
        name: "",
        missionPrompt: "",
        availableRoutes: {
            rota_de_sucesso: [],
            rota_de_persistencia: [],
            rota_de_escape: []
        } as AvailableRoutes,
        dataKey: "" as string | null,
        dataDescription: "" as string | null,
        dataType: "" as string | null,
        tools: "" as string,
        prohibitions: "" as string,
        order: 0,
        mediaId: null as string | null,
        mediaTiming: null as string | null,
        responseType: null as string | null,
        crmStatus: null as string | null,
    });

    useEffect(() => {
        loadData();
    }, [activeTab, organizationId]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Sempre carregar configurações do agente se não estiverem carregadas (necessário para IDs)
            if (!agentConfig) {
                const configs = await getAgentConfig(organizationId || undefined);
                console.log('[AgentesPage] Loaded agents:', configs);
                console.log('[AgentesPage] Selected agent (first):', configs[0]);
                setAgentConfig(configs[0] || null);
                setAgentStatus(configs[0]?.isActive || false);
            }

            if (activeTab === "agente") {
                // Se já carregou acima, não precisa carregar de novo, mas para garantir frescor na aba principal:
                const configs = await getAgentConfig(organizationId || undefined);
                setAgentConfig(configs[0] || null);
                setAgentStatus(configs[0]?.isActive || false);
            } else if (activeTab === "conhecimento") {
                const data = await getKnowledge(undefined, organizationId || undefined);
                setKnowledge(data);
            } else if (activeTab === "followups") {
                if (agentConfig?.id) {
                    const data = await getAgentFollowUps(agentConfig.id);
                    setFollowups(data);
                }
                // Load states for the modal selector
                if (states.length === 0) {
                    const statesData = await getStates(undefined, organizationId || undefined);
                    setStates(statesData);
                }

            } else if (activeTab === "estados") {
                const data = await getStates(undefined, organizationId || undefined);
                setStates(data);
            } else if (activeTab === "crm-stages" || activeTab === "auto-scheduling") {
                // Ensure agentConfig is loaded for these tabs
                if (!agentConfig) {
                    const configs = await getAgentConfig(organizationId || undefined);
                    setAgentConfig(configs[0] || null);
                    setAgentStatus(configs[0]?.isActive || false);
                }
            }
        } catch (err) {
            setError("Erro ao carregar dados");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async () => {
        try {
            const newStatus = await toggleAgentStatus();
            setAgentStatus(newStatus);
            addToast(
                `Agente ${newStatus ? "ativado" : "desativado"} com sucesso!`,
                "success"
            );
        } catch (err) {
            addToast("Erro ao alterar status", "error");
        }
    };

    const handleUploadKnowledge = async () => {
        if (!uploadFile || !uploadTitle.trim()) {
            addToast("Preencha todos os campos", "error");
            return;
        }

        if (!agentConfig?.id) {
            addToast("Erro: Agente não encontrado. Selecione um agente primeiro.", "error");
            return;
        }

        setIsUploading(true);
        setShowUploadModal(false); // Fecha modal normal e mostra loading

        try {
            const newItem = await uploadKnowledge(
                uploadFile,
                uploadTitle,
                agentConfig.id,
                agentConfig.organizationId || organizationId || undefined
            );
            setKnowledge([...knowledge, newItem]);
            setUploadFile(null);
            setUploadTitle("");
            addToast("Arquivo enviado e processado com sucesso!", "success");
        } catch (err: any) {
            addToast(err.message || "Erro ao enviar arquivo", "error");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteKnowledge = async (id: string) => {
        if (!confirm("Deseja realmente excluir este item?")) return;

        try {
            await deleteKnowledge(id);
            setKnowledge(knowledge.filter((k) => k.id !== id));
            addToast("Item excluído com sucesso!", "success");
        } catch (err) {
            addToast("Erro ao excluir item", "error");
        }
    };

    const handleEditKnowledge = (item: KnowledgeItem) => {
        setEditingKnowledge(item);
        setKnowledgeForm({
            title: item.title,
            content: item.content,
            type: item.type,
        });
        setShowEditKnowledgeModal(true);
    };

    const handleUpdateKnowledge = async () => {
        if (!editingKnowledge || !knowledgeForm.title.trim() || !knowledgeForm.content.trim()) {
            addToast("Preencha todos os campos", "error");
            return;
        }

        try {
            await updateKnowledge(editingKnowledge.id, knowledgeForm);
            setKnowledge(
                knowledge.map((k) =>
                    k.id === editingKnowledge.id ? { ...k, ...knowledgeForm } : k
                )
            );
            setShowEditKnowledgeModal(false);
            setEditingKnowledge(null);
            setKnowledgeForm({ title: "", content: "", type: "TEXT" });
            addToast("Conhecimento atualizado com sucesso!", "success");
        } catch (err) {
            addToast("Erro ao atualizar conhecimento", "error");
        }
    };

    const handleCreateKnowledge = async () => {
        if (!knowledgeForm.title.trim() || !knowledgeForm.content.trim()) {
            addToast("Preencha todos os campos", "error");
            return;
        }

        if (!agentConfig?.id) {
            addToast("Erro: Agente não encontrado", "error");
            return;
        }

        try {
            const newKnowledge = await createKnowledge({
                title: knowledgeForm.title,
                content: knowledgeForm.content,
                type: knowledgeForm.type,
                agentId: agentConfig.id,
                organizationId: organizationId || undefined,
            });
            setKnowledge([...knowledge, newKnowledge]);
            setShowEditKnowledgeModal(false);
            setKnowledgeForm({ title: "", content: "", type: "TEXT" });
            addToast("Conhecimento criado com sucesso!", "success");
        } catch (err) {
            addToast("Erro ao criar conhecimento", "error");
        }
    };


    const handleSaveFollowup = async () => {
        if (!agentConfig?.id) return;

        if (!followupForm.name.trim() || !followupForm.message.trim()) {
            addToast("Preencha os campos obrigatórios", "error");
            return;
        }

        try {
            if (editingFollowup) {
                const updated = await updateAgentFollowUp(agentConfig.id, editingFollowup.id, {
                    name: followupForm.name,
                    triggerMode: followupForm.triggerMode,
                    delayMinutes: followupForm.delayMinutes,
                    scheduledTime: followupForm.scheduledTime,
                    messageTemplate: followupForm.message,
                    mediaUrls: followupForm.mediaUrls,
                    videoUrl: followupForm.videoUrl,
                    businessHoursEnabled: followupForm.businessHoursEnabled,
                    businessHoursStart: followupForm.businessHoursStart,
                    businessHoursEnd: followupForm.businessHoursEnd,
                    isActive: followupForm.isActive,
                    crmStageId: followupForm.crmStageId || undefined
                });
                setFollowups(
                    followups.map((f) =>
                        f.id === editingFollowup.id ? updated : f
                    )
                );
                addToast("Follow-up atualizado com sucesso!", "success");
            } else {
                if (!followupForm.crmStageId) {
                    addToast("Erro: É obrigatório vincular a uma etapa CRM", "error");
                    return;
                }

                const newFollowup = await createAgentFollowUp(agentConfig.id, {
                    name: followupForm.name,
                    triggerMode: followupForm.triggerMode,
                    delayMinutes: followupForm.delayMinutes,
                    scheduledTime: followupForm.scheduledTime,
                    messageTemplate: followupForm.message,
                    mediaUrls: followupForm.mediaUrls,
                    videoUrl: followupForm.videoUrl,
                    businessHoursEnabled: followupForm.businessHoursEnabled,
                    businessHoursStart: followupForm.businessHoursStart,
                    businessHoursEnd: followupForm.businessHoursEnd,
                    isActive: followupForm.isActive,
                    crmStageId: followupForm.crmStageId
                });
                setFollowups([...followups, newFollowup]);
                addToast("Follow-up criado com sucesso!", "success");
            }
            setShowFollowupModal(false);
            setEditingFollowup(null);
            setFollowupForm({
                name: "",
                message: "",
                isActive: true,
                crmStageId: null,
                triggerMode: "TIMER",
                delayMinutes: 60,
                scheduledTime: "",
                mediaUrls: [],
                videoUrl: "",
                businessHoursEnabled: false,
                businessHoursStart: "08:00",
                businessHoursEnd: "18:00",
            });
        } catch (err) {
            addToast("Erro ao salvar follow-up", "error");
            console.error(err);
        }
    };

    const handleDeleteFollowup = async (id: string) => {
        if (!agentConfig?.id) return;
        if (!confirm("Tem certeza que deseja excluir este follow-up?")) return;

        try {
            await deleteAgentFollowUp(agentConfig.id, id);
            setFollowups(followups.filter((f) => f.id !== id));
            addToast("Follow-up excluído com sucesso!", "success");
        } catch (err) {
            addToast("Erro ao excluir follow-up", "error");
            console.error(err);
        }
    };




    const handleSaveState = async () => {
        if (!stateForm.name.trim() || !stateForm.missionPrompt.trim()) {
            addToast("Preencha os campos obrigatórios (*)", "error");
            return;
        }

        try {
            if (editingState) {
                await updateState(editingState.id, stateForm);
                addToast("Estado atualizado com sucesso!", "success");
            } else {
                if (!agentConfig?.id) {
                    addToast("Erro: Agente não encontrado", "error");
                    return;
                }
                await createState({
                    ...stateForm,
                    agentId: agentConfig.id,
                    organizationId: organizationId || "",
                });
                addToast("Estado criado com sucesso!", "success");
            }

            await loadData();

            setShowStateModal(false);
            setEditingState(null);
            setStateForm({
                name: "",
                missionPrompt: "",
                availableRoutes: {
                    rota_de_sucesso: [],
                    rota_de_persistencia: [],
                    rota_de_escape: []
                },
                dataKey: null,
                dataDescription: null,
                dataType: null,
                tools: "",
                prohibitions: "",
                order: 0,
                mediaId: null,
                mediaTiming: null,
                responseType: null,
                crmStatus: null,
            });
        } catch (err) {
            console.error(err);
            addToast("Erro ao salvar estado", "error");
        }
    };

    const handleDeleteState = async (id: string) => {
        if (!confirm("Deseja realmente excluir este estado?")) return;

        try {
            await deleteState(id);
            setStates(states.filter((s) => s.id !== id));
            addToast("Estado excluído com sucesso!", "success");
        } catch (err) {
            addToast("Erro ao excluir estado", "error");
        }
    };

    const handleCreateEmptyAgent = async () => {
        if (!organizationId) {
            addToast("Organization ID não encontrado", "error");
            return;
        }

        try {
            setLoading(true);

            // Criar agente via API (a API já cria o estado inicial automaticamente)
            const instance = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const response = await fetch('/api/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: "Novo Agente",
                    description: "Configure seu agente de IA",
                    tone: "FRIENDLY",
                    language: "pt-BR",
                    instance,
                    organizationId
                }),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Erro ao criar agente');
            }

            // Recarregar dados
            await loadData();
            setActiveTab("agente");
            addToast("Agente criado com sucesso!", "success");
        } catch (error: any) {
            console.error("Erro ao criar agente:", error);
            addToast(error.message || "Erro ao criar agente", "error");
        } finally {
            setLoading(false);
        }
    };


    if (loading && !agentConfig) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
                <Loading />
            </div>
        );
    }

    if (error && !agentConfig) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
                <ErrorDisplay message={error} onRetry={loadData} />
            </div>
        );
    }

    // Quando não houver agente configurado
    if (!loading && !agentConfig) {
        return (
            <>
                <ToastContainer toasts={toasts} removeToast={removeToast} />
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
                    <div className="max-w-2xl w-full text-center">
                        <Bot className="w-24 h-24 mx-auto text-indigo-400 mb-6" />
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Nenhum agente configurado
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                            Crie seu primeiro agente de IA ou importe uma configuração completa para começar
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={handleCreateEmptyAgent}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                            >
                                <Plus className="w-5 h-5" />
                                Criar Novo Agente
                            </button>
                            <button
                                onClick={() => {
                                    // Criar agente vazio e ir para aba de importação
                                    setActiveTab("importacao");
                                }}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors font-medium"
                            >
                                <Upload className="w-5 h-5" />
                                Importar Configuração
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
                            Dica: Use a importação para configurar rapidamente um agente completo com conhecimentos e automações
                        </p>
                    </div>
                </div>
            </>
        );
    }

    const handleSaveAgentConfig = async () => {
        if (!agentConfig) return;
        try {
            // Updated to include all fields now that sub-components are controlled
            const updatePayload = {
                name: agentConfig.name,
                description: agentConfig.description,
                language: agentConfig.language,
                tone: agentConfig.tone,
                isActive: agentConfig.isActive,
                writingStyle: agentConfig.writingStyle,
                personality: agentConfig.personality,
                prohibitions: agentConfig.prohibitions,
                // Buffer settings
                messageBufferEnabled: agentConfig.messageBufferEnabled,
                messageBufferDelayMs: agentConfig.messageBufferDelayMs,
                // Audio settings
                audioResponseEnabled: agentConfig.audioResponseEnabled,
            };

            await updateAgentConfig(agentConfig.id, updatePayload);
            addToast("Todas as configurações salvas com sucesso!", "success");
        } catch (err) {
            console.error("Erro ao salvar agente:", err);
            addToast("Erro ao salvar configurações", "error");
        }
    };

    const tabs = [
        { id: "agente" as Tab, label: "Agente", icon: Bot },
        { id: "conhecimento" as Tab, label: "Conhecimento", icon: FileText },
        { id: "estados" as Tab, label: "Estados", icon: GitBranch },
        { id: "prompts" as Tab, label: "Prompts FSM", icon: Settings },
        { id: "crm-stages" as Tab, label: "Etapas CRM", icon: TrendingUp },
        { id: "auto-scheduling" as Tab, label: "Agendamento Auto", icon: Calendar },
        { id: "zapsign" as Tab, label: "ZapSign", icon: FileText },
        { id: "followups" as Tab, label: "Followups", icon: Clock },

        { id: "importacao" as Tab, label: "Importação", icon: Upload },
    ];

    return (
        <>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                <Bot className="w-8 h-8 text-indigo-600" />
                                Configurar seu agente
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Gerencie o comportamento e conhecimento do seu agente de IA
                            </p>
                        </div>

                        {/* Status Toggle */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
                            <button
                                onClick={handleToggleStatus}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${agentStatus
                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                            >
                                <Power className="w-4 h-4" />
                                {agentStatus ? "Online" : "Offline"}
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-6">
                        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                            <nav className="flex space-x-8 px-6" aria-label="Tabs">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`
                        flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                        ${activeTab === tab.id
                                                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                                                    : "border-transparent text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-500"
                                                }
                      `}
                                        >
                                            <Icon className="w-5 h-5" />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {activeTab === "agente" && agentConfig && (
                                <AgentTab
                                    config={agentConfig}
                                    onUpdate={setAgentConfig}
                                    onSave={handleSaveAgentConfig}
                                />
                            )}

                            {activeTab === "conhecimento" && (
                                <KnowledgeTab
                                    items={knowledge}
                                    onCreate={() => {
                                        setEditingKnowledge(null);
                                        setKnowledgeForm({
                                            title: "",
                                            content: "",
                                            type: "TEXT",
                                        });
                                        setShowEditKnowledgeModal(true);
                                    }}
                                    onUpload={() => setShowUploadModal(true)}
                                    onEdit={handleEditKnowledge}
                                    onDelete={handleDeleteKnowledge}
                                />
                            )}


                            {activeTab === "estados" && (
                                <StatesTab
                                    items={states}
                                    onCreate={() => {
                                        setEditingState(null);
                                        setStateForm({
                                            name: "",
                                            missionPrompt: "",
                                            availableRoutes: {
                                                rota_de_sucesso: [],
                                                rota_de_persistencia: [],
                                                rota_de_escape: []
                                            },
                                            dataKey: null,
                                            dataDescription: null,
                                            dataType: null,
                                            tools: "",
                                            prohibitions: "",
                                            order: 0,
                                            mediaId: null,
                                            mediaTiming: null,
                                            responseType: null,
                                            crmStatus: null,
                                        });
                                        setShowStateModal(true);
                                    }}
                                    onEdit={(item) => {
                                        setEditingState(item);
                                        setStateForm({
                                            name: item.name,
                                            missionPrompt: item.missionPrompt,
                                            availableRoutes: item.availableRoutes || ({
                                                rota_de_sucesso: [],
                                                rota_de_persistencia: [],
                                                rota_de_escape: []
                                            } as AvailableRoutes),
                                            dataKey: item.dataKey || null,
                                            dataDescription: item.dataDescription || null,
                                            dataType: item.dataType || null,
                                            tools: item.tools || "",
                                            prohibitions: item.prohibitions || "",
                                            order: item.order || 0,
                                            mediaId: item.mediaId || null,
                                            mediaTiming: item.mediaTiming || null,
                                            responseType: item.responseType || null,
                                            crmStatus: item.crmStatus || null,
                                        });
                                        setShowStateModal(true);
                                    }}
                                    onDelete={handleDeleteState}
                                />
                            )}

                            {/* Prompts FSM Tab */}
                            {activeTab === "prompts" && agentConfig && (
                                <FSMPromptsEditor agentId={agentConfig.id} />
                            )}

                            {/* CRM Stages Tab */}
                            {activeTab === "crm-stages" && agentConfig && (
                                <div className="p-6">
                                    <CRMStagesEditor agentId={agentConfig.id} organizationId={organizationId || undefined} />
                                </div>
                            )}

                            {/* Auto-Scheduling Tab */}
                            {activeTab === "auto-scheduling" && agentConfig && (
                                <div className="p-6">
                                    <AutoSchedulingEditor agentId={agentConfig.id} />
                                </div>
                            )}

                            {/* ZapSign Tab */}
                            {activeTab === "zapsign" && agentConfig && (
                                <div className="p-6">
                                    <ZapSignConfigEditor agentId={agentConfig.id} />
                                </div>
                            )}

                            {activeTab === "followups" && (
                                <FollowupsTab
                                    items={followups}
                                    onCreate={() => {
                                        setEditingFollowup(null);
                                        setFollowupForm({
                                            name: "",
                                            message: "",
                                            isActive: true,
                                            crmStageId: null,
                                            triggerMode: "TIMER",
                                            delayMinutes: 60,
                                            scheduledTime: "",
                                            mediaUrls: [],
                                            videoUrl: "",
                                            businessHoursEnabled: false,
                                            businessHoursStart: "08:00",
                                            businessHoursEnd: "18:00",
                                        });
                                        setShowFollowupModal(true);
                                    }}
                                    onEdit={(item) => {
                                        setEditingFollowup(item);
                                        setFollowupForm({
                                            name: item.name,
                                            message: item.messageTemplate,
                                            isActive: item.isActive,
                                            crmStageId: item.crmStageId || null,
                                            triggerMode: item.triggerMode || "TIMER",
                                            delayMinutes: item.delayMinutes || 60,
                                            scheduledTime: item.scheduledTime || "",
                                            mediaUrls: item.mediaUrls || [],
                                            videoUrl: item.videoUrl || "",
                                            businessHoursEnabled: item.businessHoursEnabled || false,
                                            businessHoursStart: item.businessHoursStart || "08:00",
                                            businessHoursEnd: item.businessHoursEnd || "18:00",
                                        });
                                        setShowFollowupModal(true);
                                    }}
                                    onDelete={(id) => handleDeleteFollowup(String(id))}
                                />
                            )}




                            {activeTab === "importacao" && organizationId && (
                                <ImportTab
                                    organizationId={organizationId}
                                    onImportComplete={loadData}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Upload Knowledge Modal */}
            <Modal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                title="Upload de Conhecimento"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Título
                        </label>
                        <input
                            type="text"
                            value={uploadTitle}
                            onChange={(e) => setUploadTitle(e.target.value)}
                            placeholder="Ex: Manual do Produto"
                            className="input-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Arquivo
                        </label>
                        <input
                            type="file"
                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                            accept=".pdf,.txt,.docx"
                            className="w-full text-sm text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/30 dark:file:text-indigo-300 dark:hover:file:bg-indigo-900/50"
                        />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setShowUploadModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleUploadKnowledge}
                            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Upload className="w-4 h-4" />
                            Enviar
                        </button>
                    </div>
                </div>
            </Modal>

            {/* State Modal */}
            <StateModal
                isOpen={showStateModal}
                onClose={() => setShowStateModal(false)}
                onSave={handleSaveState}
                editing={editingState}
                form={stateForm}
                onFormChange={setStateForm}
                availableStates={states.map(s => s.name)}
            />

            {/* Create/Edit Knowledge Modal */}
            <Modal
                isOpen={showEditKnowledgeModal}
                onClose={() => setShowEditKnowledgeModal(false)}
                title={editingKnowledge ? "Editar Conhecimento" : "Criar Conhecimento"}
                size="lg"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Título *
                        </label>
                        <input
                            type="text"
                            value={knowledgeForm.title}
                            onChange={(e) =>
                                setKnowledgeForm({ ...knowledgeForm, title: e.target.value })
                            }
                            placeholder="Ex: Manual do Produto"
                            className="input-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tipo
                        </label>
                        <select
                            value={knowledgeForm.type}
                            onChange={(e) =>
                                setKnowledgeForm({
                                    ...knowledgeForm,
                                    type: e.target.value as "DOCUMENT" | "FAQ" | "TEXT",
                                })
                            }
                            className="input-primary"
                        >
                            <option value="TEXT">Texto</option>
                            <option value="DOCUMENT">Documento</option>
                            <option value="FAQ">FAQ</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Conteúdo *
                        </label>
                        <textarea
                            value={knowledgeForm.content}
                            onChange={(e) =>
                                setKnowledgeForm({ ...knowledgeForm, content: e.target.value })
                            }
                            placeholder="Digite o conteúdo do conhecimento..."
                            rows={8}
                            className="input-primary resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setShowEditKnowledgeModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={editingKnowledge ? handleUpdateKnowledge : handleCreateKnowledge}
                            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {editingKnowledge ? "Atualizar" : "Criar"}
                        </button>
                    </div>
                </div>
            </Modal >

            {/* Followup Modal */}
            <FollowupModal
                isOpen={showFollowupModal}
                onClose={() => setShowFollowupModal(false)}
                onSave={handleSaveFollowup}
                isEditing={!!editingFollowup}
                form={followupForm}
                onFormChange={setFollowupForm}
                agentId={agentConfig?.id || ""}
            />

            {/* State Modal */}
            <StateModal
                isOpen={showStateModal}
                onClose={() => setShowStateModal(false)}
                onSave={handleSaveState}
                editing={editingState}
                form={stateForm}
                onFormChange={setStateForm}
                availableStates={states.map(s => s.name)}
            />

            {/* Upload Loading Modal - Tela criativa de processamento */}
            {isUploading && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                        <div className="text-center">
                            {/* Animated Brain Icon */}
                            <div className="relative mx-auto w-24 h-24 mb-6">
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse opacity-20"></div>
                                <div className="absolute inset-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse opacity-40" style={{ animationDelay: '0.2s' }}></div>
                                <div className="absolute inset-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
                                    <svg className="w-10 h-10 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Processando Conhecimento
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Estamos analisando seu documento e gerando embeddings para que a IA possa entender o conteúdo.
                            </p>

                            {/* Progress Steps */}
                            <div className="space-y-3 text-left bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Arquivo recebido</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center animate-spin">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    </div>
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Gerando chunks e embeddings...</span>
                                </div>
                                <div className="flex items-center gap-3 opacity-50">
                                    <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                        <span className="text-xs text-gray-600 dark:text-gray-400">3</span>
                                    </div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Salvando na base de conhecimento</span>
                                </div>
                            </div>

                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                                ⏱️ Isso pode levar alguns segundos para documentos grandes
                            </p>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
}

// ==================== TAB COMPONENTS ====================

function AgentTab({
    config,
    onUpdate,
    onSave,
}: {
    config: AgentConfig;
    onUpdate: (config: AgentConfig) => void;
    onSave: () => void;
}) {
    const [activeTab, setActiveTab] = useState<'basic' | 'personality' | 'prohibitions' | 'style' | 'advanced'>('basic');

    const tabs = [
        { id: 'basic', label: 'Dados Básicos' },
        { id: 'personality', label: 'Personalidade' },
        { id: 'prohibitions', label: 'Restrições' },
        { id: 'style', label: 'Estilo' },
        { id: 'advanced', label: 'Avançado' },
    ] as const;

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {/* Dados Básicos */}
                {activeTab === 'basic' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações Gerais</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Nome do Agente
                                    </label>
                                    <input
                                        type="text"
                                        value={config.name}
                                        onChange={(e) => onUpdate({ ...config, name: e.target.value })}
                                        className="input-primary"
                                        placeholder="Ex: Assistente de Vendas"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Nome interno para identificação do agente.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Idioma
                                    </label>
                                    <select
                                        value={config.language}
                                        onChange={(e) => onUpdate({ ...config, language: e.target.value })}
                                        className="input-primary"
                                    >
                                        <option value="pt-BR">Português (Brasil)</option>
                                        <option value="en-US">English (US)</option>
                                        <option value="es-ES">Español</option>
                                    </select>
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Idioma principal que o agente utilizará nas conversas.
                                    </p>
                                </div>


                            </div>
                        </div>
                    </div>
                )}

                {/* Personalidade */}
                {activeTab === 'personality' && (
                    <div className="animate-in fade-in duration-300">
                        <PersonalityEditor
                            value={config.personality || null}
                            onChange={(value) => onUpdate({ ...config, personality: value || undefined })}
                        />
                    </div>
                )}

                {/* Restrições */}
                {activeTab === 'prohibitions' && (
                    <div className="animate-in fade-in duration-300">
                        <ProhibitionsEditor
                            value={config.prohibitions || null}
                            onChange={(value) => onUpdate({ ...config, prohibitions: value || undefined })}
                        />
                    </div>
                )}

                {/* Estilo */}
                {activeTab === 'style' && (
                    <div className="animate-in fade-in duration-300">
                        <WritingStyleEditor
                            value={config.writingStyle || null}
                            onChange={(value) => onUpdate({ ...config, writingStyle: value || undefined })}
                        />
                    </div>
                )}

                {/* Avançado */}
                {activeTab === 'advanced' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Buffer de Mensagens */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Buffer de Mensagens
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Acumula múltiplas mensagens do usuário antes de responder, humanizando as conversas.
                                    </p>
                                </div>
                                <button
                                    onClick={() => onUpdate({ ...config, messageBufferEnabled: !config.messageBufferEnabled })}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${config.messageBufferEnabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                                        }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${config.messageBufferEnabled ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>

                            {config.messageBufferEnabled && (
                                <div className="space-y-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    {/* Delay */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Tempo de Espera
                                            </label>
                                            <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                                                {(config.messageBufferDelayMs || 2000) / 1000}s
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1000"
                                            max="180000"
                                            step="1000"
                                            value={config.messageBufferDelayMs || 2000}
                                            onChange={(e) => onUpdate({ ...config, messageBufferDelayMs: parseInt(e.target.value) })}
                                            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            <span>1s</span>
                                            <span>60s</span>
                                            <span>120s</span>
                                            <span>180s</span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                            A IA aguarda esse tempo coletando TODAS as mensagens enviadas antes de responder.
                                        </p>
                                    </div>

                                    {/* Info Box */}
                                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                                                    Como funciona?
                                                </h4>
                                                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                                                    Quando o usuário envia &quot;Oi&quot;, &quot;Tudo bem?&quot;, &quot;Quero preço&quot; rapidamente,
                                                    a IA acumula todas as mensagens e responde uma única vez de forma natural,
                                                    ao invés de responder cada mensagem individualmente.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Resposta em Áudio */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Resposta em Áudio
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Quando ativado, a IA responde com áudio se receber áudio. Quando desativado, sempre responde em texto.
                                    </p>
                                </div>
                                <button
                                    onClick={() => onUpdate({ ...config, audioResponseEnabled: config.audioResponseEnabled === false ? true : false })}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${config.audioResponseEnabled !== false ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                                        }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${config.audioResponseEnabled !== false ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Info Box */}
                            <div className={`${config.audioResponseEnabled !== false ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'} border rounded-lg p-4`}>
                                <div className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${config.audioResponseEnabled !== false ? 'bg-green-100 dark:bg-green-800' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                        {config.audioResponseEnabled !== false ? (
                                            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-medium ${config.audioResponseEnabled !== false ? 'text-green-800 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {config.audioResponseEnabled !== false ? 'Áudio Ativado' : 'Apenas Texto'}
                                        </h4>
                                        <p className={`text-sm mt-1 ${config.audioResponseEnabled !== false ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                            {config.audioResponseEnabled !== false
                                                ? 'A IA responde com áudio quando o usuário envia áudio, e texto quando envia texto.'
                                                : 'A IA sempre responde em texto, mesmo quando o usuário envia mensagens de áudio.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Save Button - Always Visible */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pt-4 mt-8 z-10 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <button
                    onClick={onSave}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium shadow-lg"
                >
                    <Save className="w-5 h-5" />
                    Salvar Todas as Configurações
                </button>
            </div>
        </div >
    );
}

function KnowledgeTab({
    items,
    onUpload,
    onCreate,
    onEdit,
    onDelete,
}: {
    items: KnowledgeItem[];
    onUpload: () => void;
    onCreate: () => void;
    onEdit: (item: KnowledgeItem) => void;
    onDelete: (id: string) => void;
}) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredItems = items.filter((item) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            item.title.toLowerCase().includes(term) ||
            item.content.toLowerCase().includes(term) ||
            (item.fileName && item.fileName.toLowerCase().includes(term))
        );
    });

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Base de Conhecimento
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={onCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Criar
                    </button>
                    <button
                        onClick={onUpload}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-lg transition-colors"
                    >
                        <Upload className="w-4 h-4" />
                        Upload
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Pesquisar conhecimentos por título, conteúdo..."
                className="max-w-md"
            />

            {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems.map((item) => (
                        <div
                            key={item.id}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <FileText className="w-8 h-8 text-indigo-600" />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onDelete(item.id)}
                                        className="text-red-600 hover:text-red-700"
                                        title="Deletar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h4>

                            {item.fileName && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{item.fileName}</p>
                            )}

                            {item.fileSize && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">{item.fileSize} bytes</p>
                            )}

                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                Criado em: {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>{searchTerm ? 'Nenhum conhecimento encontrado' : 'Nenhum documento na base de conhecimento'}</p>
                    {!searchTerm && (
                        <button
                            onClick={onUpload}
                            className="mt-4 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                        >
                            Fazer primeiro upload
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

function FollowupsTab({
    items,
    onCreate,
    onEdit,
    onDelete,
}: {
    items: AgentFollowUp[];
    onCreate: () => void;
    onEdit: (item: AgentFollowUp) => void;
    onDelete: (id: string) => void;
}) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredItems = items.filter((item) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            item.name.toLowerCase().includes(term) ||
            item.messageTemplate.toLowerCase().includes(term) ||
            (item.agentState?.name && item.agentState.name.toLowerCase().includes(term)) ||
            (item.crmStage?.name && item.crmStage.name.toLowerCase().includes(term))
        );
    });

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Follow-ups Automáticos
                </h3>
                <button
                    onClick={onCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Novo Follow-up
                </button>
            </div>

            {/* Search Bar */}
            <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Pesquisar follow-ups por nome, mensagem..."
                className="max-w-md"
            />

            <div className="space-y-3">
                {filteredItems.map((item) => (
                    <div
                        key={item.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">{item.name}</h4>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${item.isActive
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                            }`}
                                    >
                                        {item.isActive ? "Ativo" : "Inativo"}
                                    </span>
                                </div>


                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                    "{item.messageTemplate}"
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                    Delay: {item.delayMinutes} minutos
                                </p>
                                {item.agentState && (
                                    <p className="text-xs text-indigo-600 mt-1 font-medium">
                                        Estado: {item.agentState.name}
                                    </p>
                                )}
                                {item.crmStage && (
                                    <span
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1"
                                        style={{ backgroundColor: `${item.crmStage.color}20`, color: item.crmStage.color }}
                                    >
                                        Etapa CRM: {item.crmStage.name}
                                    </span>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => onEdit(item)}
                                    className="text-indigo-600 hover:text-indigo-700"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onDelete(item.id)}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredItems.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>{searchTerm ? 'Nenhum follow-up encontrado' : 'Nenhum follow-up configurado'}</p>
                    {!searchTerm && (
                        <button
                            onClick={onCreate}
                            className="mt-4 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                        >
                            Criar primeiro follow-up
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}


