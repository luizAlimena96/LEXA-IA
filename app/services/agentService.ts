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
    workingHours?: Record<string, { start: string; end: string } | null>;
    prohibitions?: string;
    writingStyle?: string;
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

export interface MatrixItem {
    id: string;
    title: string;
    category: string;
    description: string;
    response: string;
    priority: number;

    // Agent configuration fields
    personality: string;
    prohibitions: string;
    scheduling: string;
    data: string;
    writing: string;
    dataExtraction: string;
    matrixFlow: string;

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

export interface AgentState {
    id: string;
    name: string;
    missionPrompt: string;
    availableRoutes: any;
    dataKey?: string | null;
    dataDescription?: string | null;
    dataType?: string | null;
    dataCollections?: Array<{
        key: string;
        type: string;
        description: string;
    }> | null;
    mediaId?: string | null;
    tools?: string | null;
    prohibitions?: string | null;
    crmStatus?: string | null;
    order: number;
    createdAt: Date;
    updatedAt: Date;
    agentId: string;
    organizationId: string;
    matrixItemId?: string | null;
}

export interface AgentFollowUp {
    id: string;
    name: string;
    agentId: string;
    agentStateId?: string;
    matrixItemId?: string;
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
    matrixItem?: { title: string };
}

export interface AgentNotification {
    id: string;
    agentId: string;
    agentStateId?: string;
    matrixItemId?: string;
    leadMessage?: string;
    teamMessage?: string;
    teamPhones?: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    agentState?: { name: string };
    matrixItem?: { title: string };
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

export async function uploadKnowledge(file: File, title: string, agentId?: string): Promise<KnowledgeItem> {
    const content = await file.text().catch(() => `Arquivo: ${file.name}`);

    return await createKnowledge({
        title,
        content,
        type: 'DOCUMENT',
        fileName: file.name,
        fileSize: file.size,
        agentId: agentId || '',
    });
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

// ==================== MATRIX ====================

export async function getMatrix(agentId?: string, organizationId?: string): Promise<MatrixItem[]> {
    try {
        const params = new URLSearchParams();
        if (agentId) params.append('agentId', agentId);
        if (organizationId) params.append('organizationId', organizationId);

        const url = `${API_BASE}/matrix${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url, { credentials: 'include' });
        return await handleResponse(response);
    } catch (error) {
        console.error('Error fetching matrix:', error);
        return [];
    }
}

export async function createMatrixItem(item: Omit<MatrixItem, 'id'>): Promise<MatrixItem> {
    const response = await fetch(`${API_BASE}/matrix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(item),
    });
    return await handleResponse(response);
}

export async function updateMatrixItem(id: string, item: Partial<MatrixItem>): Promise<MatrixItem> {
    const response = await fetch(`${API_BASE}/matrix?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(item),
    });
    return await handleResponse(response);
}

export async function deleteMatrixItem(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/matrix?id=${id}`, {
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
