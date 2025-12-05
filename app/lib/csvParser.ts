// CSV Parser for Agent Import
// Parses unified CSV file with all agent configuration

export interface AgentData {
    name: string;
    description: string;
    tone: 'FORMAL' | 'CASUAL' | 'FRIENDLY' | 'PROFESSIONAL';
    language: string;
    responseDelay: number;
    writingStyle?: string;
    prohibitions?: string;
    dataCollectionInstructions?: string;
    followupDecisionPrompt?: string;
    notificationPhones?: string[];
}

export interface KnowledgeData {
    title: string;
    type: 'DOCUMENT' | 'FAQ' | 'TEXT';
    content: string;
}

export interface MatrixData {
    name: string;
    missionPrompt: string;
    mediaTiming: 'BEFORE' | 'AFTER';
    responseType: 'TEXT' | 'AUDIO';
    tools?: string;
    crmStatus?: string;
    dataKey?: string;
    dataDescription?: string;
    dataType?: string;
    routes?: string; // Format: "intent->targetState;intent2->targetState2"
}

export interface FollowupData {
    name: string;
    conditionType: 'no_response' | 'specific_state' | 'specific_time' | 'custom';
    conditionStateId?: string; // State name, will be converted to ID
    conditionValue?: string;
    message: string;
    delayHours: number;
    delayMinutes: number;
    matrixStageId: string; // State name, will be converted to ID
    mediaType: string;
    respectBusinessHours: boolean;
    specificTimeEnabled: boolean;
    specificHour?: number;
    specificMinute?: number;
}

export interface ReminderData {
    title: string;
    message: string;
    scheduledFor: string;
    recipients: string;
    mediaType: string;
    advanceTime: number;
}

export interface ParsedData {
    agent: AgentData | null;
    knowledge: KnowledgeData[];
    matrix: MatrixData[];
    followups: FollowupData[];
    reminders: ReminderData[];
}

export interface ValidationError {
    section: string;
    row: number;
    field: string;
    message: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: string[];
}

/**
 * Parse CSV content into structured data
 */
export function parseAgentCSV(content: string): ParsedData {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));

    const result: ParsedData = {
        agent: null,
        knowledge: [],
        matrix: [],
        followups: [],
        reminders: []
    };

    let currentSection: string | null = null;
    let headers: string[] = [];

    for (const line of lines) {
        // Check for section marker
        if (line.startsWith('[') && line.endsWith(']')) {
            currentSection = line.slice(1, -1);
            headers = [];
            continue;
        }

        // Parse headers
        if (headers.length === 0 && currentSection) {
            headers = parseCSVLine(line);
            continue;
        }

        // Parse data rows
        if (currentSection && headers.length > 0) {
            const values = parseCSVLine(line);
            const row = zipToObject(headers, values);

            switch (currentSection) {
                case 'AGENT':
                    result.agent = parseAgentRow(row);
                    break;
                case 'KNOWLEDGE':
                    result.knowledge.push(parseKnowledgeRow(row));
                    break;
                case 'MATRIX':
                    result.matrix.push(parseMatrixRow(row));
                    break;
                case 'FOLLOWUPS':
                    result.followups.push(parseFollowupRow(row));
                    break;
                case 'REMINDERS':
                    result.reminders.push(parseReminderRow(row));
                    break;
            }
        }
    }

    return result;
}

/**
 * Parse CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}

/**
 * Zip headers and values into object
 */
function zipToObject(headers: string[], values: string[]): Record<string, string> {
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
        obj[header] = values[index] || '';
    });
    return obj;
}

/**
 * Parse agent row
 */
function parseAgentRow(row: Record<string, string>): AgentData {
    return {
        name: row.name || 'Novo Agente',
        description: row.description || '',
        tone: (row.tone?.toUpperCase() as AgentData['tone']) || 'PROFESSIONAL',
        language: row.language || 'pt-BR',
        responseDelay: parseInt(row.responseDelay) || 2,
        writingStyle: row.writingStyle || undefined,
        prohibitions: row.prohibitions || undefined,
        dataCollectionInstructions: row.dataCollectionInstructions || undefined,
        followupDecisionPrompt: row.followupDecisionPrompt || undefined,
        notificationPhones: row.notificationPhones
            ? row.notificationPhones.split(',').map(p => p.trim()).filter(p => p).slice(0, 3)
            : undefined
    };
}

/**
 * Parse knowledge row
 */
function parseKnowledgeRow(row: Record<string, string>): KnowledgeData {
    return {
        title: row.title || 'Sem título',
        type: (row.type as KnowledgeData['type']) || 'TEXT',
        content: row.content || ''
    };
}

/**
 * Parse matrix row
 */
function parseMatrixRow(row: Record<string, string>): MatrixData {
    return {
        name: row.name || 'Estado',
        missionPrompt: row.missionPrompt || '',
        mediaTiming: (row.mediaTiming as MatrixData['mediaTiming']) || 'AFTER',
        responseType: (row.responseType as MatrixData['responseType']) || 'TEXT',
        tools: row.tools || undefined,
        crmStatus: row.crmStatus || undefined,
        dataKey: row.dataKey || undefined,
        dataDescription: row.dataDescription || undefined,
        dataType: row.dataType || undefined,
        routes: row.routes || undefined
    };
}

