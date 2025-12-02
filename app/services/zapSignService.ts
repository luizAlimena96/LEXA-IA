import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ZAPSIGN_API_URL = 'https://api.zapsign.com.br/api/v1';

export interface ZapSignSigner {
    name: string;
    cpf: string;
    email: string;
    phone_country: string;
    phone_number: string;
    lock_name?: boolean;
    lock_email?: boolean;
    validate_cpf?: boolean;
}

export interface ZapSignTemplateFields {
    endereco_completo?: string;
    estado_civil?: string;
    profissao?: string;
    data_nascimento?: string;
    data_atual?: string;
    [key: string]: string | undefined;
}

export interface CreateDocumentResponse {
    token: string;
    name: string;
    status: string;
    created_at: string;
    signers: Array<{
        token: string;
        name: string;
        email: string;
        sign_url: string;
    }>;
}

/**
 * Create document from template and send for signature
 */
export async function createDocumentFromTemplate(
    apiToken: string,
    templateId: string,
    signer: ZapSignSigner,
    templateFields: ZapSignTemplateFields
): Promise<CreateDocumentResponse> {
    try {
        const response = await fetch(`${ZAPSIGN_API_URL}/templates/${templateId}/documents`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sandbox: false,
                signers: [signer],
                ...templateFields,
            }),
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

/**
 * Send contract to lead via ZapSign
 */
export async function sendContractToLead(leadId: string, organizationId: string) {
    try {
        // Get organization ZapSign config
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

        // Get lead data
        const lead = await prisma.lead.findUnique({
            where: { id: leadId },
        });

        if (!lead) {
            throw new Error('Lead not found');
        }

        // Validate required fields
        if (!lead.name || !lead.cpf || !lead.email || !lead.phone) {
            throw new Error('Lead is missing required fields (name, cpf, email, phone)');
        }

        // Prepare signer data
        const signer: ZapSignSigner = {
            name: lead.name,
            cpf: lead.cpf,
            email: lead.email,
            phone_country: '55',
            phone_number: lead.phone.replace(/\D/g, ''), // Remove non-digits
            lock_name: true,
            lock_email: true,
            validate_cpf: true,
        };

        // Prepare template fields
        const templateFields: ZapSignTemplateFields = {
            data_atual: new Date().toLocaleDateString('pt-BR'),
        };

        if (lead.address) {
            templateFields.endereco_completo = lead.address;
        }

        if (lead.maritalStatus) {
            templateFields.estado_civil = lead.maritalStatus;
        }

        if (lead.profession) {
            templateFields.profissao = lead.profession;
        }

        if (lead.birthDate) {
            templateFields.data_nascimento = new Date(lead.birthDate).toLocaleDateString('pt-BR');
        }

        // Create document
        const document = await createDocumentFromTemplate(
            organization.zapSignApiToken,
            organization.zapSignTemplateId,
            signer,
            templateFields
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
 * Test ZapSign API connection
 */
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
