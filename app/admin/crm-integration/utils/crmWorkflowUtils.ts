// Simple utilities for CRM workflow testing
// These replace the old crmWorkflowService that was removed

export async function getSampleLeadData() {
    return {
        name: "João Silva",
        phone: "5511999999999",
        email: "joao@example.com",
        cpf: "123.456.789-00",
        currentState: "INICIO",
        status: "NEW",
        extractedData: {
            campo1: "Valor 1",
            campo2: "Valor 2"
        }
    };
}

export async function testAction(action: any, sampleData: any) {
    try {
        // Replace variables in URL
        let url = action.url;
        if (sampleData) {
            url = replaceVariables(url, sampleData);
        }

        // Replace variables in body
        let body = action.bodyTemplate;
        if (body && sampleData) {
            body = replaceVariables(body, sampleData);
        }

        // Prepare headers
        const headers = { ...action.headers };

        // Make the request
        const response = await fetch(url, {
            method: action.method || 'GET',
            headers,
            body: action.method !== 'GET' && body ? body : undefined,
        });

        const responseData = await response.json().catch(() => response.text());

        return {
            success: response.ok,
            response: responseData,
            requestSent: {
                method: action.method,
                url,
                headers,
                body
            }
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Erro ao testar ação',
            requestSent: {
                method: action.method,
                url: action.url,
                headers: action.headers,
                body: action.bodyTemplate
            }
        };
    }
}

function replaceVariables(template: string, data: any): string {
    if (!template) return template;

    let result = template;

    // Replace {{lead.field}} variables
    result = result.replace(/\{\{\s*lead\.(\w+(?:\.\w+)*)\s*\}\}/g, (match, path) => {
        const value = getNestedValue(data, path);
        return value !== undefined ? String(value) : match;
    });

    // Replace special variables
    result = result.replace(/\{\{\s*CurrentDate\s*\}\}/g, new Date().toISOString().split('T')[0]);
    result = result.replace(/\{\{\s*CurrentTime\s*\}\}/g, new Date().toISOString());
    result = result.replace(/\{\{\s*UUID\s*\}\}/g, crypto.randomUUID());

    return result;
}

function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

export function getAvailableVariables() {
    return [
        { category: 'Dados Básicos', variables: ['lead.name', 'lead.phone', 'lead.email', 'lead.cpf'] },
        { category: 'Status', variables: ['lead.currentState', 'lead.status'] },
        { category: 'Extraídos', variables: ['lead.extractedData.campo1', 'lead.extractedData.campo2'] },
        { category: 'Especiais', variables: ['CurrentDate', 'CurrentTime', 'UUID'] },
    ];
}
