// CRM Automation Service
// Executes CRM automations when agent state changes

import { prisma } from '@/app/lib/prisma';

export interface VariableContext {
    lead: {
        id: string;
        name?: string | null;
        phone: string;
        email?: string | null;
        cpf?: string | null;
        currentState?: string | null;
        conversations?: any[];
        appointments?: any[];
        [key: string]: any;
    };
    conversation: {
        id: string;
        lastMessage?: string;
        [key: string]: any;
    };
    appointment?: {
        scheduledAt?: Date;
        duration?: number;
        [key: string]: any;
    };
    saved: Record<string, any>; // Variables saved from previous actions
}

export interface CRMAction {
    id: string;
    name: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string; // With variables: "/persons/{{personId}}/deals"
    headers?: Record<string, string>;
    bodyTemplate?: string; // JSON with variables
    saveResponseAs?: string; // Variable name to save response
    extractFields?: Record<string, string>; // Extract fields from response
    condition?: string; // Execute only if condition is true
}

/**
 * Execute automations for a specific state change
 */
export async function executeAutomationsForState(
    leadId: string,
    newStateId: string
): Promise<void> {
    try {
        console.log(`🤖 Executing automations for state: ${newStateId}`);

        // Get lead with all necessary data
        const lead = await prisma.lead.findUnique({
            where: { id: leadId },
            include: {
                conversations: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        messages: {
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                        },
                    },
                },
                appointments: {
                    orderBy: { scheduledAt: 'desc' },
                    take: 1,
                },
            },
        });

        if (!lead) {
            console.error(`Lead ${leadId} not found`);
            return;
        }

        // Get active automations for this state or matrix item
        const automations = await prisma.cRMAutomation.findMany({
            where: {
                isActive: true,
                OR: [
                    { stateId: newStateId },
                    { matrixItemId: newStateId }
                ]
            },
            include: {
                crmConfig: true,
            },
            orderBy: { order: 'asc' },
        });

        if (automations.length === 0) {
            console.log(`No automations found for state ${newStateId}`);
            return;
        }

        console.log(`Found ${automations.length} automations to execute`);

        // Build variable context
        const context: VariableContext = {
            lead: {
                id: lead.id,
                name: lead.name,
                phone: lead.phone,
                email: lead.email,
                cpf: lead.cpf,
                currentState: lead.currentState,
                conversations: (lead as any).conversations,
                appointments: (lead as any).appointments,
                extractedData: lead.extractedData,
            },
            conversation: {
                id: (lead as any).conversations?.[0]?.id || '',
                lastMessage: (lead as any).conversations?.[0]?.messages?.[0]?.content || '',
            },
            saved: {},
        };

        if ((lead as any).appointments && (lead as any).appointments.length > 0) {
            context.appointment = {
                scheduledAt: (lead as any).appointments[0].scheduledAt,
                duration: (lead as any).appointments[0].duration,
            };
        }

        // Execute each automation
        for (const automation of automations) {
            try {
                console.log(`📋 Executing automation: ${automation.name}`);
                await executeAutomation(automation, context);
            } catch (error) {
                console.error(`Error executing automation ${automation.name}:`, error);
                // Continue with next automation even if one fails
            }
        }

        console.log(`✅ Completed automations for state ${newStateId}`);
    } catch (error) {
        console.error('Error in executeAutomationsForState:', error);
    }
}

/**
 * Execute a single automation (multiple actions)
 */
async function executeAutomation(
    automation: any,
    context: VariableContext
): Promise<void> {
    const actions: CRMAction[] = automation.actions as CRMAction[];

    for (const action of actions) {
        try {
            // Check condition if exists
            if (action.condition && !evaluateCondition(action.condition, context)) {
                console.log(`⏭️  Skipping action ${action.name} - condition not met`);
                continue;
            }

            console.log(`▶️  Executing action: ${action.name}`);
            const result = await executeAction(action, context, automation.crmConfig);

            // Save response if configured
            if (action.saveResponseAs && result) {
                context.saved[action.saveResponseAs] = result;
                console.log(`💾 Saved response as: ${action.saveResponseAs}`);
            }

            // Extract fields if configured
            if (action.extractFields && result) {
                extractFieldsToContext(result, action.extractFields, context);
            }
        } catch (error) {
            console.error(`Error executing action ${action.name}:`, error);
            throw error; // Stop automation on error
        }
    }
}

