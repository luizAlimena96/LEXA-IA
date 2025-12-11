// Enhanced variable replacement with transformations and special variables
export function replaceVariables(template: string, context: Record<string, any>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
        const trimmed = expression.trim();

        // Handle special variables
        if (trimmed === 'CurrentDate') {
            return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        }
        if (trimmed === 'CurrentTime') {
            return new Date().toISOString(); // Full ISO timestamp
        }
        if (trimmed === 'CurrentTimestamp') {
            return Date.now().toString();
        }
        if (trimmed === 'UUID') {
            return crypto.randomUUID();
        }

        // Handle transformations like {{lead.name.toUpperCase()}}
        const transformMatch = trimmed.match(/^(.+?)\.(toUpperCase|toLowerCase|trim)\(\)$/);
        if (transformMatch) {
            const [, path, transform] = transformMatch;
            const value = getNestedValue(context, path);
            if (value !== undefined && value !== null) {
                const strValue = String(value);
                switch (transform) {
                    case 'toUpperCase':
                        return strValue.toUpperCase();
                    case 'toLowerCase':
                        return strValue.toLowerCase();
                    case 'trim':
                        return strValue.trim();
                }
            }
            return match;
        }

        // Handle date formatting like {{CurrentDate.format('DD/MM/YYYY')}}
        const dateFormatMatch = trimmed.match(/^CurrentDate\.format\(['"]([^'"]+)['"]\)$/);
        if (dateFormatMatch) {
            const format = dateFormatMatch[1];
            const now = new Date();
            // Simple format replacement
            return format
                .replace('YYYY', now.getFullYear().toString())
                .replace('MM', String(now.getMonth() + 1).padStart(2, '0'))
                .replace('DD', String(now.getDate()).padStart(2, '0'))
                .replace('HH', String(now.getHours()).padStart(2, '0'))
                .replace('mm', String(now.getMinutes()).padStart(2, '0'))
                .replace('ss', String(now.getSeconds()).padStart(2, '0'));
        }

        // Standard variable replacement
        const value = getNestedValue(context, trimmed);
        return value !== undefined && value !== null ? String(value) : match;
    });
}

export function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
        return current?.[key];
    }, obj);
}

// Test a single action with sample data
export async function testAction(
    action: WorkflowAction,
    sampleLead?: any
): Promise<{
    success: boolean;
    response?: any;
    error?: string;
    requestSent?: {
        url: string;
        method: string;
        body?: string;
        headers?: Record<string, string>;
    };
}> {
    try {
        // Use sample lead data if not provided
        const lead = sampleLead || {
            name: 'João Silva',
            phone: '5511999999999',
            email: 'joao@example.com',
            cpf: '12345678900',
            status: 'active',
            currentState: 'Qualificado',
            extractedData: {
                campo1: 'Valor 1',
                campo2: 'Valor 2',
                valor: '1000'
            }
        };

        const context = { lead };

        // Replace variables
        const targetUrl = replaceVariables(action.url, context);
        let targetBody = action.bodyTemplate
            ? replaceVariables(action.bodyTemplate, context)
            : undefined;

        const targetHeaders: Record<string, string> = {};
        let hasContentType = false;

        if (action.headers) {
            for (const [key, value] of Object.entries(action.headers)) {
                const headerValue = replaceVariables(value, context);
                targetHeaders[key] = headerValue;
                if (key.toLowerCase() === 'content-type') {
                    hasContentType = true;
                }
            }
        }

        // Default to application/json only if not specified
        if (!hasContentType) {
            targetHeaders['Content-Type'] = 'application/json';
        }

        // Call our own proxy endpoint
        const response = await fetch('/api/proxy-request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: targetUrl,
                method: action.method,
                headers: targetHeaders,
                body: targetBody
            }),
        });

        if (!response.ok) {
            // This means the proxy itself failed (e.g. 401 unauthorized or 500 error)
            const errorText = await response.text();
            throw new Error(`Proxy Error (${response.status}): ${errorText}`);
        }

        // Parse proxy response
        // structure: { status, ok, headers, data, error? }
        const proxyResult = await response.json();

        if (!proxyResult.ok) {
            return {
                success: false,
                error: `HTTP ${proxyResult.status}: ${typeof proxyResult.data === 'object' ? JSON.stringify(proxyResult.data) : proxyResult.data || proxyResult.error}`,
                requestSent: { url: targetUrl, method: action.method, body: targetBody, headers: targetHeaders }
            };
        }

        return {
            success: true,
            response: proxyResult.data,
            requestSent: { url: targetUrl, method: action.method, body: targetBody, headers: targetHeaders }
        };

    } catch (error: any) {
        console.error('[Test Action] Execution Error:', error);
        return {
            success: false,
            error: error.message || 'Unknown error'
        };
    }
}

