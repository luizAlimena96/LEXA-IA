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
import api from "../lib/api-client";
import type { AgentConfig, KnowledgeItem, AgentFollowUp, AgentState, AvailableRoutes } from "@/app/types";

import { useSearchParams, useRouter } from "next/navigation";
import ImportTab from "./components/ImportTab";
import StatesTab from "./components/StatesTab";
import StateModal from "./components/StateModal";
import ZapSignConfigEditor from "./components/ZapSignConfigEditor";

type Tab = "agente" | "conhecimento" | "followups" | "importacao" | "estados" | "prompts" | "crm-stages" | "auto-scheduling" | "zapsign";

// Wrapper functions to map old service calls to new API calls
const getAgentConfig = (agentId?: string, organizationId?: string) => {
    if (organizationId) {
        return api.agents.list().then((agents: any[]) => agents.filter(a => a.organizationId === organizationId));
    }
    return agentId ? api.agents.get(agentId).then(a => [a]) : api.agents.list();
};

const updateAgentConfig = (agentId: string, data: any) => api.agents.update(agentId, data);
const toggleAgentStatus = (agentId: string, status: boolean) => api.agents.update(agentId, { isActive: status });

const getKnowledge = (agentId?: string, organizationId?: string) => {
    return api.knowledge.list().then((items: any[]) => {
        if (organizationId) return items.filter(k => k.organizationId === organizationId);
        if (agentId) return items.filter(k => k.agentId === agentId);
        return items;
    });
};

const uploadKnowledge = async (file: File, title: string, agentId: string, organizationId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('agentId', agentId);
    if (organizationId) {
        formData.append('organizationId', organizationId);
    }
    const response = await api.knowledge.upload(formData);
    // Backend returns { success: true, knowledge }, extract knowledge
    return response.knowledge;
};
const createKnowledge = (data: any) => api.knowledge.create(data);
const updateKnowledge = (id: string, data: any) => api.knowledge.update(id, data);
const deleteKnowledge = (id: string) => api.knowledge.delete(id);

const getStates = (agentId?: string, organizationId?: string) => api.states.list(agentId, organizationId);
const createState = (data: any) => api.states.create(data);
const updateState = (id: string, data: any) => api.states.update(id, data);
const deleteState = (id: string) => api.states.delete(id);

const getFollowups = (agentId?: string) => api.followups.list(agentId);
const createFollowup = (data: any) => api.followups.create(data);
const updateFollowup = (id: string, data: any) => api.followups.update(id, data);
const deleteFollowup = (id: string) => api.followups.delete(id);

const getAgentFollowUps = (agentId: string) => api.followups.list(agentId);
const createAgentFollowUp = (agentId: string, data: any) => api.followups.create({ ...data, agentId });
const updateAgentFollowUp = (agentId: string, id: string, data: any) => api.followups.update(id, data);
const deleteAgentFollowUp = (agentId: string, id: string) => api.followups.delete(id);