/**
 * Execute a single action
 */
async function executeAction(
    action: CRMAction,
    context: VariableContext,
    crmConfig: any
): Promise<any> {
    // Replace variables in URL
    const url = replaceVariables(action.url, context);
    const fullUrl = url.startsWith('http') ? url : `${crmConfig.baseUrl}${url}`;

    // Prepare headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...action.headers,
    };

    // Add authentication
    switch (crmConfig.authType) {
        case 'bearer':
            headers['Authorization'] = `Bearer ${crmConfig.apiKey}`;
            break;
        case 'apikey':
            headers['X-API-Key'] = crmConfig.apiKey;
            break;
        case 'access-token':
            headers['access-token'] = crmConfig.apiKey;
            break;
        case 'basic':
            headers['Authorization'] = `Basic ${btoa(crmConfig.apiKey)}`;
            break;
    }

    // Prepare body
    let body = undefined;
    if (action.bodyTemplate && ['POST', 'PUT', 'PATCH'].includes(action.method)) {
        const bodyStr = replaceVariables(action.bodyTemplate, context);
        body = bodyStr;
    }

    console.log(`🌐 ${action.method} ${fullUrl}`);

    // Make request
    const response = await fetch(fullUrl, {
        method: action.method,
        headers,
        body,
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json().catch(() => ({}));
    console.log(`✅ Action completed successfully`);

    return data;
}

/**
 * Replace variables in template string
 */
function replaceVariables(template: string, context: VariableContext): string {
    let result = template;

    // Replace {{extractedData.field}}
    if (context.lead.extractedData) {
        try {
            const extracted = typeof context.lead.extractedData === 'string' 
                ? JSON.parse(context.lead.extractedData) 
                : context.lead.extractedData;
            
            if (extracted && typeof extracted === 'object') {
                Object.keys(extracted).forEach(key => {
                    const regex = new RegExp(`\\{\\{extractedData\\.${key}\\}\\}`, 'g');
                    result = result.replace(regex, String(extracted[key] || ''));
                });
            }
        } catch (e) {
            console.error('Error parsing extractedData:', e);
        }
    }

    // Replace {{lead.field}}
    Object.keys(context.lead).forEach(key => {
        const regex = new RegExp(`\\{\\{lead\\.${key}\\}\\}`, 'g');
        result = result.replace(regex, String(context.lead[key] || ''));
    });

    // Replace {{conversation.field}}
    Object.keys(context.conversation).forEach(key => {
        const regex = new RegExp(`\\{\\{conversation\\.${key}\\}\\}`, 'g');
        result = result.replace(regex, String(context.conversation[key] || ''));
    });

    // Replace {{appointment.field}}
    if (context.appointment) {
        Object.keys(context.appointment).forEach(key => {
            const regex = new RegExp(`\\{\\{appointment\\.${key}\\}\\}`, 'g');
            const value = context.appointment![key];
            result = result.replace(regex, value instanceof Date ? value.toISOString() : String(value || ''));
        });
    }

    // Replace {{saved.variableName}}
    Object.keys(context.saved).forEach(key => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        const value = context.saved[key];
        result = result.replace(regex, typeof value === 'object' ? JSON.stringify(value) : String(value || ''));
    });

    return result;
}

/**
 * Extract fields from response and save to context
 */
function extractFieldsToContext(
    response: any,
    extractConfig: Record<string, string>,
    context: VariableContext
): void {
    Object.entries(extractConfig).forEach(([variableName, path]) => {
        const value = getNestedValue(response, path);
        if (value !== undefined) {
            context.saved[variableName] = value;
            console.log(`📌 Extracted ${variableName} = ${value}`);
        }
    });
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Evaluate simple conditions
 */
function evaluateCondition(condition: string, context: VariableContext): boolean {
    // Simple implementation - can be enhanced
    // Examples: "personId exists", "lead.email exists"

    if (condition.includes(' exists')) {
        const variable = condition.replace(' exists', '').trim();

        if (variable.startsWith('lead.')) {
            const field = variable.replace('lead.', '');
            return !!context.lead[field];
        }

        if (variable.startsWith('saved.')) {
            const field = variable.replace('saved.', '');
            return !!context.saved[field];
        }

        // Check in saved variables
        return !!context.saved[variable];
    }

    return true; // Default to true if condition not recognized
}
