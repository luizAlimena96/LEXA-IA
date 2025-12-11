// Agent Service - Gerenciamento do Agente de IA

// ==================== INTERFACES ====================

export interface AgentConfig {
    id: string;
    name: string;
    description: string;
    tone: 'FORMAL' | 'CASUAL' | 'FRIENDLY' | 'PROFESSIONAL';
    language: string;
    avatar?: string;
    isActive: boolean;
    organizationId?: string;
    organization?: {
        id: string;
        name: string;
        slug: string;
    };
    workingHours?: Record<string, Array<{ start: string; end: string }>>;
    prohibitions?: string;
    writingStyle?: string;
    personality?: string;
    dataCollectionInstructions?: string;
    initialStateId?: string;
    responseDelay?: number;
    notificationPhones?: string[];
    followupDecisionPrompt?: string;
    followupHours?: Record<string, { start: string; end: string } | null>;

    // Scheduling
    meetingDuration?: number;
    minAdvanceHours?: number;
    bufferTime?: number;
    allowDynamicDuration?: boolean;
    minMeetingDuration?: number;
    maxMeetingDuration?: number;
    useCustomTimeWindows?: boolean;
    customTimeWindows?: Record<string, { start: string; end: string }[]>;

    // Message Buffer
    messageBufferEnabled?: boolean;
    messageBufferDelayMs?: number;
    messageBufferMaxSize?: number;

    // Audio Response
    audioResponseEnabled?: boolean;
}

export interface KnowledgeItem {
    id: string;
    title: string;
    content: string;
    type: 'DOCUMENT' | 'FAQ' | 'TEXT';
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    createdAt: string;
    agentId: string;
    organizationId?: string;
}

export interface Followup {
    id: string;
    name: string;
    condition: string;
    message: string;
    delayHours: number;
    delayMinutes?: number;
    isActive: boolean;
    agentId: string;
    organizationId?: string;

    respectBusinessHours?: boolean;
    matrixStageId?: string;
    mediaType?: string;
    specificTimeEnabled?: boolean;
    specificHour?: number;
    specificMinute?: number;
}

/**
 * Representa uma rota de transição entre estados no FSM
 */
export interface Route {
    /** Nome do estado destino */
    estado: string;
    /** Descrição da condição que ativa esta rota */
    descricao: string;
}

/**
 * Estrutura de rotas disponíveis para transição de estados
 * Cada estado deve ter pelo menos uma rota de sucesso definida
 */
export interface AvailableRoutes {
    /** Rotas quando a missão do estado é cumprida com sucesso */
    rota_de_sucesso: Route[];
    /** Rotas quando precisa insistir ou coletar mais informações */
    rota_de_persistencia: Route[];
    /** Rotas quando precisa sair, escalar ou transferir para humano */
    rota_de_escape: Route[];
}

/**
 * Representa um item de coleta de dados
 */
export interface DataCollection {
    /** Chave única para identificar o dado (ex: "email", "telefone") */
    key: string;
    /** Tipo do dado (string, email, phone, number, date, boolean) */
    type: string;
    /** Descrição do que deve ser coletado */
    description: string;
}

/**
 * Representa um estado no FSM (Finite State Machine) do agente
 */
export interface AgentState {
    id: string;
    name: string;
    /** Prompt que define a missão/objetivo deste estado */
    missionPrompt: string;
    /** Rotas de transição disponíveis a partir deste estado */
    availableRoutes: AvailableRoutes;
    dataKey?: string | null;
    dataDescription?: string | null;
    dataType?: string | null;
    /** Múltiplas coleções de dados que este estado deve coletar */
    dataCollections?: DataCollection[] | null;
    mediaId?: string | null;
    mediaTiming?: string | null;
    responseType?: string | null;
    tools?: string | null;
    prohibitions?: string | null;
    crmStatus?: string | null;
    order: number;
    createdAt: Date;
    updatedAt: Date;
    agentId: string;
    organizationId: string;
}

export interface AgentFollowUp {
    id: string;
    name: string;
    agentId: string;
    agentStateId?: string;
    crmStageId?: string;
    delayMinutes: number;
    messageTemplate: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;

    // Trigger configuration
    triggerMode?: string;
    scheduledTime?: string;

    // Media attachments
    mediaUrls?: string[];
    videoUrl?: string;

    // Business hours configuration
    businessHoursEnabled?: boolean;
    businessHoursStart?: string;
    businessHoursEnd?: string;

    // Relations for UI
    agentState?: { name: string };
    crmStage?: { id: string; name: string; color: string };
}

export interface AgentNotification {
    id: string;
    agentId: string;
    agentStateId?: string;
    leadMessage?: string;
    teamMessage?: string;
    teamPhones?: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    agentState?: { name: string };
}

