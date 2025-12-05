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
} from "lucide-react";
import Loading from "../components/Loading";
import ErrorDisplay from "../components/Error";
import Modal from "../components/Modal";
import FollowupModal from "./components/modals/FollowupModal";
import { useToast, ToastContainer } from "../components/Toast";
import {
    getAgentConfig,
    updateAgentConfig,
    toggleAgentStatus,
    getKnowledge,
    uploadKnowledge,
    createKnowledge,
    updateKnowledge,
    deleteKnowledge,
    getMatrix,
    createMatrixItem,
    updateMatrixItem,
    deleteMatrixItem,
    getFollowups,
    createFollowup,
    updateFollowup,
    deleteFollowup,
    getReminders,
    createReminder,
    updateReminder,
    deleteReminder,
    type AgentConfig,
    type KnowledgeItem,
    type MatrixItem,
    type AgentFollowUp,
    type Reminder,
    getStates,
    createState,
    updateState,
    deleteState,
    type AgentState,
    getAgentFollowUps,
    createAgentFollowUp,
    updateAgentFollowUp,
    deleteAgentFollowUp,
} from "../services/agentService";

import { useSearchParams } from "next/navigation";
import ImportTab from "./components/ImportTab";
import StatesTab from "./components/StatesTab";
import StateModal from "./components/StateModal";

