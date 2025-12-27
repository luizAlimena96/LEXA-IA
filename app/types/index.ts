// Centralized types for the application
// These types were previously in individual service files

// ═══════════════════════════════════════════════════════════════════
// WhatsApp Types
// ═══════════════════════════════════════════════════════════════════

export interface Chat {
    id: string;
    name: string;
    phone: string;
    avatar: string;
    lastMessage: string;
    time: string;
    status: 'online' | 'offline' | 'typing';
    tags: { id: string; name: string; color: string }[];
    aiEnabled: boolean;
    leadId?: string;
    online?: boolean;
    unread?: number;
}

export interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    time: string;
    sent: boolean;
    read: boolean;
    type?: 'TEXT' | 'AUDIO' | 'IMAGE' | 'DOCUMENT' | 'VIDEO';
    mediaType?: 'TEXT' | 'AUDIO' | 'IMAGE' | 'DOCUMENT' | 'VIDEO';
    mediaUrl?: string;
}

// ═══════════════════════════════════════════════════════════════════
// Quick Response Types
// ═══════════════════════════════════════════════════════════════════

export interface QuickResponse {
    id: string;
    name: string;
    title: string;
    content: string;
    type: 'TEXT' | 'AUDIO' | 'IMAGE';
    organizationId?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateQuickResponseData {
    name?: string;
    title: string;
    content: string;
    type: 'TEXT' | 'AUDIO' | 'IMAGE';
    organizationId?: string;
}

// ═══════════════════════════════════════════════════════════════════
// Dashboard Types
// ═══════════════════════════════════════════════════════════════════

export interface DashboardMetrics {
    totalLeads: number;
    activeConversations: number;
    messagesExchanged: number;
    appointmentsScheduled: number;
    leadsChange: number;
    conversationsChange: number;
    messagesChange: number;
    appointmentsChange: number;
    conversionRate: number;
    leadsByStatus: {
        NEW: number;
        QUALIFIED: number;
        WON: number;
        LOST: number;
        [key: string]: number;
    };
    crmFunnel?: {
        id: string;
        name: string;
        value: number;
        order: number;
        color: string;
    }[];
    statesFunnel?: {
        name: string;
        value: number;
    }[];
}

export interface PerformanceMetrics {
    responseTime: number;
    satisfactionRate: number;
    conversionRate: number;
    messagesPerConversation: number;
}

export interface Activity {
    id: string;
    type: 'new_lead' | 'message' | 'appointment' | 'conversion';
    title: string;
    description: string;
    time: string;
}

// ═══════════════════════════════════════════════════════════════════
// Report Types
// ═══════════════════════════════════════════════════════════════════

export interface Report {
    id: string;
    name: string;
    title?: string;
    type: string;
    period?: string;
    status: 'pending' | 'completed' | 'failed' | 'processing';
    createdAt: string;
    organizationId?: string;
    downloads?: number;
}

export interface ReportMetrics {
    totalReports: number;
    completedReports: number;
    pendingReports: number;
    relatoriosGerados?: number;
    totalDownloads?: number;
    tempoMedioGeracao?: string;
    trends?: {
        gerados: number;
        downloads: number;
        tempo: number;
    };
}

// ═══════════════════════════════════════════════════════════════════
// Feedback Types
// ═══════════════════════════════════════════════════════════════════

export interface Feedback {
    id: string;
    comment: string;
    customerName: string;
    phone?: string;
    rating?: number;
    status: 'PENDING' | 'RESOLVED' | 'IN_PROGRESS';
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    conversationId?: string;
    organizationId?: string;
    createdAt: string;
    updatedAt?: string;
    date?: string;
    currentState?: string;
    aiThinking?: string;
}

export interface FeedbackMetrics {
    total: number;
    pending: number;
    resolved: number;
    averageRating: number;
    totalFeedbacks: number;
    pendingCount: number;
    resolvedCount: number;
}

export interface DebugLogEntry {
    id: string;
    phone: string;
    clientMessage: string;
    aiResponse: string;
    currentState?: string;
    aiThinking?: string;
    createdAt: string;
}

export interface FeedbackResponse {
    id: string;
    content: string;
    message?: string;
    createdAt: string;
    author?: string;
    userName?: string;
}

// ═══════════════════════════════════════════════════════════════════
// Calendar Types
// ═══════════════════════════════════════════════════════════════════

export interface Event {
    id: string;
    title: string;
    description?: string;
    start: string;
    end: string;
    allDay?: boolean;
    leadId?: string;
    leadName?: string;
    leadPhone?: string;
    status?: 'confirmed' | 'pending' | 'cancelled';
    googleEventId?: string;
    meetingLink?: string;
    // Extended properties for calendar page compatibility
    date?: Date;
    time?: string;
    duration?: string;
    type?: 'meeting' | 'call' | 'other';
    attendees?: number;
    location?: string;
    color?: string;
}

export interface BlockedSlot {
    id: string;
    start: string;
    end: string;
    reason?: string;
    agentId?: string;
    allDay?: boolean;
    startTime?: Date;
    endTime?: Date;
    title?: string;
    organizationId?: string;
}

// ═══════════════════════════════════════════════════════════════════
// Agent Types
// ═══════════════════════════════════════════════════════════════════

export interface AgentConfig {
    id: string;
    name: string;
    description?: string;
    personality?: string;
    tone?: string;
    systemPrompt?: string;
    organizationId: string;
    messageBufferEnabled?: boolean;
    messageBufferDelayMs?: number;
    audioResponseEnabled?: boolean;
    useEmojis?: boolean;
    openaiModel?: string;
    workingHours?: Record<string, Array<{ start: string; end: string }>>;
    createdAt?: string;
    updatedAt?: string;
    language?: string;
    isActive?: boolean;
    writingStyle?: string;
    prohibitions?: string;
    aiControlEnabled?: boolean;
    aiDisableEmoji?: string;
    aiEnableEmoji?: string;
}

export interface KnowledgeItem {
    id: string;
    title: string;
    content: string;
    type?: 'TEXT' | 'DOCUMENT' | 'FAQ';
    agentId?: string;
    organizationId?: string;
    createdAt?: string;
    fileName?: string;
    fileSize?: number;
}

export interface AgentFollowUp {
    id: string;
    name: string;
    message: string;
    delayMinutes: number;
    triggerState?: string;
    enabled: boolean;
    agentId: string;
    messageTemplate?: string;
    isActive?: boolean;
    crmStageId?: string;
    crmStage?: any;
    triggerMode?: 'TIMER' | 'SCHEDULED' | 'MANUAL';
    scheduledTime?: string;
    mediaItems?: any[];
    businessHoursEnabled?: boolean;
    businessHoursStart?: string;
    businessHoursEnd?: string;
    agentState?: AgentState;
    aiDecisionEnabled?: boolean;
    aiDecisionPrompt?: string;
}

export interface AgentState {
    id: string;
    name: string;
    description?: string;
    order: number;
    isInitial?: boolean;
    isFinal?: boolean;
    systemPrompt?: string;
    expectedResponses?: string[];
    agentId: string;
    missionPrompt?: string;
    availableRoutes?: AvailableRoutes;
    dataKey?: string | null;
    dataDescription?: string | null;
    dataType?: string | null;
    tools?: string;
    prohibitions?: string;
    mediaId?: string | null;
    mediaTiming?: string | null;
    responseType?: string | null;
    crmStatus?: string | null;
}

export interface Route {
    id: string;
    sourceState: string;
    targetState: string;
    condition?: string;
    agentId: string;
}

export interface AvailableRoutes {
    states?: AgentState[];
    routes?: Route[];
    rota_de_sucesso?: any[];
    rota_de_persistencia?: any[];
    rota_de_escape?: any[];
}

// ═══════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════

export async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
