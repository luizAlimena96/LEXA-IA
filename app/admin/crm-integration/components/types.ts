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

export interface AutomationAction {
    id?: string;
    name: string;
    description?: string;
    url: string;
    method: string;
    bodyTemplate: string;
    headers?: Record<string, string>;
}

export interface Automation {
    id: string;
    name: string;
    description?: string;
    method: string;
    url: string;
    actions: AutomationAction[];
}
