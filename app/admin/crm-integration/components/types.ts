export interface FieldMapping {
    lexaField: string;
    crmField: string;
    transform?: string;
}

export interface CRMEndpoint {
    name: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    description: string;
}

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

export interface WorkflowAction {
    id: string;
    order: number;
    name: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    bodyTemplate?: string;
    headers?: Record<string, string>;
    saveResponseAs?: string; // Variable name to save response
    continueOnError?: boolean; // Continue workflow even if this action fails
    actionType?: 'HTTP_REQUEST' | 'SEND_MESSAGE'; // For backward compatibility
    messageTemplate?: string; // For SEND_MESSAGE type
    phoneNumbers?: string; // For SEND_MESSAGE type
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
    actions: WorkflowAction[]; // Multiple actions in workflow
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
    // Legacy fields for backward compatibility
    method?: string;
    url?: string;
}

// Legacy action type for backward compatibility
export interface AutomationAction extends WorkflowAction { }