export default function AgentesPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
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
        mediaItems: [] as any[],
        businessHoursEnabled: false,
        businessHoursStart: "08:00",
        businessHoursEnd: "18:00",
        aiDecisionEnabled: false,
        aiDecisionPrompt: "",
    });

    const [crmStages, setCrmStages] = useState<Array<{ id: string; name: string; color: string; order: number }>>([]);

    // States (FSM) State
    const [states, setStates] = useState<AgentState[]>([]);
    const [showStateModal, setShowStateModal] = useState(false);
    const [isCheckingTemplates, setIsCheckingTemplates] = useState(true); // New state for redirect check
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
        mediaItems: [] as any[], // Add mediaItems
    });

    // Organization and Cloud API state
    const [organization, setOrganization] = useState<any>(null);
    const [isCloudApi, setIsCloudApi] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState<'followups' | 'templates'>('followups');

    useEffect(() => {
        loadData();
    }, [activeTab, organizationId]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Sempre carregar configurações do agente se não estiverem carregadas ou se a organização mudou
            let currentAgent = agentConfig;

            // Se tivermos um organizationId na URL e o agente atual não for dessa organização, resetar
            if (organizationId && currentAgent?.organizationId && currentAgent.organizationId !== organizationId) {
                console.log('[AgentesPage] Organization mismatch, reloading agent...');
                currentAgent = null;
                setAgentConfig(null);
                setStates([]); // Limpar states antigos
            }

            if (!currentAgent) {
                const configs = await getAgentConfig(undefined, organizationId || undefined);
                console.log('[AgentesPage] Loaded agents:', configs);
                console.log('[AgentesPage] Selected agent (first):', configs[0]);
                currentAgent = configs[0] || null;
                setAgentConfig(currentAgent);
                setAgentStatus(currentAgent?.isActive || false);
            }

            // Load organization data to check Cloud API status
            if (currentAgent?.organizationId) {
                try {
                    const orgData = await api.organizations.get(currentAgent.organizationId);
                    setOrganization(orgData);
                    // Check if Cloud API is enabled
                    const cloudApiEnabled = orgData.preferredChannel === 'cloud_api' ||
                        orgData.whatsappCloudEnabled === true;
                    setIsCloudApi(cloudApiEnabled);
                    console.log('[AgentesPage] Cloud API enabled:', cloudApiEnabled, {
                        preferredChannel: orgData.preferredChannel,
                        whatsappCloudEnabled: orgData.whatsappCloudEnabled
                    });
                } catch (error) {
                    console.error('[AgentesPage] Failed to load organization:', error);
                }
            }

            // Se não houver agente e a organização usa templates, redirecionar para seleção
            if (!currentAgent && organizationId) {
                try {
                    const orgData = await api.organizations.get(organizationId);
                    if (orgData.useAgentTemplates) {
                        console.log('[AgentesPage] Organization uses templates, redirecting to template selection...');
                        router.push(`/admin/agent-templates/select?organizationId=${organizationId}`);
                        return;
                    }
                } catch (error) {
                    console.error('[AgentesPage] Failed to load organization:', error);
                }
            }

            setIsCheckingTemplates(false); // Check complete

            if (activeTab === "agente") {
                // Já carregamos
            } else if (activeTab === "conhecimento") {
                const data = await getKnowledge(undefined, organizationId || undefined);
                setKnowledge(data);
            } else if (activeTab === "followups") {
                if (currentAgent?.id) {
                    const data = await getAgentFollowUps(currentAgent.id);
                    setFollowups(data);

                    // Load CRM stages for the tabs
                    try {
                        const stagesData = await api.agents.crmStages.list(currentAgent.id);
                        setCrmStages(stagesData);
                    } catch (e) {
                        console.error('Failed to load CRM stages:', e);
                    }
                }
                // Load states for the modal selector
                if (states.length === 0 && currentAgent?.id) {
                    const statesData = await getStates(currentAgent.id, organizationId || undefined);
                    setStates(statesData);
                }

            } else if (activeTab === "estados") {
                if (currentAgent?.id) {
                    const data = await getStates(currentAgent.id, organizationId || undefined);
                    setStates(data);
                }
            } else if (activeTab === "crm-stages" || activeTab === "auto-scheduling") {
                // Data already ensured via currentAgent check above
            }
        } catch (err) {
            setError("Erro ao carregar dados");
            console.error(err);
            setIsCheckingTemplates(false);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async () => {
        if (!agentConfig) return;
        try {
            const newStatus = !agentStatus;
            await toggleAgentStatus(agentConfig.id, newStatus);
            setAgentStatus(newStatus);
            addToast(
                `Agente ${newStatus ? "ativado" : "desativado"} com sucesso!`,
                "success"
            );
        } catch (err) {
            addToast("Erro ao alterar status", "error");
        }
    };

    const handleReorderStates = async (newStates: AgentState[]) => {
        if (!agentConfig?.id) return;

        // Optimistic update
        setStates(newStates);

        try {
            await api.states.reorder({
                agentId: agentConfig.id,
                items: newStates.map(s => ({ id: s.id, order: s.order }))
            });
        } catch (error) {
            console.error('Error reordering states:', error);
            addToast("Erro ao reordenar estados", "error");
            loadData(); // Revert
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
            type: item.type || "TEXT",
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

        // Validation: name is required, AND either message or aiDecisionPrompt must be provided
        const hasMessage = followupForm.message?.trim();
        const hasAiPrompt = followupForm.aiDecisionEnabled && followupForm.aiDecisionPrompt?.trim();

        if (!followupForm.name.trim()) {
            addToast("Preencha o nome do follow-up", "error");
            return;
        }

        if (!hasMessage && !hasAiPrompt) {
            addToast("Preencha a mensagem ou habilite IA com prompt", "error");
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
                    mediaItems: followupForm.mediaItems,
                    businessHoursEnabled: followupForm.businessHoursEnabled,
                    businessHoursStart: followupForm.businessHoursStart,
                    businessHoursEnd: followupForm.businessHoursEnd,
                    isActive: followupForm.isActive,
                    crmStageId: followupForm.crmStageId || undefined,
                    aiDecisionEnabled: followupForm.aiDecisionEnabled,
                    aiDecisionPrompt: followupForm.aiDecisionPrompt,
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
                    mediaItems: followupForm.mediaItems,
                    businessHoursEnabled: followupForm.businessHoursEnabled,
                    businessHoursStart: followupForm.businessHoursStart,
                    businessHoursEnd: followupForm.businessHoursEnd,
                    isActive: followupForm.isActive,
                    crmStageId: followupForm.crmStageId,
                    aiDecisionEnabled: followupForm.aiDecisionEnabled,
                    aiDecisionPrompt: followupForm.aiDecisionPrompt,
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
                mediaItems: [],
                businessHoursEnabled: false,
                businessHoursStart: "08:00",
                businessHoursEnd: "18:00",
                aiDecisionEnabled: false,
                aiDecisionPrompt: "",
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
                // Exclude order so backend calculates it (puts at the end)
                const { order, ...stateData } = stateForm;
                await createState({
                    ...stateData,
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
                mediaItems: [],
            });
        } catch (err: any) {
            console.error(err);
            addToast(err.response?.data?.message || err.message || "Erro ao salvar estado", "error");
        }
    };

    const handleDeleteState = async (id: string) => {
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

            // Use api-client which handles authentication automatically
            await api.agents.create({
                name: "Novo Agente",
                description: "Configure seu agente de IA",
                tone: "FRIENDLY",
                language: "pt-BR",
                instance,
                organizationId
            });

            // Recarregar dados
            await loadData();
            setActiveTab("agente");
            addToast("Agente criado com sucesso!", "success");
        } catch (error: any) {
            console.error("Erro ao criar agente:", error);
            addToast(error.response?.data?.message || error.message || "Erro ao criar agente", "error");
        } finally {
            setLoading(false);
        }
    };


    if ((loading || isCheckingTemplates) && !agentConfig) {
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
                // AI Control via Emoji
                aiControlEnabled: agentConfig.aiControlEnabled,
                aiDisableEmoji: agentConfig.aiDisableEmoji,
                aiEnableEmoji: agentConfig.aiEnableEmoji,
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
                <div className="w-full">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                                Agentes IA
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Gerencie e configure seus assistentes virtuais
                            </p>
                        </div>

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

                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 mb-6">
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
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

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
                                    onReorder={handleReorderStates}
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
                                            mediaItems: [],
                                        });
                                        setShowStateModal(true);
                                    }}
                                    onEdit={(item) => {
                                        setEditingState(item as any);
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
                                            mediaItems: item.mediaItems || [],
                                        });
                                        setShowStateModal(true);
                                    }}
                                    onDelete={handleDeleteState}
                                />
                            )}

                            {activeTab === "prompts" && agentConfig && (
                                <FSMPromptsEditor agentId={agentConfig.id} />
                            )}
                            {activeTab === "crm-stages" && agentConfig && (
                                <div className="p-6">
                                    <CRMStagesEditor agentId={agentConfig.id} organizationId={organizationId || undefined} />
                                </div>
                            )}
                            {activeTab === "auto-scheduling" && agentConfig && (
                                <div className="p-6">
                                    <AutoSchedulingEditor agentId={agentConfig.id} />
                                </div>
                            )}
                            {activeTab === "zapsign" && agentConfig && (
                                <div className="p-6">
                                    <ZapSignConfigEditor agentId={agentConfig.id} />
                                </div>
                            )}

                            {activeTab === "followups" && (
                                <FollowupsTab
                                    items={followups}
                                    crmStages={crmStages}
                                    organizationId={agentConfig?.organizationId || ""}
                                    preferredChannel={(agentConfig as any)?.organization?.preferredChannel}
                                    onCreate={(crmStageId) => {
                                        setEditingFollowup(null);
                                        setFollowupForm({
                                            name: "",
                                            message: "",
                                            isActive: true,
                                            crmStageId: crmStageId || null,
                                            triggerMode: "TIMER",
                                            delayMinutes: 60,
                                            scheduledTime: "",
                                            mediaItems: [],
                                            businessHoursEnabled: false,
                                            businessHoursStart: "08:00",
                                            businessHoursEnd: "18:00",
                                            aiDecisionEnabled: false,
                                            aiDecisionPrompt: "",
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
                                            mediaItems: item.mediaItems || [],
                                            businessHoursEnabled: item.businessHoursEnabled || false,
                                            businessHoursStart: item.businessHoursStart || "08:00",
                                            businessHoursEnd: item.businessHoursEnd || "18:00",
                                            aiDecisionEnabled: item.aiDecisionEnabled || false,
                                            aiDecisionPrompt: item.aiDecisionPrompt || "",
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

            <StateModal
                isOpen={showStateModal}
                onClose={() => setShowStateModal(false)}
                onSave={handleSaveState}
                editing={editingState}
                form={stateForm}
                onFormChange={setStateForm}
                availableStates={states.map(s => s.name)}
            />

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

            <FollowupModal
                isOpen={showFollowupModal}
                onClose={() => setShowFollowupModal(false)}
                onSave={handleSaveFollowup}
                isEditing={!!editingFollowup}
                form={followupForm}
                onFormChange={setFollowupForm}
                agentId={agentConfig?.id || ""}
            />

            <StateModal
                isOpen={showStateModal}
                onClose={() => setShowStateModal(false)}
                onSave={handleSaveState}
                editing={editingState}
                form={stateForm}
                onFormChange={setStateForm}
                availableStates={states.map(s => s.name)}
            />

            {isUploading && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                        <div className="text-center">
                            <div className="relative mx-auto w-16 h-16 mb-6 flex items-center justify-center">
                                <div className="absolute inset-0 bg-indigo-100 dark:bg-indigo-900 rounded-full animate-pulse"></div>
                                <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Processando Conhecimento
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Estamos analisando seu documento e gerando embeddings para que a IA possa entender o conteúdo.
                            </p>

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

            <div className="mt-6">
                {activeTab === 'basic' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
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

                {activeTab === 'personality' && (
                    <div className="animate-in fade-in duration-300">
                        <PersonalityEditor
                            value={config.personality || null}
                            onChange={(value) => onUpdate({ ...config, personality: value || undefined })}
                        />
                    </div>
                )}

                {activeTab === 'prohibitions' && (
                    <div className="animate-in fade-in duration-300">
                        <ProhibitionsEditor
                            value={config.prohibitions || null}
                            onChange={(value) => onUpdate({ ...config, prohibitions: value || undefined })}
                        />
                    </div>
                )}

                {activeTab === 'style' && (
                    <div className="animate-in fade-in duration-300">
                        <WritingStyleEditor
                            value={config.writingStyle || null}
                            onChange={(value) => onUpdate({ ...config, writingStyle: value || undefined })}
                        />
                    </div>
                )}

                {activeTab === 'advanced' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
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

                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
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

                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Controle de IA via Emoji
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Permite desligar/ligar a IA enviando um emoji específico na conversa.
                                    </p>
                                </div>
                                <button
                                    onClick={() => onUpdate({ ...config, aiControlEnabled: !config.aiControlEnabled })}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${config.aiControlEnabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                                        }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${config.aiControlEnabled ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>

                            {config.aiControlEnabled && (
                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Emoji para Desligar IA
                                            </label>
                                            <input
                                                type="text"
                                                value={config.aiDisableEmoji || ''}
                                                onChange={(e) => onUpdate({ ...config, aiDisableEmoji: e.target.value })}
                                                className="input-primary text-center text-2xl"
                                                maxLength={4}
                                            />
                                            <div className="flex items-center gap-1.5 mt-1.5">
                                                {['🚫', '⛔', '🛑', '❌'].map(emoji => (
                                                    <button
                                                        key={emoji}
                                                        type="button"
                                                        onClick={() => onUpdate({ ...config, aiDisableEmoji: emoji })}
                                                        className="text-sm opacity-40 hover:opacity-100 hover:scale-110 transition-all"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                Ao enviar este emoji, a IA será pausada nesta conversa.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>



            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pt-4 mt-8 z-10 p-4 flex justify-end">
                <button
                    onClick={onSave}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
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
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-lg transition-colors"
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
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors bg-white dark:bg-gray-800"
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
    crmStages,
    selectedStageId,
    onStageChange,
    organizationId,
    preferredChannel,
}: {
    items: AgentFollowUp[];
    onCreate: (crmStageId?: string | null) => void;
    onEdit: (item: AgentFollowUp) => void;
    onDelete: (id: string) => void;
    crmStages?: Array<{ id: string; name: string; color: string; order: number }>;
    selectedStageId?: string | null;
    onStageChange?: (stageId: string | null) => void;
    organizationId: string;
    preferredChannel?: string;
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeStageTab, setActiveStageTab] = useState<string | null>(selectedStageId || null);

    useEffect(() => {
        if (selectedStageId !== undefined) {
            setActiveStageTab(selectedStageId);
        }
    }, [selectedStageId]);

    const handleStageChange = (stageId: string | null) => {
        setActiveStageTab(stageId);
        onStageChange?.(stageId);
    };

    const sortedStages = [...(crmStages || [])].sort((a, b) => a.order - b.order);

    const [activeSubTab, setActiveSubTab] = useState<'followups' | 'templates'>('followups');
    const [templates, setTemplates] = useState<any[]>([]);
    const [templatesLoading, setTemplatesLoading] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [templateForm, setTemplateForm] = useState({
        name: '',
        category: 'MARKETING',
        language: 'pt_BR',
        bodyText: '',
        footerText: '',
    });

    const isCloudApi = preferredChannel === 'cloud_api';

    const loadTemplates = async () => {
        if (!organizationId) return;
        setTemplatesLoading(true);
        try {
            const data = await api.organizations.templates.list(organizationId);
            setTemplates(data);
        } catch (error) {
            console.error('Error loading templates:', error);
            setTemplates([]);
        } finally {
            setTemplatesLoading(false);
        }
    };

    useEffect(() => {
        if (isCloudApi && activeSubTab === 'templates' && templates.length === 0) {
            loadTemplates();
        }
    }, [activeSubTab, isCloudApi]);

    const handleSaveTemplate = async () => {
        if (!organizationId || !templateForm.name || !templateForm.bodyText) {
            alert('Preencha nome e corpo do template');
            return;
        }
        try {
            await api.organizations.templates.create(organizationId, templateForm);
            setShowTemplateModal(false);
            setTemplateForm({ name: '', category: 'MARKETING', language: 'pt_BR', bodyText: '', footerText: '' });
            loadTemplates();
        } catch (error) {
            console.error('Error creating template:', error);
            alert('Erro ao criar template');
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este template?')) return;
        try {
            await api.organizations.templates.delete(organizationId!, id);
            loadTemplates();
        } catch (error) {
            console.error('Error deleting template:', error);
            alert('Erro ao excluir template');
        }
    };

    const filteredItems = items.filter((item) => {
        if (activeStageTab !== null) {
            if (item.crmStageId !== activeStageTab) return false;
        }

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
                    {isCloudApi && activeSubTab === 'templates' ? 'Templates (API Oficial)' : 'Follow-ups Automáticos'}
                </h3>
                {(!isCloudApi || activeSubTab === 'followups') && (
                    <button
                        onClick={() => onCreate(activeStageTab)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Follow-up
                    </button>
                )}
                {isCloudApi && activeSubTab === 'templates' && (
                    <button
                        onClick={() => setShowTemplateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Template
                    </button>
                )}
            </div >
            {
                sortedStages.length > 0 && (
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="flex space-x-4 overflow-x-auto pb-px" aria-label="CRM Stages">
                            <button
                                onClick={() => handleStageChange(null)}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeStageTab === null
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                                    }`}
                            >
                                Todos
                                <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                    {items.length}
                                </span>
                            </button>
                            {sortedStages.map((stage) => {
                                const count = items.filter(item => item.crmStageId === stage.id).length;
                                return (
                                    <button
                                        key={stage.id}
                                        onClick={() => handleStageChange(stage.id)}
                                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeStageTab === stage.id
                                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                                            }`}
                                    >
                                        <span
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: stage.color }}
                                        />
                                        {stage.name}
                                        {count > 0 && (
                                            <span
                                                className="px-2 py-0.5 rounded-full text-xs"
                                                style={{ backgroundColor: `${stage.color}20`, color: stage.color }}
                                            >
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                )
            }

            {
                isCloudApi && (
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex gap-4">
                            <button
                                onClick={() => setActiveSubTab('followups')}
                                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeSubTab === 'followups'
                                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                Follow-ups
                            </button>
                            <button
                                onClick={() => setActiveSubTab('templates')}
                                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeSubTab === 'templates'
                                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                Templates (API Oficial)
                            </button>
                        </nav>
                    </div>
                )
            }

            {
                (!isCloudApi || activeSubTab === 'followups') && (
                    <>
                        <SearchInput
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Pesquisar follow-ups por nome, mensagem..."
                            className="max-w-md"
                        />

                        {isCloudApi && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    <strong>API Oficial habilitada:</strong> Follow-ups fora da janela de 24h usarão automaticamente templates aprovados. Configure templates na aba "Templates".
                                </p>
                            </div>
                        )}

                        <div className="space-y-3">
                            {filteredItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors bg-white dark:bg-gray-800"
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

                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${item.aiDecisionEnabled
                                                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                                        }`}
                                                >
                                                    {item.aiDecisionEnabled ? (
                                                        <>
                                                            <span>🤖</span> IA
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>✏️</span> Customizável
                                                        </>
                                                    )}
                                                </span>
                                            </div>


                                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                                {item.aiDecisionEnabled ? (
                                                    <span className="text-purple-600 dark:text-purple-400">
                                                        <span className="font-semibold">Prompt:</span> "{item.aiDecisionPrompt || '(Prompt vazio)'}"
                                                    </span>
                                                ) : (
                                                    <span>"{item.messageTemplate}"</span>
                                                )}
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

                        {
                            filteredItems.length === 0 && (
                                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                    <p>{searchTerm ? 'Nenhum follow-up encontrado' : activeStageTab ? 'Nenhum follow-up nesta etapa' : 'Nenhum follow-up configurado'}</p>
                                    {!searchTerm && (
                                        <button
                                            onClick={() => onCreate(activeStageTab)}
                                            className="mt-4 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                                        >
                                            Criar primeiro follow-up{activeStageTab && sortedStages.find(s => s.id === activeStageTab) ? ` para "${sortedStages.find(s => s.id === activeStageTab)?.name}"` : ''}
                                        </button>
                                    )}
                                </div>
                            )
                        }
                    </>
                )
            }

            {
                isCloudApi && activeSubTab === 'templates' && (
                    <div className="space-y-4">
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                <strong>⚠️ Importante:</strong> Templates precisam ser aprovados pelo Meta antes de serem utilizados. O processo de aprovação pode levar de algumas horas a alguns dias.
                            </p>
                        </div>

                        {templatesLoading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                                <p className="mt-4 text-gray-500">Carregando templates...</p>
                            </div>
                        ) : templates.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                <p>Nenhum template configurado</p>
                                <button
                                    onClick={() => setShowTemplateModal(true)}
                                    className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                    Criar primeiro template
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {templates.map((template: any) => (
                                    <div
                                        key={template.id}
                                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-semibold text-gray-900 dark:text-white">{template.name}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${template.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                    template.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                        template.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                            'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {template.status === 'APPROVED' ? '✓ Aprovado' :
                                                        template.status === 'PENDING' ? '⏳ Pendente' :
                                                            template.status === 'REJECTED' ? '✗ Rejeitado' :
                                                                template.status}
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteTemplate(template.id)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                            Categoria: {template.category} | Idioma: {template.language}
                                        </p>
                                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-3 text-sm text-gray-700 dark:text-gray-300">
                                            {template.bodyText}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {showTemplateModal && (
                            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Novo Template</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Template *</label>
                                            <input
                                                type="text"
                                                value={templateForm.name}
                                                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                                placeholder="ex: followup_24h"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                                                <select
                                                    value={templateForm.category}
                                                    onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                                >
                                                    <option value="MARKETING">Marketing</option>
                                                    <option value="UTILITY">Utilidade</option>
                                                    <option value="AUTHENTICATION">Autenticação</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Idioma</label>
                                                <select
                                                    value={templateForm.language}
                                                    onChange={(e) => setTemplateForm({ ...templateForm, language: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                                >
                                                    <option value="pt_BR">Português (BR)</option>
                                                    <option value="en_US">English (US)</option>
                                                    <option value="es">Español</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Corpo da Mensagem *</label>
                                            <textarea
                                                value={templateForm.bodyText}
                                                onChange={(e) => setTemplateForm({ ...templateForm, bodyText: e.target.value })}
                                                rows={4}
                                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                                placeholder="Olá {{1}}! Notamos que você ficou interessado em nossos serviços..."
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Use {`{{1}}`}, {`{{2}}`}, etc. para variáveis</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rodapé (opcional)</label>
                                            <input
                                                type="text"
                                                value={templateForm.footerText}
                                                onChange={(e) => setTemplateForm({ ...templateForm, footerText: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                                placeholder="Responda esta mensagem para falar conosco"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 mt-6">
                                        <button
                                            onClick={() => setShowTemplateModal(false)}
                                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleSaveTemplate}
                                            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                                        >
                                            Salvar Template
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )
            }
        </div >
    );
}
