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

export interface WorkflowAction {
    id: string;
    order: number;
    name: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    bodyTemplate?: string;
    headers?: Record<string, string>;
    saveResponseAs?: string;
    continueOnError?: boolean;
    actionType?: 'HTTP_REQUEST' | 'SEND_MESSAGE';
    messageTemplate?: string;
    phoneNumbers?: string;
}

export interface Automation {
    id: string;
    name: string;
    description?: string;
    crmConfigId?: string;
    crmStageId?: string;
    agentStateId?: string;
    triggerType?: string;
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