type Tab = "agente" | "conhecimento" | "matriz" | "followups" | "lembretes" | "importacao" | "estados";

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
    const [knowledgeForm, setKnowledgeForm] = useState({
        title: "",
        content: "",
        type: "TEXT" as "DOCUMENT" | "FAQ" | "TEXT",
    });

    // Matrix State
    const [matrix, setMatrix] = useState<MatrixItem[]>([]);
    const [showMatrixModal, setShowMatrixModal] = useState(false);
    const [editingMatrix, setEditingMatrix] = useState<MatrixItem | null>(null);
    const [matrixForm, setMatrixForm] = useState({
        title: "",
        category: "",
        description: "",
        response: "",
        priority: 1,
        personality: "",
        prohibitions: "",
        scheduling: "",
        data: "",
        writing: "",
        dataExtraction: "",
        matrixFlow: "",
    });

    // Followups State
    const [followups, setFollowups] = useState<AgentFollowUp[]>([]);
    const [showFollowupModal, setShowFollowupModal] = useState(false);
    const [editingFollowup, setEditingFollowup] = useState<AgentFollowUp | null>(null);
    const [followupForm, setFollowupForm] = useState({
        name: "",
        message: "",
        isActive: true,
        agentStateId: null as string | null,
        triggerMode: "TIMER",
        delayMinutes: 60,
        scheduledTime: "",
        mediaUrls: [] as string[],
        videoUrl: "",
        businessHoursEnabled: false,
        businessHoursStart: "08:00",
        businessHoursEnd: "18:00",
    });

    // Reminders State
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
    const [reminderForm, setReminderForm] = useState({
        title: "",
        message: "",
        scheduledFor: "",
        recipients: "",
        isActive: true,
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
        },
        dataCollections: [] as Array<{
            key: string;
            type: string;
            description: string;
        }>,
        dataKey: "" as string,
        dataDescription: "" as string,
        dataType: "" as string,
        tools: "" as string,
        prohibitions: "" as string,
        order: 0,
        matrixItemId: null as string | null,
        // Novos campos avançados
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
            } else if (activeTab === "matriz") {
                const data = await getMatrix(undefined, organizationId || undefined);
                setMatrix(data);
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
            } else if (activeTab === "lembretes") {
                const data = await getReminders(undefined, organizationId || undefined);
                setReminders(data);
            } else if (activeTab === "estados") {
                const data = await getStates(undefined, organizationId || undefined);
                setStates(data);
                // Also load matrix for the modal selector
                if (matrix.length === 0) {
                    const matrixData = await getMatrix(undefined, organizationId || undefined);
                    setMatrix(matrixData);
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

        try {
            const newItem = await uploadKnowledge(uploadFile, uploadTitle);
            setKnowledge([...knowledge, newItem]);
            setShowUploadModal(false);
            setUploadFile(null);
            setUploadTitle("");
            addToast("Arquivo enviado com sucesso!", "success");
        } catch (err) {
            addToast("Erro ao enviar arquivo", "error");
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

    const handleSaveMatrix = async () => {
        console.log("handleSaveMatrix iniciado");
        console.log("Form data:", matrixForm);
        console.log("Agent Config:", agentConfig);

        if (
            !matrixForm.title.trim() ||
            !matrixForm.category.trim() ||
            !matrixForm.description.trim() ||
            !matrixForm.response.trim() ||
            !matrixForm.personality.trim() ||
            !matrixForm.prohibitions.trim() ||
            !matrixForm.scheduling.trim() ||
            !matrixForm.data.trim() ||
            !matrixForm.writing.trim() ||
            !matrixForm.dataExtraction.trim() ||
            !matrixForm.matrixFlow.trim()
        ) {
            console.log("Falha na validação dos campos obrigatórios");
            addToast("Preencha todos os campos obrigatórios", "error");
            return;
        }

        try {
            if (editingMatrix) {
                console.log("Atualizando item existente:", editingMatrix.id);
                await updateMatrixItem(editingMatrix.id, matrixForm);
                setMatrix(
                    matrix.map((m) =>
                        m.id === editingMatrix.id ? { ...m, ...matrixForm } : m
                    )
                );
                addToast("Item atualizado com sucesso!", "success");
            } else {
                if (!agentConfig?.id) {
                    console.error("Erro: agentConfig.id está faltando", agentConfig);
                    addToast("Erro: Agente não encontrado. Recarregue a página.", "error");
                    return;
                }
                console.log("Criando novo item para o agente:", agentConfig.id);
                const newItem = await createMatrixItem({ ...matrixForm, agentId: agentConfig.id, organizationId: organizationId || undefined });
                console.log("Item criado com sucesso:", newItem);
                setMatrix([...matrix, newItem]);
                addToast("Item criado com sucesso!", "success");
            }

            setShowMatrixModal(false);
            setEditingMatrix(null);
            setMatrixForm({
                title: "",
                category: "",
                description: "",
                response: "",
                priority: 1,
                personality: "",
                prohibitions: "",
                scheduling: "",
                data: "",
                writing: "",
                dataExtraction: "",
                matrixFlow: "",
            });
        } catch (err) {
            console.error("Erro no handleSaveMatrix:", err);
            addToast("Erro ao salvar item", "error");
        }
    };

    const handleDeleteMatrix = async (id: string) => {
        if (!confirm("Deseja realmente excluir este item?")) return;

        try {
            await deleteMatrixItem(id);
            setMatrix(matrix.filter((m) => m.id !== id));
            addToast("Item excluído com sucesso!", "success");
        } catch (err) {
            addToast("Erro ao excluir item", "error");
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
                    agentStateId: followupForm.agentStateId || undefined
                });
                setFollowups(
                    followups.map((f) =>
                        f.id === editingFollowup.id ? updated : f
                    )
                );
                addToast("Follow-up atualizado com sucesso!", "success");
            } else {
                if (!followupForm.agentStateId) {
                    addToast("Erro: É obrigatório vincular a um estado", "error");
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
                    agentStateId: followupForm.agentStateId
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
                agentStateId: null,
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


    const handleSaveReminder = async () => {
        if (!reminderForm.title.trim() || !reminderForm.message.trim()) {
            addToast("Preencha os campos obrigatórios", "error");
            return;
        }

        try {
            const recipientsArray = reminderForm.recipients
                .split(",")
                .map((r) => r.trim())
                .filter((r) => r);

            if (editingReminder) {
                await updateReminder(editingReminder.id, {
                    ...reminderForm,
                    recipients: recipientsArray,
                });
                setReminders(
                    reminders.map((r) =>
                        r.id === editingReminder.id
                            ? { ...r, ...reminderForm, recipients: recipientsArray }
                            : r
                    )
                );
                addToast("Lembrete atualizado com sucesso!", "success");
            } else {
                if (!agentConfig?.id) {
                    addToast("Erro: Agente não encontrado", "error");
                    return;
                }
                const newReminder = await createReminder({
                    ...reminderForm,
                    recipients: recipientsArray,
                    agentId: agentConfig.id,
                    organizationId: organizationId || undefined,
                });
                setReminders([...reminders, newReminder]);
                addToast("Lembrete criado com sucesso!", "success");
            }

            setShowReminderModal(false);
            setEditingReminder(null);
            setReminderForm({
                title: "",
                message: "",
                scheduledFor: "",
                recipients: "",
                isActive: true,
            });
        } catch (err) {
            addToast("Erro ao salvar lembrete", "error");
        }
    };

    const handleDeleteReminder = async (id: string) => {
        if (!confirm("Deseja realmente excluir este lembrete?")) return;

        try {
            await deleteReminder(id);
            setReminders(reminders.filter((r) => r.id !== id));
            addToast("Lembrete excluído com sucesso!", "success");
        } catch (err) {
            addToast("Erro ao excluir lembrete", "error");
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
                setStates(
                    states.map((s) =>
                        s.id === editingState.id ? { ...s, ...stateForm } : s
                    )
                );
                addToast("Estado atualizado com sucesso!", "success");
            } else {
                if (!agentConfig?.id) {
                    addToast("Erro: Agente não encontrado", "error");
                    return;
                }
                const newState = await createState({
                    ...stateForm,
                    agentId: agentConfig.id,
                    organizationId: organizationId || "", // Backend handles this if empty but better to pass
                });
                setStates([...states, newState]);
                addToast("Estado criado com sucesso!", "success");
            }

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
                dataCollections: [],
                dataKey: "",
                dataDescription: "",
                dataType: "",
                tools: "",
                prohibitions: "",
                order: 0,
                matrixItemId: null,
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
            <div className="min-h-screen bg-gray-50 p-6">
                <Loading />
            </div>
        );
    }

    if (error && !agentConfig) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <ErrorDisplay message={error} onRetry={loadData} />
            </div>
        );
    }

    // Quando não houver agente configurado
    if (!loading && !agentConfig) {
        return (
            <>
                <ToastContainer toasts={toasts} removeToast={removeToast} />
                <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                    <div className="max-w-2xl w-full text-center">
                        <Bot className="w-24 h-24 mx-auto text-indigo-400 mb-6" />
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            Nenhum agente configurado
                        </h1>
                        <p className="text-lg text-gray-600 mb-8">
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
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-colors font-medium"
                            >
                                <Upload className="w-5 h-5" />
                                Importar Configuração
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mt-6">
                            Dica: Use a importação para configurar rapidamente um agente completo com conhecimento, matriz e automações
                        </p>
                    </div>
                </div>
            </>
        );
    }

    const handleSaveAgentConfig = async () => {
        if (!agentConfig) return;
        try {
            await updateAgentConfig(agentConfig.id, agentConfig);
            addToast("Configurações do agente salvas com sucesso!", "success");
        } catch (err) {
            console.error("Erro ao salvar agente:", err);
            addToast("Erro ao salvar configurações", "error");
        }
    };

    const tabs = [
        { id: "agente" as Tab, label: "Agente", icon: Bot },
        { id: "conhecimento" as Tab, label: "Conhecimento", icon: FileText },
        { id: "matriz" as Tab, label: "Matriz", icon: Search },
        { id: "estados" as Tab, label: "Estados", icon: GitBranch },
        { id: "followups" as Tab, label: "Followups", icon: Clock },
        { id: "lembretes" as Tab, label: "Lembretes", icon: Bell },
        { id: "importacao" as Tab, label: "Importação", icon: Upload },
    ];

    return (
        <>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <Bot className="w-8 h-8 text-indigo-600" />
                                Configurar seu agente
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Gerencie o comportamento e conhecimento do seu agente de IA
                            </p>
                        </div>

                        {/* Status Toggle */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-700">Status:</span>
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
                    <div className="bg-white rounded-xl shadow-lg mb-6">
                        <div className="border-b border-gray-200 overflow-x-auto">
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
                                                    ? "border-indigo-500 text-indigo-600"
                                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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

                            {activeTab === "matriz" && (
                                <MatrixTab
                                    items={matrix}
                                    onCreate={() => {
                                        setEditingMatrix(null);
                                        setMatrixForm({
                                            title: "",
                                            category: "",
                                            description: "",
                                            response: "",
                                            priority: 1,
                                            personality: "",
                                            prohibitions: "",
                                            scheduling: "",
                                            data: "",
                                            writing: "",
                                            dataExtraction: "",
                                            matrixFlow: "",
                                        });
                                        setShowMatrixModal(true);
                                    }}
                                    onEdit={(item) => {
                                        setEditingMatrix(item);
                                        setMatrixForm({
                                            title: item.title,
                                            category: item.category,
                                            description: item.description,
                                            response: item.response,
                                            priority: item.priority,
                                            personality: item.personality || "",
                                            prohibitions: item.prohibitions || "",
                                            scheduling: item.scheduling || "",
                                            data: item.data || "",
                                            writing: item.writing || "",
                                            dataExtraction: item.dataExtraction || "",
                                            matrixFlow: item.matrixFlow || "",
                                        });
                                        setShowMatrixModal(true);
                                    }}
                                    onDelete={(id) => handleDeleteMatrix(String(id))}
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
                                            dataCollections: [],
                                            dataKey: "",
                                            dataDescription: "",
                                            dataType: "",
                                            tools: "",
                                            prohibitions: "",
                                            order: 0,
                                            matrixItemId: null,
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
                                            availableRoutes: item.availableRoutes || {
                                                rota_de_sucesso: [],
                                                rota_de_persistencia: [],
                                                rota_de_escape: []
                                            },
                                            dataCollections: item.dataCollections || [],
                                            dataKey: item.dataKey || "",
                                            dataDescription: item.dataDescription || "",
                                            dataType: item.dataType || "",
                                            tools: item.tools || "",
                                            prohibitions: item.prohibitions || "",
                                            order: item.order || 0,
                                            matrixItemId: item.matrixItemId || null,
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

                            {activeTab === "followups" && (
                                <FollowupsTab
                                    items={followups}
                                    onCreate={() => {
                                        setEditingFollowup(null);
                                        setFollowupForm({
                                            name: "",
                                            message: "",
                                            isActive: true,
                                            agentStateId: null,
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
                                            agentStateId: item.agentStateId || null,
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

                            {activeTab === "lembretes" && (
                                <RemindersTab
                                    items={reminders}
                                    onCreate={() => {
                                        setEditingReminder(null);
                                        setReminderForm({
                                            title: "",
                                            message: "",
                                            scheduledFor: "",
                                            recipients: "",
                                            isActive: true,
                                        });
                                        setShowReminderModal(true);
                                    }}
                                    onEdit={(item) => {
                                        setEditingReminder(item);
                                        setReminderForm({
                                            title: item.title,
                                            message: item.message,
                                            scheduledFor: item.scheduledFor,
                                            recipients: item.recipients.join(", "),
                                            isActive: item.isActive,
                                        });
                                        setShowReminderModal(true);
                                    }}
                                    onDelete={(id) => handleDeleteReminder(String(id))}
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Arquivo
                        </label>
                        <input
                            type="file"
                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                            accept=".pdf,.txt,.docx"
                            className="w-full"
                        />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                            onClick={() => setShowUploadModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
                matrixItems={matrix}
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
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

                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                            onClick={() => setShowEditKnowledgeModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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

            {/* Matrix Modal */}
            < Modal
                isOpen={showMatrixModal}
                onClose={() => setShowMatrixModal(false)}
                title={editingMatrix ? "Editar Item da Matriz" : "Criar Item da Matriz"}
                size="lg"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Título *
                            </label>
                            <input
                                type="text"
                                value={matrixForm.title}
                                onChange={(e) =>
                                    setMatrixForm({ ...matrixForm, title: e.target.value })
                                }
                                placeholder="Ex: OBJECAO_PRECO"
                                className="input-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Categoria *
                            </label>
                            <input
                                type="text"
                                value={matrixForm.category}
                                onChange={(e) =>
                                    setMatrixForm({ ...matrixForm, category: e.target.value })
                                }
                                placeholder="Ex: Objeção"
                                className="input-primary"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descrição *
                        </label>
                        <textarea
                            value={matrixForm.description}
                            onChange={(e) =>
                                setMatrixForm({ ...matrixForm, description: e.target.value })
                            }
                            placeholder="Descreva o cenário e como o agente deve agir..."
                            rows={4}
                            className="input-primary resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Resposta Sugerida *
                        </label>
                        <textarea
                            value={matrixForm.response}
                            onChange={(e) =>
                                setMatrixForm({ ...matrixForm, response: e.target.value })
                            }
                            placeholder="Exemplo de resposta que o agente pode usar..."
                            rows={3}
                            className="input-primary resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Personalidade *
                        </label>
                        <textarea
                            value={matrixForm.personality}
                            onChange={(e) =>
                                setMatrixForm({ ...matrixForm, personality: e.target.value })
                            }
                            placeholder="Defina a personalidade, missão, tom de voz..."
                            rows={4}
                            className="input-primary resize-none"
                        />
                    </div>



                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Horários de Agendamento *
                        </label>
                        <textarea
                            value={matrixForm.scheduling}
                            onChange={(e) =>
                                setMatrixForm({ ...matrixForm, scheduling: e.target.value })
                            }
                            placeholder="Regras e horários disponíveis..."
                            rows={3}
                            className="input-primary resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dados *
                        </label>
                        <textarea
                            value={matrixForm.data}
                            onChange={(e) =>
                                setMatrixForm({ ...matrixForm, data: e.target.value })
                            }
                            placeholder="Defina os dados a serem coletados..."
                            rows={3}
                            className="input-primary resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Escrita *
                        </label>
                        <textarea
                            value={matrixForm.writing}
                            onChange={(e) =>
                                setMatrixForm({ ...matrixForm, writing: e.target.value })
                            }
                            placeholder="Regras de formatação e estilo..."
                            rows={4}
                            className="input-primary resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Extração de Dados *
                        </label>
                        <textarea
                            value={matrixForm.dataExtraction}
                            onChange={(e) =>
                                setMatrixForm({ ...matrixForm, dataExtraction: e.target.value })
                            }
                            placeholder="Regras de extração NER..."
                            rows={4}
                            className="input-primary resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fluxo Matriz *
                        </label>
                        <textarea
                            value={matrixForm.matrixFlow}
                            onChange={(e) =>
                                setMatrixForm({ ...matrixForm, matrixFlow: e.target.value })
                            }
                            placeholder="Motor de decisão e lógica de roteamento..."
                            rows={4}
                            className="input-primary resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Prioridade
                        </label>
                        <select
                            value={matrixForm.priority}
                            onChange={(e) =>
                                setMatrixForm({
                                    ...matrixForm,
                                    priority: parseInt(e.target.value),
                                })
                            }
                            className="input-primary"
                        >
                            <option value={1}>Alta</option>
                            <option value={2}>Média</option>
                            <option value={3}>Baixa</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                            onClick={() => setShowMatrixModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSaveMatrix}
                            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {editingMatrix ? "Atualizar" : "Criar"}
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
                states={states}
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
                matrixItems={matrix}
            />

            {/* Reminder Modal */}
            < Modal
                isOpen={showReminderModal}
                onClose={() => setShowReminderModal(false)
                }
                title={editingReminder ? "Editar Lembrete" : "Criar Lembrete"}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Título *
                        </label>
                        <input
                            type="text"
                            value={reminderForm.title}
                            onChange={(e) =>
                                setReminderForm({ ...reminderForm, title: e.target.value })
                            }
                            placeholder="Ex: Reunião semanal"
                            className="input-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mensagem *
                        </label>
                        <textarea
                            value={reminderForm.message}
                            onChange={(e) =>
                                setReminderForm({ ...reminderForm, message: e.target.value })
                            }
                            placeholder="Mensagem do lembrete..."
                            rows={3}
                            className="input-primary resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Agendar para
                        </label>
                        <input
                            type="datetime-local"
                            value={reminderForm.scheduledFor}
                            onChange={(e) =>
                                setReminderForm({
                                    ...reminderForm,
                                    scheduledFor: e.target.value,
                                })
                            }
                            className="input-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Destinatários (separados por vírgula)
                        </label>
                        <input
                            type="text"
                            value={reminderForm.recipients}
                            onChange={(e) =>
                                setReminderForm({ ...reminderForm, recipients: e.target.value })
                            }
                            placeholder="email1@exemplo.com, email2@exemplo.com"
                            className="input-primary"
                        />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                            onClick={() => setShowReminderModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSaveReminder}
                            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {editingReminder ? "Atualizar" : "Criar"}
                        </button>
                    </div>
                </div>
            </Modal >
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
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome do Agente
                    </label>
                    <input
                        type="text"
                        value={config.name}
                        onChange={(e) => onUpdate({ ...config, name: e.target.value })}
                        className="input-primary"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tom de Voz
                    </label>
                    <select
                        value={config.tone}
                        onChange={(e) =>
                            onUpdate({
                                ...config,
                                tone: e.target.value as AgentConfig["tone"],
                            })
                        }
                        className="input-primary"
                    >
                        <option value="formal">Formal</option>
                        <option value="casual">Casual</option>
                        <option value="friendly">Amigável</option>
                        <option value="professional">Profissional</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição/Objetivo
                </label>
                <textarea
                    value={config.description}
                    onChange={(e) =>
                        onUpdate({ ...config, description: e.target.value })
                    }
                    rows={4}
                    className="input-primary resize-none"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                    onClick={onSave}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                >
                    <Save className="w-4 h-4" />
                    Salvar Alterações
                </button>
            </div>
        </div>
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
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                    Base de Conhecimento
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={onCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Criar
                    </button>
                    <button
                        onClick={onUpload}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                        <Upload className="w-4 h-4" />
                        Upload
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <FileText className="w-8 h-8 text-indigo-600" />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onEdit(item)}
                                    className="text-blue-600 hover:text-blue-700"
                                    title="Editar"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onDelete(item.id)}
                                    className="text-red-600 hover:text-red-700"
                                    title="Deletar"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>

                        {item.fileName && (
                            <p className="text-sm text-gray-600 mb-1">{item.fileName}</p>
                        )}

                        {item.fileSize && (
                            <p className="text-xs text-gray-500">{item.fileSize} bytes</p>
                        )}

                        <p className="text-xs text-gray-400 mt-2">
                            Criado em: {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                    </div>
                ))}
            </div>

            {items.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Nenhum documento na base de conhecimento</p>
                    <button
                        onClick={onUpload}
                        className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                        Fazer primeiro upload
                    </button>
                </div>
            )}
        </div>
    );
}

function MatrixTab({
    items,
    onCreate,
    onEdit,
    onDelete,
}: {
    items: MatrixItem[];
    onCreate: () => void;
    onEdit: (item: MatrixItem) => void;
    onDelete: (id: string) => void;
}) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Pesquisar..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>

                <button
                    onClick={onCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Criar Item Matriz
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <h4 className="font-bold text-gray-900 text-sm">
                                {item.title}
                            </h4>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onEdit(item)}
                                    className="text-indigo-600 hover:text-indigo-700"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onDelete(String(item.id))}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                            {item.description}
                        </p>

                        <button
                            onClick={() => onEdit(item)}
                            className="w-full px-3 py-1.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                            DETALHES
                        </button>
                    </div>
                ))}
            </div>

            {items.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Nenhum item na matriz</p>
                    <button
                        onClick={onCreate}
                        className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                        Criar primeiro item
                    </button>
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
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                    Follow-ups Automáticos
                </h3>
                <button
                    onClick={onCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Novo Follow-up
                </button>
            </div>

            <div className="space-y-3">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-semibold text-gray-900">{item.name}</h4>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${item.isActive
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-700"
                                            }`}
                                    >
                                        {item.isActive ? "Ativo" : "Inativo"}
                                    </span>
                                </div>


                                <p className="text-sm text-gray-500 italic">
                                    "{item.messageTemplate}"
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                    Delay: {item.delayMinutes} minutos
                                </p>
                                {item.agentState && (
                                    <p className="text-xs text-indigo-600 mt-1 font-medium">
                                        Estado: {item.agentState.name}
                                    </p>
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

            {items.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Nenhum follow-up configurado</p>
                    <button
                        onClick={onCreate}
                        className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                        Criar primeiro follow-up
                    </button>
                </div>
            )}
        </div>
    );
}

function RemindersTab({
    items,
    onCreate,
    onEdit,
    onDelete,
}: {
    items: Reminder[];
    onCreate: () => void;
    onEdit: (item: Reminder) => void;
    onDelete: (id: string) => void;
}) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Lembretes</h3>
                <button
                    onClick={onCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Novo Lembrete
                </button>
            </div>

            <div className="space-y-3">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <Bell className="w-5 h-5 text-indigo-600" />
                                    <h4 className="font-semibold text-gray-900">{item.title}</h4>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${item.isActive
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-700"
                                            }`}
                                    >
                                        {item.isActive ? "Ativo" : "Inativo"}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-600 mb-2">{item.message}</p>
                                <p className="text-xs text-gray-400">
                                    Agendado para:{" "}
                                    {new Date(item.scheduledFor).toLocaleString("pt-BR")}
                                </p>
                                <p className="text-xs text-gray-400">
                                    Destinatários: {item.recipients.join(", ")}
                                </p>
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

            {items.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Nenhum lembrete configurado</p>
                    <button
                        onClick={onCreate}
                        className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                        Criar primeiro lembrete
                    </button>
                </div>
            )}
        </div>
    );
}
