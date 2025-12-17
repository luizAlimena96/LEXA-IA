/**
 * FSM Tools Handler
 * Handles tool execution for FSM states
 */

import { prisma } from '@/app/lib/prisma';
import api from '@/app/lib/api-client';

// API wrapper functions - replacing deleted aiSchedulingHandlers
// These delegate to the backend scheduling API
async function handleBookMeeting(
    data: { date: string; time: string; leadName: string; notes?: string },
    organizationId: string,
    leadId: string,
    conversationId: string
): Promise<{ success: boolean; appointmentId?: string; message?: string; error?: string }> {
    try {
        const result = await api.appointments.create({
            leadId,
            organizationId,
            title: `Reunião - ${data.leadName}`,
            scheduledAt: new Date(`${data.date}T${data.time}`).toISOString(),
            description: data.notes || 'Agendamento via IA',
        });
        return {
            success: true,
            appointmentId: result.id,
            message: 'Agendamento criado com sucesso!'
        };
    } catch (error: any) {
        console.error('[FSM Tools] Error in handleBookMeeting:', error);
        return {
            success: false,
            error: error.message || 'Erro ao criar agendamento'
        };
    }
}

async function handleCancelMeeting(
    args: any,
    organizationId: string,
    leadId: string,
    conversationId: string
): Promise<{ success: boolean; message: string }> {
    try {
        // Find the most recent appointment for this lead
        const allAppointments = await api.appointments.list();
        const appointments = allAppointments.filter((a: any) => a.leadId === leadId);
        const upcoming = appointments.find((a: any) => a.status === 'SCHEDULED' && new Date(a.scheduledAt) > new Date());

        if (!upcoming) {
            return { success: false, message: 'Nenhum agendamento encontrado para cancelar.' };
        }

        await api.appointments.delete(upcoming.id);
        return { success: true, message: 'Agendamento cancelado com sucesso.' };
    } catch (error: any) {
        console.error('[FSM Tools] Error in handleCancelMeeting:', error);
        return { success: false, message: 'Erro ao cancelar agendamento.' };
    }
}

async function handleRescheduleMeeting(
    data: { date: string; time: string },
    organizationId: string,
    leadId: string
): Promise<{ success: boolean; message: string }> {
    try {
        const allAppointments = await api.appointments.list();
        const appointments = allAppointments.filter((a: any) => a.leadId === leadId);
        const upcoming = appointments.find((a: any) => a.status === 'SCHEDULED' && new Date(a.scheduledAt) > new Date());

        if (!upcoming) {
            return { success: false, message: 'Nenhum agendamento encontrado para reagendar.' };
        }

        await api.appointments.update(upcoming.id, {
            scheduledAt: new Date(`${data.date}T${data.time}`).toISOString()
        });
        return { success: true, message: 'Agendamento reagendado com sucesso.' };
    } catch (error: any) {
        console.error('[FSM Tools] Error in handleRescheduleMeeting:', error);
        return { success: false, message: 'Erro ao reagendar.' };
    }
}

export interface ToolExecutionResult {
    success: boolean;
    data?: any;
    error?: string;
    message: string;
}

/**
 * Execute a tool based on its name and arguments
 */
export async function executeFSMTool(
    toolName: string,
    args: Record<string, any>,
    context: {
        organizationId: string;
        leadId?: string;
        conversationId: string;
    }
): Promise<ToolExecutionResult> {
    console.log(`[FSM Tools] Executing tool: ${toolName}`, { args, context });

    try {
        switch (toolName) {
            case 'criar_evento':
                return await handleCreateEvent(args, context);
            case 'cancelar_evento':
                return await handleCancelEvent(args, context);
            case 'reagendar_evento':
                return await handleRescheduleEvent(args, context);

            default:
                return {
                    success: false,
                    error: `Tool '${toolName}' not found`,
                    message: `Ferramenta '${toolName}' não está disponível.`
                };
        }
    } catch (error: any) {
        console.error(`[FSM Tools] Error executing ${toolName}:`, error);
        return {
            success: false,
            error: error.message,
            message: `Erro ao executar ferramenta: ${error.message}`
        };
    }
}

/**
 * Handle criar_evento tool
 * Creates an appointment in the database and Google Calendar
 */
async function handleCreateEvent(
    args: Record<string, any>,
    context: {
        organizationId: string;
        leadId?: string;
        conversationId: string;
    }
): Promise<ToolExecutionResult> {
    if (!context.leadId) {
        return {
            success: false,
            error: 'Lead ID is required',
            message: 'Não foi possível criar o agendamento: lead não identificado.'
        };
    }

    // Get lead info
    const lead = await prisma.lead.findUnique({
        where: { id: context.leadId },
        select: { name: true }
    });

    if (!lead) {
        return {
            success: false,
            error: 'Lead not found',
            message: 'Não foi possível criar o agendamento: cliente não encontrado.'
        };
    }

    // Parse date and time from args
    // Expected formats:
    // - date: "2025-12-10" or "terça-feira" or "amanhã"
    // - time: "14:00" or "14h" or "2 da tarde"

    const { date, time, notes } = args;

    if (!date || !time) {
        return {
            success: false,
            error: 'Date and time are required',
            message: 'Por favor, informe a data e horário para o agendamento.'
        };
    }

    // Parse date/time
    let parsedDate: Date;

    try {
        parsedDate = parseDateInput(date, time);
    } catch (error) {
        return {
            success: false,
            error: 'Invalid date/time format',
            message: 'Não consegui entender a data e horário. Por favor, confirme o dia e hora desejados.'
        };
    }

    // Use the existing handleBookMeeting function
    try {
        console.log('[Tools Handler] Calling handleBookMeeting with:', {
            date: parsedDate.toISOString().split('T')[0],
            time: parsedDate.toTimeString().split(' ')[0].substring(0, 5),
            leadId: context.leadId,
            orgId: context.organizationId
        });

        const result = await handleBookMeeting(
            {
                date: parsedDate.toISOString().split('T')[0],
                time: parsedDate.toTimeString().split(' ')[0].substring(0, 5),
                leadName: lead.name || 'Cliente',
                notes: notes || 'Agendamento via IA'
            },
            context.organizationId,
            context.leadId,
            context.conversationId
        );

        console.log('[Tools Handler] handleBookMeeting result:', result);

        if (result.success) {
            return {
                success: true,
                data: {
                    appointmentId: result.appointmentId,
                    agendamento_confirmado: 'sim'
                },
                message: result.message || 'Agendamento criado com sucesso!'
            };
        } else {
            return {
                success: false,
                error: result.error,
                message: `Erro ao criar agendamento: ${result.message || result.error}`
            };
        }
    } catch (error) {
        console.error('[Tools Handler] Unexpected error in handleBookMeeting:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            message: 'Ocorreu um erro interno ao tentar criar o agendamento.'
        };
    }
}