export interface Reminder {
    id: string;
    title: string;
    message: string;
    scheduledFor: string;
    recipients: string[];
    isActive: boolean;
    agentId: string;
    organizationId?: string;

    mediaType?: string;
    advanceTime?: number;
}

// ==================== API FUNCTIONS ====================

const API_BASE = '/api';

// Helper para lidar com erros de autenticação
async function handleResponse(response: Response) {
    if (response.status === 401) {
        // Redirecionar para login se não autenticado
        window.location.href = '/login';
        throw new Error('Não autenticado');
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(error.error || 'Erro na requisição');
    }

    return response.json();
}

// ==================== AGENT CONFIG ====================

export async function getAgentConfig(organizationId?: string): Promise<AgentConfig[]> {
    try {
        const url = organizationId
            ? `${API_BASE}/agents?organizationId=${organizationId}`
            : `${API_BASE}/agents`;

        const response = await fetch(url, {
            credentials: 'include', // Incluir cookies de sessão
        });
        return await handleResponse(response);
    } catch (error) {
        console.error('Error fetching agents:', error);
        return [];
    }
}

export async function updateAgentConfig(id: string, config: Partial<AgentConfig>): Promise<AgentConfig> {
    const response = await fetch(`${API_BASE}/agents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config),
    });
    return await handleResponse(response);
}

export async function createAgent(config: Omit<AgentConfig, 'id'>): Promise<AgentConfig> {
    const response = await fetch(`${API_BASE}/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config),
    });
    return await handleResponse(response);
}

export async function toggleAgentStatus(agentId?: string): Promise<boolean> {
    // Se não tiver agentId, busca o primeiro agente
    if (!agentId) {
        const agents = await getAgentConfig();
        if (agents.length === 0) {
            throw new Error('Nenhum agente encontrado');
        }
        agentId = agents[0].id;
    }

    // Busca o agente atual
    const agents = await getAgentConfig();
    const agent = agents.find(a => a.id === agentId);

    if (!agent) {
        throw new Error('Agente não encontrado');
    }

    // Inverte o status
    const newStatus = !agent.isActive;

    await updateAgentConfig(agentId, { isActive: newStatus });

    return newStatus;
}

// ==================== KNOWLEDGE ====================

export async function getKnowledge(agentId?: string, organizationId?: string): Promise<KnowledgeItem[]> {
    try {
        const params = new URLSearchParams();
        if (agentId) params.append('agentId', agentId);
        if (organizationId) params.append('organizationId', organizationId);

        const url = `${API_BASE}/knowledge${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url, { credentials: 'include' });
        return await handleResponse(response);
    } catch (error) {
        console.error('Error fetching knowledge:', error);
        return [];
    }
}

export async function createKnowledge(item: Omit<KnowledgeItem, 'id' | 'createdAt'>): Promise<KnowledgeItem> {
    const response = await fetch(`${API_BASE}/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(item),
    });
    return await handleResponse(response);
}

export async function uploadKnowledge(
    file: File,
    title: string,
    agentId: string,
    organizationId?: string
): Promise<KnowledgeItem> {
    // Validate required fields
    if (!title || !title.trim()) {
        throw new Error('Título é obrigatório');
    }

    if (!agentId) {
        throw new Error('AgentId é obrigatório para upload de conhecimento');
    }

    // Validate file type
    const validExtensions = ['pdf', 'txt', 'doc', 'docx'];
    const extension = file.name.toLowerCase().split('.').pop();
    if (!extension || !validExtensions.includes(extension)) {
        throw new Error('Tipo de arquivo não suportado. Use PDF, TXT ou DOC/DOCX');
    }

    // Use FormData for file upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title.trim());
    formData.append('agentId', agentId);
    if (organizationId) {
        formData.append('organizationId', organizationId);
    }

    const response = await fetch(`${API_BASE}/knowledge/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
    });

    const result = await handleResponse(response);

    // Return the knowledge item from the response
    return result.knowledge;
}

export async function updateKnowledge(id: string, data: Partial<KnowledgeItem>): Promise<KnowledgeItem> {
    const response = await fetch(`${API_BASE}/knowledge?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });
    return await handleResponse(response);
}

export async function deleteKnowledge(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/knowledge?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    await handleResponse(response);
}

// ==================== STATES (FSM) ====================

