// ============================================
// Core Agent Types
// ============================================

export interface MediaItem {
    id: string;
    url: string;
    type: 'image' | 'video' | 'document' | 'audio';
    caption?: string;
    fileName?: string;
}

export interface AgentState {
    id: string;
    name: string;
    missionPrompt?: string;
    availableRoutes?: AvailableRoutes;
    dataKey?: string | null;
    dataType?: string | null;
    dataDescription?: string | null;
    order: number;
    mediaId?: string | null;
    mediaTiming?: string | null;
    responseType?: string | null;
    prohibitions?: string | null;
    tools?: string | null;
    crmStatus?: string | null;
    mediaItems?: MediaItem[];
}

export interface AvailableRoutes {
    rota_de_sucesso?: Array<{
        estado: string;
        descricao: string;
    }>;
    rota_de_persistencia?: Array<{
        estado: string;
        descricao: string;
    }>;
    rota_de_escape?: Array<{
        estado: string;
        descricao: string;
    }>;
}

// ============================================
// CRM & ZapSign Interfaces
// ============================================

export interface CRMStage {
    id: string;
    name: string;
    description?: string | null;
    color: string;
    order: number;
    states?: Array<{
        id: string;
        name: string;
        order: number;
    }>;
}

export interface State {
    id: string;
    name: string;
    order: number;
    crmStageId?: string | null;
}

export interface StageFormData {
    name: string;
    description: string;
    color: string;
    stateIds: string[];
}

export interface FieldMapping {
    id: string;
    templateField: string;
    leadField: string;
    label: string;
}

// ============================================
// Auto Scheduling Interfaces
// ============================================

export interface AutoSchedulingConfig {
    id: string;
    crmStageId: string;
    crmStage?: {
        name: string;
        color: string;
    };
    duration: number;
    minAdvanceHours: number;
    preferredTime?: string | null;
    daysOfWeek: string[];
    messageTemplate: string;
    autoConfirm: boolean;
    moveToStageId?: string | null;
    isActive: boolean;
    sendConfirmation: boolean;
    confirmationTemplate?: string | null;
    notifyTeam: boolean;
    teamPhones: string[];
    cancellationTemplate?: string | null;
    reschedulingTemplate?: string | null;
    reminderWindowStart?: string;
    reminderWindowEnd?: string;
    reminders?: AppointmentReminderConfig[];
}

export interface AppointmentReminderConfig {
    id?: string;
    minutesBefore: number;
    sendToLead: boolean;
    sendToTeam: boolean;
    additionalPhones: string[];
    leadMessageTemplate: string;
    teamMessageTemplate?: string;
    isActive: boolean;

    crmStage?: {
        id: string;
        name: string;
        color: string;
    };
    moveToStage?: {
        id: string;
        name: string;
        color: string;
    } | null;
}

export interface ReminderConfig {
    id: string;
    minutesBefore: number;
    sendToLead: boolean;
    sendToTeam: boolean;
    leadMessageTemplate: string;
    teamMessageTemplate?: string | null;
    isActive: boolean;
}

export interface AutoSchedulingFormData {
    crmStageId: string;
    duration: number;
    minAdvanceHours: number;
    preferredTime: string;
    daysOfWeek: string[];
    messageTemplate: string;
    autoConfirm: boolean;
    moveToStageId: string;
    sendConfirmation: boolean;
    confirmationTemplate: string;
    notifyTeam: boolean;
    teamPhones: string;
    cancellationTemplate: string;
    reschedulingTemplate: string;
    reminderWindowStart: string;
    reminderWindowEnd: string;
    reminders: AppointmentReminderConfig[];
}

// ============================================
// FSM Prompts Interfaces
// ============================================

export interface Prompts {
    dataExtractor: string | null;
    stateDecider: string | null;
    validator: string | null;
}

// ============================================
// Component Props Interfaces
// ============================================

export interface ZapSignConfigEditorProps {
    agentId: string;
}

export interface WritingStyleEditorProps {
    value: string | null;
    onChange: (value: string | null) => void;
}

export interface StatesTabProps {
    items: AgentState[];
    onCreate: () => void;
    onEdit: (item: AgentState) => void;
    onDelete: (id: string) => void;
}

export interface StateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    editing: AgentState | null;
    form: {
        name: string;
        missionPrompt: string;
        availableRoutes: any;
        dataKey?: string | null;
        dataType?: string | null;
        dataDescription?: string | null;
        order: number;
        mediaId?: string | null;
        mediaTiming?: string | null;
        responseType?: string | null;
        prohibitions?: string | null;
        tools?: string | null;
        crmStatus?: string | null;
        mediaItems?: MediaItem[];
    };
    onFormChange: (form: any) => void;
    availableStates: string[];
}

export interface RouteEditorProps {
    routes: AvailableRoutes;
    onChange: (routes: AvailableRoutes) => void;
    availableStates: string[];
    customStates?: string[];
    onCustomStatesChange?: (states: string[]) => void;
}

export interface PersonalityEditorProps {
    value: string | null;
    onChange: (value: string | null) => void;
}

export interface ProhibitionsEditorProps {
    value: string | null;
    onChange: (value: string | null) => void;
}

export interface DataExtractionEditorProps {
    agentId: string;
}

export interface FollowUpDeciderEditorProps {
    agentId: string;
}

export interface ImportTabProps {
    organizationId: string;
    onImportComplete: () => void;
}

export interface FSMPromptsEditorProps {
    agentId: string;
}

export interface CRMStagesEditorProps {
    agentId: string;
    organizationId?: string;
}

export interface AutoSchedulingEditorProps {
    agentId: string;
}

// ============================================
// Modal Props Interfaces
// ============================================

export interface ReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    isEditing: boolean;
    form: {
        title: string;
        message: string;
        scheduledFor: string;
        recipients: string;
        isActive: boolean;
    };
    onFormChange: (form: any) => void;
}

export interface KnowledgeUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: () => void;
    uploadTitle: string;
    onTitleChange: (title: string) => void;
    uploadFile: File | null;
    onFileChange: (file: File | null) => void;
}

export interface KnowledgeEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    isEditing: boolean;
    form: {
        title: string;
        content: string;
        type: "DOCUMENT" | "FAQ" | "TEXT";
    };
    onFormChange: (form: any) => void;
}

export interface FollowupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    isEditing: boolean;
    form: {
        name: string;
        message: string;
        messageTemplate?: string;
        isActive: boolean;
        crmStageId?: string | null;
        triggerMode?: string;
        delayMinutes?: number;
        scheduledTime?: string;
        mediaUrls?: string[];
        videoUrl?: string;
        businessHoursEnabled?: boolean;
        businessHoursStart?: string;
        businessHoursEnd?: string;
        aiDecisionEnabled?: boolean;
        aiDecisionPrompt?: string;
    };
    onFormChange: (form: any) => void;
    agentId: string;
}
