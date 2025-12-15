// ============================================
// Clientes Module - Centralized Interfaces
// ============================================

// Organization
export interface Organization {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    createdAt: Date;
    updatedAt: Date;
    openaiApiKey?: string;
    elevenLabsApiKey?: string;
    zapsignApiKey?: string;
    zapsignEnabled?: boolean;
    crmType?: string;
    crmApiKey?: string;
    crmApiUrl?: string;
}

// Knowledge
export interface KnowledgeItem {
    id: string;
    title: string;
    content: string;
    type: 'DOCUMENT' | 'FAQ' | 'TEXT';
    organizationId: string;
    agentId?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Followup
export interface Followup {
    id: string;
    name: string;
    messageTemplate: string;
    delayMinutes: number;
    isActive: boolean;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface FollowupFormData {
    name: string;
    messageTemplate: string;
    delayMinutes: number;
    isActive: boolean;
}

// CRM Sync
export interface CRMSyncConfig {
    id: string;
    organizationId: string;
    crmType: string;
    apiKey: string;
    apiUrl?: string;
    isActive: boolean;
    syncInterval?: number;
    lastSyncAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface CRMSyncFormData {
    crmType: string;
    apiKey: string;
    apiUrl?: string;
    isActive: boolean;
    syncInterval?: number;
}

// CRM Webhook
export interface CRMWebhook {
    id: string;
    organizationId: string;
    event: string;
    url: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CRMWebhookFormData {
    event: string;
    url: string;
    isActive: boolean;
}

export interface CRMLog {
    id: string;
    organizationId: string;
    event: string;
    payload: any;
    response?: any;
    status: 'success' | 'error';
    createdAt: Date;
}

// ZapSign
export interface ZapSignConfig {
    apiKey: string;
    enabled: boolean;
}

export interface ZapSignTestData {
    apiKey: string;
}

// Scheduling Rule
export interface SchedulingRule {
    id: string;
    agentId: string;
    name: string;
    dayOfWeek: number[];
    startTime: string;
    endTime: string;
    duration: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface SchedulingRuleFormData {
    name: string;
    dayOfWeek: number[];
    startTime: string;
    endTime: string;
    duration: number;
    isActive: boolean;
}

// Google Auth
export interface GoogleAuthResponse {
    authUrl: string;
}

export interface GoogleDisconnectData {
    agentId: string;
}

// API Keys
export interface APIKeysFormData {
    openaiApiKey?: string;
    elevenLabsApiKey?: string;
}

// External API Responses
export interface OpenAIModel {
    id: string;
    object: string;
    created: number;
    owned_by: string;
}

export interface ElevenLabsVoice {
    voice_id: string;
    name: string;
    category: string;
}