// Get sample lead data from database for preview
export async function getSampleLeadData(): Promise<any> {
    try {
        // This would fetch from your database
        // For now, return mock data
        return {
            name: 'João Silva',
            phone: '5511999999999',
            email: 'joao@example.com',
            cpf: '12345678900',
            status: 'active',
            currentState: 'Qualificado',
            extractedData: {
                campo1: 'Valor Exemplo 1',
                campo2: 'Valor Exemplo 2',
                valor: '1500'
            }
        };
    } catch (error) {
        console.error('Error fetching sample lead:', error);
        return null;
    }
}

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

export interface WorkflowExecutionResult {
    success: boolean;
    results: Record<string, any>;
    errors: Array<{ actionId: string; actionName: string; error: string }>;
    executedActions: number;
    totalActions: number;
}

export async function executeWorkflow(
    actions: WorkflowAction[],
    lead: any,
    initialContext: Record<string, any> = {}
): Promise<WorkflowExecutionResult> {
    const results: Record<string, any> = {
        lead: lead,
        ...initialContext,
    };

    const errors: Array<{ actionId: string; actionName: string; error: string }> = [];
    let executedActions = 0;

    const sortedActions = [...actions].sort((a, b) => a.order - b.order);

    for (const action of sortedActions) {
        try {
            console.log(`[Workflow] Executing action ${action.order}: ${action.name}`);

            const url = replaceVariables(action.url, results);
            const body = action.bodyTemplate
                ? replaceVariables(action.bodyTemplate, results)
                : undefined;

            const headers: Record<string, string> = {};
            if (action.headers) {
                for (const [key, value] of Object.entries(action.headers)) {
                    headers[key] = replaceVariables(value, results);
                }
            }

            const response = await fetch(url, {
                method: action.method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
                body: body,
            });

            let data: any;
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
            }

            if (action.saveResponseAs) {
                results[action.saveResponseAs] = data;
                console.log(`[Workflow] Saved response as: ${action.saveResponseAs}`);
            }

            executedActions++;
        } catch (error: any) {
            console.error(`[Workflow] Error in action ${action.name}:`, error);

            errors.push({
                actionId: action.id,
                actionName: action.name,
                error: error.message || 'Unknown error',
            });

            if (!action.continueOnError) {
                console.log(`[Workflow] Stopping workflow due to error in action: ${action.name}`);
                break;
            }
        }
    }

    return {
        success: errors.length === 0,
        results,
        errors,
        executedActions,
        totalActions: sortedActions.length,
    };
}

export function validateWorkflow(actions: WorkflowAction[]): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!actions || actions.length === 0) {
        errors.push('Workflow must have at least one action');
        return { valid: false, errors };
    }

    const orders = actions.map((a) => a.order);
    const duplicateOrders = orders.filter((order, index) => orders.indexOf(order) !== index);
    if (duplicateOrders.length > 0) {
        errors.push(`Duplicate action orders found: ${duplicateOrders.join(', ')}`);
    }

    const saveNames = actions
        .filter((a) => a.saveResponseAs)
        .map((a) => a.saveResponseAs);
    const duplicateSaveNames = saveNames.filter(
        (name, index) => saveNames.indexOf(name) !== index
    );
    if (duplicateSaveNames.length > 0) {
        errors.push(`Duplicate saveResponseAs names found: ${duplicateSaveNames.join(', ')}`);
    }

    actions.forEach((action, index) => {
        if (!action.name || action.name.trim() === '') {
            errors.push(`Action ${index + 1}: name is required`);
        }

        if (!action.method) {
            errors.push(`Action ${index + 1}: method is required`);
        }

        if (!action.url || action.url.trim() === '') {
            errors.push(`Action ${index + 1}: URL is required`);
        }

        if (action.url && !action.url.match(/^https?:\/\//)) {
            errors.push(`Action ${index + 1}: URL must start with http:// or https://`);
        }

        if (action.saveResponseAs && !action.saveResponseAs.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
            errors.push(
                `Action ${index + 1}: saveResponseAs must be alphanumeric (underscore allowed, no spaces)`
            );
        }
    });

    return {
        valid: errors.length === 0,
        errors,
    };
}

export function getAvailableVariables(
    actions: WorkflowAction[],
    currentActionOrder: number
): string[] {
    const variables: string[] = [
        'lead.name',
        'lead.phone',
        'lead.email',
        'lead.cpf',
        'lead.status',
        'lead.currentState',
        'lead.extractedData.*',
        // Special variables
        'CurrentDate',
        'CurrentTime',
        'CurrentTimestamp',
        'UUID',
    ];

    actions
        .filter((a) => a.order < currentActionOrder && a.saveResponseAs)
        .forEach((a) => {
            variables.push(`${a.saveResponseAs}.*`);
        });

    return variables;
}
