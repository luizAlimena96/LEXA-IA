// ============================================
// CRM Configuration Interfaces
// ============================================

export interface CrmConfig {
    id: string;
    name: string;
    crmType: string;
    baseUrl: string;
    authType: string;
    apiKey: string;
    isActive: boolean;
    organizationId: string;
}

export interface CRMTemplate {
    id: string;
    name: string;
    description?: string;
    crmType: string;
    baseUrl: string;
    authType: string;
    automations: any;
    isPublic: boolean;
    organizationId?: string;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// Field Mapping Interfaces
// ============================================

export interface FieldMapping {
    lexaField: string;
    crmField: string;
    transform?: string;
}

// ============================================
// API Testing Interfaces
// ============================================

export interface CRMEndpoint {
    name: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    description: string;
}

// ============================================
// Workflow & Automation Interfaces
// ============================================

export type TriggerType =
    | 'STATE_CHANGE'      // When FSM state changes
    | 'STAGE_CHANGE'      // When CRM stage changes
    | 'DATAKEY_MATCH'     // When extracted data matches condition
    | 'APPOINTMENT_CREATED' // When appointment is created
    | 'INACTIVITY';       // When lead is inactive for X days

export type ActionType =
    | 'HTTP_REQUEST'      // Make HTTP request
    | 'SEND_MESSAGE'      // Send WhatsApp message
    | 'ADD_TAG'           // Add tag to lead
    | 'REMOVE_TAG'        // Remove tag from lead
    | 'MOVE_STAGE'        // Move lead to CRM stage
    | 'WEBHOOK';          // External webhook (Zapier, etc)

export interface TriggerCondition {
    dataKey?: string;     // For DATAKEY_MATCH: the key to check
    operator?: 'equals' | 'contains' | 'not_equals' | 'exists' | 'not_exists';
    value?: string;       // The value to compare
    inactivityDays?: number; // For INACTIVITY trigger
    stateId?: string;     // For STATE_CHANGE trigger
    stageId?: string;     // For STAGE_CHANGE trigger
}

export interface WorkflowAction {
    id: string;
    order: number;
    name: string;
    actionType: ActionType;

    // For HTTP_REQUEST
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url?: string;
    bodyTemplate?: string;
    headers?: Record<string, string>;
    saveResponseAs?: string;
    continueOnError?: boolean;

    // For SEND_MESSAGE
    messageTemplate?: string;
    phoneNumbers?: string;

    // For ADD_TAG / REMOVE_TAG
    tagId?: string;
    tagName?: string;

    // For MOVE_STAGE
    targetStageId?: string;

    // For WEBHOOK
    webhookUrl?: string;
    webhookPayloadTemplate?: string;
}

export interface Automation {
    id: string;
    name: string;
    description?: string;
    crmConfigId?: string;
    crmStageId?: string;
    agentStateId?: string;
    triggerType: TriggerType;
    triggerCondition?: TriggerCondition;
    delayMinutes?: number;
    actions: WorkflowAction[];
    order?: number;
    isActive?: boolean;
    crmConfig?: CrmConfig;
    crmStage?: {
        id: string;
        name: string;
        color?: string;
    };
    agentState?: {
        id: string;
        name: string;
    };
    // Legacy fields
    method?: string;
    url?: string;
}

export interface AutomationAction extends WorkflowAction { }


// ============================================
// Component Props Interfaces
// ============================================

export interface CrmConfigTabProps {
    crmConfigs: CrmConfig[];
    fetchCrmConfigs: () => Promise<void>;
    selectedCrmConfig: string;
    setSelectedCrmConfig: (id: string) => void;
    orgId: string;
    config: any;
    setConfig: (config: any) => void;
    crmName: string;
    setCrmName: (name: string) => void;
}

export interface ApiTestTabProps {
    crmWebhookUrl: string;
    fieldMappings: FieldMapping[];
    crmApiKey?: string;
    crmAuthType?: string;
}

export interface FieldMappingTabProps {
    fieldMappings: FieldMapping[];
    setFieldMappings: (mappings: FieldMapping[]) => void;
    onSave: () => Promise<void>;
}

export interface AutomationsTabProps {
    agentId: string;
    organizationId: string;
    crmConfigs: CrmConfig[];
    selectedCrmConfig: string;
    setSelectedCrmConfig: (id: string) => void;
    selectedCrmStage: string;
    setSelectedCrmStage: (id: string) => void;
    automations: Automation[];
    setAutomations: (automations: Automation[]) => void;
    fetchAutomations: () => Promise<void>;
}

export interface WorkflowCanvasProps {
    actions: WorkflowAction[];
    onEditAction: (action: WorkflowAction, index: number) => void;
    onDeleteAction: (index: number) => void;
    onMoveAction: (fromIndex: number, toIndex: number) => void;
    onAddAction: (afterIndex?: number) => void;
}

export interface ActionCardProps {
    action: WorkflowAction;
    index: number;
    onEdit: () => void;
    onDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    availableVariables: string[];
}

export interface ActionModalProps {
    show: boolean;
    action: Partial<WorkflowAction>;
    isEditing: boolean;
    onSave: (action: Partial<WorkflowAction>, bodyFormat: string, bodyFields: Array<{ key: string, value: string }>) => void;
    onCancel: () => void;
    onChange: (action: Partial<WorkflowAction>) => void;
    crmAuth?: {
        type: string;
        value: string;
        name: string;
    };
}

// ============================================
// Admin Data Viewer Interfaces
// ============================================

export interface Organization {
    id: string;
    name: string;
    [key: string]: any;
}

export type AdminDataType = 'leads' | 'followups' | 'knowledge' | 'states' | 'appointments' | 'conversations';
