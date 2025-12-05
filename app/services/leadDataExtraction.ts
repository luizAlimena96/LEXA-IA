import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Extract CPF from text
 * Accepts formats: XXX.XXX.XXX-XX or XXXXXXXXXXX
 */
export function extractCPF(text: string): string | null {
    // Remove all non-digits
    const digits = text.replace(/\D/g, '');

    // Check if it's a valid CPF (11 digits)
    if (digits.length === 11) {
        return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    return null;
}

/**
 * Extract birth date from text
 * Accepts formats: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
 */
export function extractBirthDate(text: string): Date | null {
    const datePattern = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/;
    const match = text.match(datePattern);

    if (match) {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]) - 1; // JS months are 0-indexed
        const year = parseInt(match[3]);

        const date = new Date(year, month, day);

        // Validate date
        if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
            return date;
        }
    }

    return null;
}

/**
 * Extract marital status from text
 */
export function extractMaritalStatus(text: string): string | null {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('solteiro') || lowerText.includes('solteira')) {
        return 'Solteiro';
    }
    if (lowerText.includes('casado') || lowerText.includes('casada')) {
        return 'Casado';
    }
    if (lowerText.includes('divorciado') || lowerText.includes('divorciada')) {
        return 'Divorciado';
    }
    if (lowerText.includes('viúvo') || lowerText.includes('viúva')) {
        return 'Viúvo';
    }

    return null;
}

/**
 * Extract and update lead data from message
 */
export async function extractAndUpdateLeadData(leadId: string, message: string): Promise<{
    updated: boolean;
    extractedFields: string[];
}> {
    const extractedFields: string[] = [];
    const updateData: any = {};

    // Extract CPF
    const cpf = extractCPF(message);
    if (cpf) {
        updateData.cpf = cpf;
        extractedFields.push('cpf');
    }

    // Extract marital status
    const maritalStatus = extractMaritalStatus(message);
    if (maritalStatus) {
        updateData.maritalStatus = maritalStatus;
        extractedFields.push('maritalStatus');
    }

    // Check if message looks like an address (contains street indicators)
    const addressIndicators = ['rua', 'avenida', 'av.', 'travessa', 'alameda', 'número', 'nº', 'bairro', 'cidade'];
    const lowerMessage = message.toLowerCase();
    const hasAddressIndicator = addressIndicators.some(indicator => lowerMessage.includes(indicator));

    if (hasAddressIndicator && message.length > 20) {
        updateData.address = message;
        extractedFields.push('address');
    }

    // Check if message looks like a profession (single word or short phrase, not a question)
    if (message.split(' ').length <= 3 && message.length > 3 && !message.includes('?')) {
        const professionKeywords = ['professor', 'médico', 'engenheiro', 'advogado', 'contador', 'vendedor', 'gerente', 'analista', 'desenvolvedor', 'designer', 'consultor'];
        const isProfession = professionKeywords.some(keyword => lowerMessage.includes(keyword)) ||
            (message.split(' ').length <= 2 && !lowerMessage.includes('qual') && !lowerMessage.includes('como'));

        if (isProfession) {
            updateData.profession = message;
            extractedFields.push('profession');
        }
    }

    // Update lead if any data was extracted
    if (Object.keys(updateData).length > 0) {
        await prisma.lead.update({
            where: { id: leadId },
            data: updateData,
        });

        return { updated: true, extractedFields };
    }

    return { updated: false, extractedFields: [] };
}

/**
 * Check if lead has all required data for contract
 */
export async function checkLeadDataComplete(leadId: string): Promise<{
    complete: boolean;
    missingFields: string[];
}> {
    const lead = await prisma.lead.findUnique({
        where: { id: leadId },
    });

    if (!lead) {
        return { complete: false, missingFields: ['lead not found'] };
    }

    const missingFields: string[] = [];

    if (!lead.name) missingFields.push('name');
    if (!lead.cpf) missingFields.push('cpf');
    if (!lead.email) missingFields.push('email');
    if (!lead.phone) missingFields.push('phone');
    if (!lead.address) missingFields.push('address');
    if (!lead.maritalStatus) missingFields.push('maritalStatus');
    if (!lead.profession) missingFields.push('profession');

    return {
        complete: missingFields.length === 0,
        missingFields,
    };
}

export async function getLeadDataStatus(leadId: string): Promise<{
    name: boolean;
    cpf: boolean;
    email: boolean;
    phone: boolean;
    address: boolean;
    maritalStatus: boolean;
    profession: boolean;
    completionPercentage: number;
}> {
    const lead = await prisma.lead.findUnique({
        where: { id: leadId },
    });

    if (!lead) {
        return {
            name: false,
            cpf: false,
            email: false,
            phone: false,
            address: false,
            maritalStatus: false,
            profession: false,
            completionPercentage: 0,
        };
    }

    const status = {
        name: !!lead.name,
        cpf: !!lead.cpf,
        email: !!lead.email,
        phone: !!lead.phone,
        address: !!lead.address,
        maritalStatus: !!lead.maritalStatus,
        profession: !!lead.profession,
        completionPercentage: 0,
    };

    const completedFields = Object.values(status).filter(v => v === true).length;
    status.completionPercentage = Math.round((completedFields / 7) * 100);

    return status;
}