export async function getStates(agentId?: string, organizationId?: string): Promise<AgentState[]> {
    try {
        const params = new URLSearchParams();
        if (agentId) params.append('agentId', agentId);
        if (organizationId) params.append('organizationId', organizationId);

        const url = `${API_BASE}/states${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url, { credentials: 'include' });
        return await handleResponse(response);
    } catch (error) {
        console.error('Error fetching states:', error);
        return [];
    }
}

export async function createState(item: Omit<AgentState, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgentState> {
    const response = await fetch(`${API_BASE}/states`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(item),
    });
    return await handleResponse(response);
}

export async function updateState(id: string, item: Partial<AgentState>): Promise<AgentState> {
    const response = await fetch(`${API_BASE}/states?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(item),
    });
    return await handleResponse(response);
}

export async function deleteState(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/states?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    await handleResponse(response);
}

// ==================== FOLLOWUPS ====================

export async function getFollowups(agentId?: string, organizationId?: string): Promise<Followup[]> {
    try {
        const params = new URLSearchParams();
        if (agentId) params.append('agentId', agentId);
        if (organizationId) params.append('organizationId', organizationId);

        const url = `${API_BASE}/followups${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url, { credentials: 'include' });
        return await handleResponse(response);
    } catch (error) {
        console.error('Error fetching followups:', error);
        return [];
    }
}

export async function createFollowup(item: Omit<Followup, 'id'>): Promise<Followup> {
    const response = await fetch(`${API_BASE}/followups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(item),
    });
    return await handleResponse(response);
}

export async function updateFollowup(id: string, item: Partial<Followup>): Promise<Followup> {
    const response = await fetch(`${API_BASE}/followups?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(item),
    });
    return await handleResponse(response);
}

export async function deleteFollowup(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/followups?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    await handleResponse(response);
}

// ==================== REMINDERS ====================

export async function getReminders(agentId?: string, organizationId?: string): Promise<Reminder[]> {
    try {
        const params = new URLSearchParams();
        if (agentId) params.append('agentId', agentId);
        if (organizationId) params.append('organizationId', organizationId);

        const url = `${API_BASE}/reminders${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url, { credentials: 'include' });
        return await handleResponse(response);
    } catch (error) {
        console.error('Error fetching reminders:', error);
        return [];
    }
}

export async function createReminder(item: Omit<Reminder, 'id'>): Promise<Reminder> {
    const response = await fetch(`${API_BASE}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(item),
    });
    return await handleResponse(response);
}

export async function updateReminder(id: string, item: Partial<Reminder>): Promise<Reminder> {
    const response = await fetch(`${API_BASE}/reminders?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(item),
    });
    return await handleResponse(response);
}

export async function deleteReminder(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/reminders?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    await handleResponse(response);
}

// ==================== AGENT FOLLOWUPS (NEW) ====================

export async function getAgentFollowUps(agentId: string): Promise<AgentFollowUp[]> {
    try {
        const response = await fetch(`${API_BASE}/agents/${agentId}/follow-ups`, { credentials: 'include' });
        return await handleResponse(response);
    } catch (error) {
        console.error('Error fetching agent followups:', error);
        return [];
    }
}

export async function createAgentFollowUp(agentId: string, item: Omit<AgentFollowUp, 'id' | 'createdAt' | 'updatedAt' | 'agentId'>): Promise<AgentFollowUp> {
    const response = await fetch(`${API_BASE}/agents/${agentId}/follow-ups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(item),
    });
    return await handleResponse(response);
}

export async function updateAgentFollowUp(agentId: string, followUpId: string, item: Partial<AgentFollowUp>): Promise<AgentFollowUp> {
    const response = await fetch(`${API_BASE}/agents/${agentId}/follow-ups/${followUpId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(item),
    });
    return await handleResponse(response);
}

export async function deleteAgentFollowUp(agentId: string, followUpId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/agents/${agentId}/follow-ups/${followUpId}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    await handleResponse(response);
}

// ==================== AGENT NOTIFICATIONS ====================

export async function getAgentNotifications(agentId: string): Promise<AgentNotification[]> {
    try {
        const response = await fetch(`${API_BASE}/agents/${agentId}/notifications`, { credentials: 'include' });
        return await handleResponse(response);
    } catch (error) {
        console.error('Error fetching agent notifications:', error);
        return [];
    }
}

export async function createAgentNotification(agentId: string, item: Omit<AgentNotification, 'id' | 'createdAt' | 'updatedAt' | 'agentId'>): Promise<AgentNotification> {
    const response = await fetch(`${API_BASE}/agents/${agentId}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(item),
    });
    return await handleResponse(response);
}

export async function updateAgentNotification(agentId: string, notificationId: string, item: Partial<AgentNotification>): Promise<AgentNotification> {
    const response = await fetch(`${API_BASE}/agents/${agentId}/notifications/${notificationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(item),
    });
    return await handleResponse(response);
}

export async function deleteAgentNotification(agentId: string, notificationId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/agents/${agentId}/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    await handleResponse(response);
}