/**
 * Parse followup row
 */
function parseFollowupRow(row: Record<string, string>): FollowupData {
    return {
        name: row.name || 'Follow-up',
        conditionType: (row.conditionType as FollowupData['conditionType']) || 'no_response',
        conditionStateId: row.conditionStateId || undefined,
        conditionValue: row.conditionValue || undefined,
        message: row.message || '',
        delayHours: parseInt(row.delayHours) || 0,
        delayMinutes: parseInt(row.delayMinutes) || 0,
        matrixStageId: row.matrixStageId || '',
        mediaType: row.mediaType || 'text',
        respectBusinessHours: row.respectBusinessHours === 'true',
        specificTimeEnabled: row.specificTimeEnabled === 'true',
        specificHour: row.specificHour ? parseInt(row.specificHour) : undefined,
        specificMinute: row.specificMinute ? parseInt(row.specificMinute) : undefined
    };
}

/**
 * Parse reminder row
 */
function parseReminderRow(row: Record<string, string>): ReminderData {
    return {
        title: row.title || 'Lembrete',
        message: row.message || '',
        scheduledFor: row.scheduledFor || '',
        recipients: row.recipients || '',
        mediaType: row.mediaType || 'text',
        advanceTime: parseInt(row.advanceTime) || 0
    };
}

/**
 * Validate parsed data
 */
export function validateParsedData(data: ParsedData): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Validate Agent
    if (!data.agent) {
        errors.push({
            section: 'AGENT',
            row: 0,
            field: 'all',
            message: 'Seção [AGENT] não encontrada ou vazia'
        });
    } else {
        if (!data.agent.name || data.agent.name.length < 3) {
            errors.push({
                section: 'AGENT',
                row: 1,
                field: 'name',
                message: 'Nome do agente deve ter pelo menos 3 caracteres'
            });
        }
        if (data.agent.notificationPhones && data.agent.notificationPhones.length > 3) {
            warnings.push('Apenas os 3 primeiros telefones de notificação serão usados');
        }
    }

    // Validate Matrix
    if (data.matrix.length === 0) {
        warnings.push('Nenhum estado na matriz. Será criado um estado inicial padrão.');
    } else {
        data.matrix.forEach((state, index) => {
            if (!state.name) {
                errors.push({
                    section: 'MATRIX',
                    row: index + 1,
                    field: 'name',
                    message: 'Nome do estado é obrigatório'
                });
            }
            if (!state.missionPrompt) {
                errors.push({
                    section: 'MATRIX',
                    row: index + 1,
                    field: 'missionPrompt',
                    message: 'Mission prompt é obrigatório'
                });
            }
        });

        // Check for duplicate state names
        const stateNames = data.matrix.map(s => s.name);
        const duplicates = stateNames.filter((name, index) => stateNames.indexOf(name) !== index);
        if (duplicates.length > 0) {
            errors.push({
                section: 'MATRIX',
                row: 0,
                field: 'name',
                message: `Estados duplicados: ${duplicates.join(', ')}`
            });
        }
    }

    // Validate Followups
    data.followups.forEach((followup, index) => {
        if (!followup.message) {
            errors.push({
                section: 'FOLLOWUPS',
                row: index + 1,
                field: 'message',
                message: 'Mensagem é obrigatória'
            });
        }
        if (followup.delayHours > 168) {
            errors.push({
                section: 'FOLLOWUPS',
                row: index + 1,
                field: 'delayHours',
                message: 'Delay máximo: 168 horas (1 semana)'
            });
        }
        if (followup.delayMinutes > 59) {
            errors.push({
                section: 'FOLLOWUPS',
                row: index + 1,
                field: 'delayMinutes',
                message: 'Minutos devem ser entre 0 e 59'
            });
        }
    });

    // Validate Reminders
    data.reminders.forEach((reminder, index) => {
        if (!reminder.title) {
            errors.push({
                section: 'REMINDERS',
                row: index + 1,
                field: 'title',
                message: 'Título é obrigatório'
            });
        }
        if (!reminder.scheduledFor) {
            errors.push({
                section: 'REMINDERS',
                row: index + 1,
                field: 'scheduledFor',
                message: 'Data/hora é obrigatória'
            });
        }
    });

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Convert route string to route objects with IDs
 * Format: "intent->targetStateName;intent2->targetStateName2"
 */
export function convertRoutesToObjects(
    routesString: string | undefined,
    stateMap: Map<string, string>
): Array<{ intent: string; targetStateId: string }> {
    if (!routesString) return [];

    return routesString
        .split(';')
        .map(route => route.trim())
        .filter(route => route)
        .map(route => {
            const [intent, targetStateName] = route.split('->').map(s => s.trim());
            const targetStateId = stateMap.get(targetStateName);

            if (!targetStateId) {
                console.warn(`Estado "${targetStateName}" não encontrado para rota "${intent}"`);
                return null;
            }

            return { intent, targetStateId };
        })
        .filter((route): route is { intent: string; targetStateId: string } => route !== null);
}