async function handleCancelEvent(args: any, context: any): Promise<ToolExecutionResult> {
    if (!context.leadId) {
        return { success: false, message: 'Não foi possível identificar o cliente.' };
    }
    return await handleCancelMeeting(args, context.organizationId, context.leadId, context.conversationId);
}

async function handleRescheduleEvent(args: any, context: any): Promise<ToolExecutionResult> {
    if (!context.leadId) {
        return { success: false, message: 'Não foi possível identificar o cliente.' };
    }

    const { date, time } = args;
    if (!date || !time) {
        return { success: false, message: 'Por favor, informe a nova data e horário.' };
    }

    let parsedDate: Date;
    try {
        parsedDate = parseDateInput(date, time);
    } catch (error) {
        return { success: false, message: 'Data inválida.' };
    }

    return await handleRescheduleMeeting({
        date: parsedDate.toISOString().split('T')[0],
        time: parsedDate.toTimeString().split(' ')[0].substring(0, 5)
    }, context.organizationId, context.leadId);
}

/**
 * Unified date parser
 */
function parseDateInput(date: string, time: string): Date {
    // Try ISO first
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Handle "14h", "14:00"
        let timeStr = time.replace('h', ':00').replace('H', ':00');
        if (!timeStr.includes(':')) timeStr += ':00';
        return new Date(`${date}T${timeStr}`);
    }
    // Relative
    return parseRelativeDate(date, time);
}

/**
 * Parse relative dates like "amanhã", "terça-feira", etc.
 */
function parseRelativeDate(dateStr: string, timeStr: string): Date {
    const now = new Date();
    const targetDate = new Date(now);

    const dateLower = dateStr.toLowerCase();

    // Handle "depois de amanhã" (Must check before "amanhã")
    if (dateLower.includes('depois') && (dateLower.includes('amanhã') || dateLower.includes('amanha'))) {
        targetDate.setDate(now.getDate() + 2);
    }
    // Handle "amanhã"
    else if (dateLower.includes('amanhã') || dateLower.includes('amanha')) {
        targetDate.setDate(now.getDate() + 1);
    }
    // Handle day of week
    else {
        const dayMap: Record<string, number> = {
            'domingo': 0, 'dom': 0,
            'segunda': 1, 'segunda-feira': 1, 'seg': 1,
            'terça': 2, 'terca': 2, 'terça-feira': 2, 'terca-feira': 2, 'ter': 2,
            'quarta': 3, 'quarta-feira': 3, 'qua': 3,
            'quinta': 4, 'quinta-feira': 4, 'qui': 4,
            'sexta': 5, 'sexta-feira': 5, 'sex': 5,
            'sábado': 6, 'sabado': 6, 'sábado-feira': 6, 'sab': 6, 'sáb': 6
        };

        let targetDay = -1;
        // Check strict matches first to avoid "seg" matching "segundo" if ever needed, though keys are specific enough
        for (const [dayName, dayIndex] of Object.entries(dayMap)) {
            // Use word boundary check or exact inclusion
            if (dateLower.includes(dayName)) {
                targetDay = dayIndex;
                break;
            }
        }

        if (targetDay !== -1) {
            const currentDay = now.getDay();
            let daysToAdd = targetDay - currentDay;
            if (daysToAdd <= 0) daysToAdd += 7; // Next week if today or passed
            targetDate.setDate(now.getDate() + daysToAdd);
        }
    }

    // Parse time
    // Supports: 14:00, 14h, 14h30, 14, 2pm (basic support)
    const timeMatch = timeStr.match(/(\d{1,2})(?:[:hH](\d{2}))?/);
    if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;

        // Basic pm adjustment if needed (can be expanded)
        if (timeStr.toLowerCase().includes('pm') && hours < 12) {
            hours += 12;
        }

        targetDate.setHours(hours, minutes, 0, 0);
    }

    return targetDate;
}

/**
 * Check if a state has tools configured
 */
export function hasTools(state: any): boolean {
    return state.tools && state.tools !== 'null' && state.tools !== '';
}

/**
 * Parse tools from state
 */
export function parseStateTools(state: any): string[] {
    if (!hasTools(state)) return [];

    try {
        const tools = typeof state.tools === 'string' ? JSON.parse(state.tools) : state.tools;
        return Array.isArray(tools) ? tools : [];
    } catch (error) {
        console.error('[FSM Tools] Error parsing tools:', error);
        return [];
    }
}
