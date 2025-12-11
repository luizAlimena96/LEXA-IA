import { prisma } from '@/app/lib/prisma';

const ZAPSIGN_API_URL = 'https://api.zapsign.com.br/api/v1';

export interface ZapSignDataField {
    de: string;
    para: string;
}

export interface CreateDocumentRequest {
    template_id: string;
    signer_name: string;
    signer_phone_number: string;
    send_automatic_email: boolean;
    send_automatic_whatsapp: boolean;
    lang: string;
    external_id?: string | null;
    data: ZapSignDataField[];
}

export interface CreateDocumentResponse {
    token: string;
    name: string;
    status: string;
    created_at: string;
    signers: Array<{
        token: string;
        name: string;
        email?: string;
        sign_url: string;
    }>;
}

export async function createDocumentFromTemplate(
    apiToken: string,
    request: CreateDocumentRequest
): Promise<CreateDocumentResponse> {
    try {
        const response = await fetch(`${ZAPSIGN_API_URL}/docs/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`ZapSign API error: ${JSON.stringify(error)}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating ZapSign document:', error);
        throw error;
    }
}

/**
 * Get document status
 */
export async function getDocumentStatus(apiToken: string, documentToken: string) {
    try {
        const response = await fetch(`${ZAPSIGN_API_URL}/documents/${documentToken}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`ZapSign API error: ${JSON.stringify(error)}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error getting ZapSign document status:', error);
        throw error;
    }
}

export async function sendContractToLead(leadId: string, organizationId: string, agentId?: string) {
    try {
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: {
                zapSignApiToken: true,
                zapSignTemplateId: true,
                zapSignEnabled: true,
            },
        });

        if (!organization || !organization.zapSignEnabled) {
            throw new Error('ZapSign integration not enabled for this organization');
        }

        if (!organization.zapSignApiToken || !organization.zapSignTemplateId) {
            throw new Error('ZapSign API token or template ID not configured');
        }

        const lead = await prisma.lead.findUnique({
            where: { id: leadId },
        });

        if (!lead) {
            throw new Error('Lead not found');
        }

        // Validate required fields
        if (!lead.name || !lead.phone) {
            throw new Error('Lead is missing required fields (name, phone)');
        }

        // Format phone number (remove non-digits and country code if present)
        let phoneNumber = lead.phone.replace(/\D/g, '');
        if (phoneNumber.startsWith('55')) {
            phoneNumber = phoneNumber.substring(2); // Remove country code
        }

        // Get agent field mapping if agentId is provided
        let fieldMappings: any[] = [];
        if (agentId) {
            const agent = await prisma.agent.findUnique({
                where: { id: agentId },
                select: {
                    zapSignFieldMapping: true,
                },
            });

            if (agent && agent.zapSignFieldMapping) {
                fieldMappings = agent.zapSignFieldMapping as any[];
            }
        }

        // Build data array for template fields
        const dataFields: ZapSignDataField[] = [];

        if (fieldMappings.length > 0) {
            // Use agent's field mapping
            for (const mapping of fieldMappings) {
                const { templateField, leadField } = mapping;

                let value = '';

                // Parse custom expressions like {{ lead.extractedData.campo }} or {{ lead.campo }}
                if (leadField.includes('{{') && leadField.includes('}}')) {
                    // Extract the expression inside {{ }}
                    const expression = leadField.replace(/{{|}}/g, '').trim();

                    // Handle different expression types
                    if (expression === 'currentDate') {
                        value = new Date().toLocaleDateString('pt-BR');
                    } else if (expression.startsWith('lead.extractedData.')) {
                        // Extract from lead.extractedData
                        const fieldName = expression.replace('lead.extractedData.', '');
                        value = (lead as any).extractedData?.[fieldName] || '';
                    } else if (expression.startsWith('lead.')) {
                        // Extract from lead directly
                        const fieldName = expression.replace('lead.', '');
                        value = (lead as any)[fieldName] || '';
                    }
                } else {
                    // Fallback: try to map old-style field names
                    switch (leadField) {
                        case 'name':
                            value = lead.name || '';
                            break;
                        case 'cpf':
                            value = lead.cpf || '';
                            break;
                        case 'email':
                            value = lead.email || '';
                            break;
                        case 'phone':
                            value = lead.phone || '';
                            break;
                        case 'address':
                            value = lead.address || '';
                            break;
                        case 'maritalStatus':
                            value = lead.maritalStatus || '';
                            break;
                        case 'profession':
                            value = lead.profession || '';
                            break;
                        case 'birthDate':
                            value = lead.birthDate ? new Date(lead.birthDate).toLocaleDateString('pt-BR') : '';
                            break;
                        case 'rg':
                            value = lead.rg || '';
                            break;
                        case 'currentDate':
                            value = new Date().toLocaleDateString('pt-BR');
                            break;
                        default:
                            value = '';
                    }
                }

                // Only add if there's a value or it's currentDate
                if (value || leadField.includes('currentDate')) {
                    dataFields.push({
                        de: templateField,
                        para: value
                    });
                }
            }
        } else {
            // Fallback to default mapping if no agent mapping exists
            if (lead.name) {
                dataFields.push({
                    de: '{{ $json.nome }}',
                    para: lead.name
                });
            }

            if (lead.cpf) {
                dataFields.push({
                    de: '{{ $json.cpf }}',
                    para: lead.cpf
                });
            }

            if (lead.maritalStatus) {
                dataFields.push({
                    de: '{{ $json.estado_civil }}',
                    para: lead.maritalStatus
                });
            }

            if (lead.profession) {
                dataFields.push({
                    de: '{{ $json.profissao }}',
                    para: lead.profession
                });
            }

            if (lead.address) {
                dataFields.push({
                    de: '{{ $json.endereco_completo }}',
                    para: lead.address
                });
            }

            // Always add current date
            dataFields.push({
                de: '{{ $json.data }}',
                para: new Date().toLocaleDateString('pt-BR')
            });
        }

        // Prepare request
        const request: CreateDocumentRequest = {
            template_id: organization.zapSignTemplateId,
            signer_name: lead.name,
            signer_phone_number: phoneNumber,
            send_automatic_email: false,
            send_automatic_whatsapp: false,
            lang: 'pt-br',
            external_id: leadId, // Use lead ID as external reference
            data: dataFields
        };

        // Create document
        const document = await createDocumentFromTemplate(
            organization.zapSignApiToken,
            request
        );

        // Update lead with ZapSign document info
        await prisma.lead.update({
            where: { id: leadId },
            data: {
                zapSignDocumentId: document.token,
                zapSignStatus: document.status,
            },
        });

        return {
            success: true,
            documentId: document.token,
            signUrl: document.signers[0]?.sign_url,
            document,
        };
    } catch (error) {
        console.error('Error sending contract to lead:', error);
        throw error;
    }
}

/**
 * Format WhatsApp message with contract link
 */
export function formatContractMessage(
    signUrl: string,
    leadPhone: string
): string {
    const now = new Date();
    const data = now.toLocaleDateString('pt-BR');
    const hora = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let message = `📈 | *NOVO CONTRATO* |\n\n`;
    message += `📅  Data: ${data} às ${hora}\n`;
    message += `• Whatsapp - ${leadPhone}\n`;
    message += `\n\n💬  Link:\n${signUrl}`;

    return message;
}

export async function testZapSignConnection(apiToken: string): Promise<boolean> {
    try {
        const response = await fetch(`${ZAPSIGN_API_URL}/templates/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
            },
        });

        return response.ok;
    } catch (error) {
        console.error('Error testing ZapSign connection:', error);
        return false;
    }
}
