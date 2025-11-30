// CRM Service - Flexible webhook system for multiple CRMs
// Supports DataCrazy, RD Station, Pipedrive, HubSpot, and custom CRMs

import { prisma } from '@/app/lib/prisma';

interface WebhookPayload {
    lead?: any;
    conversation?: any;
    message?: any;
    event: string;
    timestamp: Date;
    organizationId: string;
}

interface WebhookResponse {
    success: boolean;
    statusCode?: number;
    response?: any;
    error?: string;
}

// Replace variables in template with actual data
export function replaceVariables(template: any, data: WebhookPayload): any {
    if (typeof template === 'string') {
        let result = template;

        // Replace {lead.field}
        if (data.lead) {
            Object.keys(data.lead).forEach(key => {
                const regex = new RegExp(`\\{lead\\.${key}\\}`, 'g');
                result = result.replace(regex, data.lead[key] || '');
            });
        }

        // Replace {conversation.field}
        if (data.conversation) {
            Object.keys(data.conversation).forEach(key => {
                const regex = new RegExp(`\\{conversation\\.${key}\\}`, 'g');
                result = result.replace(regex, data.conversation[key] || '');
            });
        }

        // Replace {message.field}
        if (data.message) {
            Object.keys(data.message).forEach(key => {
                const regex = new RegExp(`\\{message\\.${key}\\}`, 'g');
                result = result.replace(regex, data.message[key] || '');
            });
        }

        // Replace {event}, {timestamp}, {organizationId}
        result = result.replace(/\{event\}/g, data.event);
        result = result.replace(/\{timestamp\}/g, data.timestamp.toISOString());
        result = result.replace(/\{organizationId\}/g, data.organizationId);

        return result;
    } else if (typeof template === 'object' && template !== null) {
        if (Array.isArray(template)) {
            return template.map(item => replaceVariables(item, data));
        } else {
            const result: any = {};
            Object.keys(template).forEach(key => {
                result[key] = replaceVariables(template[key], data);
            });
            return result;
        }
    }

    return template;
}

// Trigger a single webhook
export async function triggerWebhook(
    webhook: any,
    data: WebhookPayload
): Promise<WebhookResponse> {
    try {
        // Replace variables in headers and body
        const headers = webhook.headers
            ? replaceVariables(webhook.headers, data)
            : {};

        const body = webhook.bodyTemplate
            ? replaceVariables(webhook.bodyTemplate, data)
            : data;

        // Make HTTP request
        const response = await fetch(webhook.url, {
            method: webhook.method || 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            body: JSON.stringify(body),
        });

        const responseData = await response.json().catch(() => ({}));

        // Log the webhook execution
        await logWebhook(webhook.id, data, response.status, true, responseData);

        return {
            success: response.ok,
            statusCode: response.status,
            response: responseData,
        };
    } catch (error: any) {
        // Log the error
        await logWebhook(webhook.id, data, 0, false, null, error.message);

        return {
            success: false,
            error: error.message,
        };
    }
}

// Log webhook execution
async function logWebhook(
    webhookId: string,
    payload: WebhookPayload,
    statusCode: number,
    success: boolean,
    response: any,
    errorMessage?: string
) {
    try {
        await prisma.crmWebhookLog.create({
            data: {
                webhookId,
                event: payload.event,
                payload: payload as any,
                response,
                statusCode,
                success,
                errorMessage,
            },
        });
    } catch (error) {
        console.error('Error logging webhook:', error);
    }
}

// Process an event - triggers ALL active webhooks for this event
export async function processEvent(
    event: string,
    organizationId: string,
    data: Omit<WebhookPayload, 'event' | 'timestamp' | 'organizationId'>
) {
    try {
        // Get all active webhooks for this event and organization
        const webhooks = await prisma.crmWebhook.findMany({
            where: {
                organizationId,
                event,
                isActive: true,
            },
        });

        if (webhooks.length === 0) {
            return;
        }

        const payload: WebhookPayload = {
            ...data,
            event,
            timestamp: new Date(),
            organizationId,
        };

        // Trigger all webhooks in parallel
        const results = await Promise.allSettled(
            webhooks.map(webhook => triggerWebhook(webhook, payload))
        );

        // Log results
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                console.log(`Webhook ${webhooks[index].name} triggered:`, result.value.success);
            } else {
                console.error(`Webhook ${webhooks[index].name} failed:`, result.reason);
            }
        });

        return results;
    } catch (error) {
        console.error('Error processing event:', error);
    }
}

// Get webhook templates for popular CRMs
export function getWebhookTemplate(crmType: string, event: string): any {
    const templates: any = {
        datacrazy: {
            'lead.created': {
                headers: {
                    'Authorization': 'Bearer {apiKey}',
                    'Content-Type': 'application/json',
                },
                body: {
                    name: '{lead.name}',
                    email: '{lead.email}',
                    phone: '{lead.phone}',
                    source: '{lead.source}',
                    status: '{lead.status}',
                    notes: '{lead.notes}',
                    custom_fields: {
                        whatsapp: '{lead.phone}',
                        origin: 'LEXA',
                    },
                },
            },
            'lead.updated': {
                headers: {
                    'Authorization': 'Bearer {apiKey}',
                    'Content-Type': 'application/json',
                },
                body: {
                    name: '{lead.name}',
                    email: '{lead.email}',
                    phone: '{lead.phone}',
                    status: '{lead.status}',
                    notes: '{lead.notes}',
                },
            },
        },
        rdstation: {
            'lead.created': {
                headers: {
                    'Content-Type': 'application/json',
                },
                body: {
                    event_type: 'CONVERSION',
                    event_family: 'CDP',
                    payload: {
                        conversion_identifier: 'lead-whatsapp',
                        email: '{lead.email}',
                        name: '{lead.name}',
                        mobile_phone: '{lead.phone}',
                        cf_source: '{lead.source}',
                        cf_status: '{lead.status}',
                    },
                },
            },
        },
        pipedrive: {
            'lead.created': {
                headers: {
                    'Content-Type': 'application/json',
                },
                body: {
                    title: '{lead.name}',
                    person_id: null,
                    value: 0,
                    currency: 'BRL',
                    status: 'open',
                    custom_fields: {
                        phone: '{lead.phone}',
                        email: '{lead.email}',
                        source: '{lead.source}',
                    },
                },
            },
        },
        hubspot: {
            'lead.created': {
                headers: {
                    'Content-Type': 'application/json',
                },
                body: {
                    properties: {
                        firstname: '{lead.name}',
                        phone: '{lead.phone}',
                        email: '{lead.email}',
                        lifecyclestage: 'lead',
                        hs_lead_status: '{lead.status}',
                    },
                },
            },
        },
    };

    return templates[crmType]?.[event] || null;
}
