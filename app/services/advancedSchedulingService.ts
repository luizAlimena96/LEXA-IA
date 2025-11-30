// Advanced Scheduling Service - Validates complex scheduling rules

import { prisma } from '@/app/lib/prisma';

interface ValidationResult {
    valid: boolean;
    reason?: string;
}

interface TimeWindow {
    start: string; // "08:00"
    end: string;   // "12:00"
}

/**
 * Valida todas as regras avançadas de agendamento
 */
export async function validateSchedulingRules(
    agentId: string,
    requestedDate: Date,
    duration?: number
): Promise<ValidationResult> {
    const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        select: {
            minAdvanceHours,
            allowDynamicDuration,
            minMeetingDuration,
            maxMeetingDuration,
            customTimeWindows,
            useCustomTimeWindows,
        }
    });

    if (!agent) {
        return { valid: false, reason: 'Agente não encontrado' };
    }

    // 1. Validar antecedência mínima
    const minAdvanceResult = validateMinAdvance(requestedDate, agent.minAdvanceHours);
    if (!minAdvanceResult.valid) return minAdvanceResult;

    // 2. Validar janelas de horário customizadas
    if (agent.useCustomTimeWindows && agent.customTimeWindows) {
        const timeWindowResult = validateTimeWindows(
            requestedDate,
            agent.customTimeWindows as Record<string, TimeWindow[]>
        );
        if (!timeWindowResult.valid) return timeWindowResult;
    }

    // 3. Validar duração dinâmica
    if (duration && agent.allowDynamicDuration) {
        const durationResult = validateDuration(
            duration,
            agent.minMeetingDuration,
            agent.maxMeetingDuration
        );
        if (!durationResult.valid) return durationResult;
    }

    return { valid: true };
}

/**
 * Valida antecedência mínima
 */
export function validateMinAdvance(
    requestedDate: Date,
    minAdvanceHours: number
): ValidationResult {
    if (minAdvanceHours === 0) return { valid: true };

    const now = new Date();
    const minAdvanceMs = minAdvanceHours * 60 * 60 * 1000;
    const timeDiff = requestedDate.getTime() - now.getTime();

    if (timeDiff < minAdvanceMs) {
        return {
            valid: false,
            reason: `Agendamento requer no mínimo ${minAdvanceHours}h de antecedência. Você está tentando agendar com ${Math.floor(timeDiff / (60 * 60 * 1000))}h de antecedência.`
        };
    }

    return { valid: true };
}

/**
 * Valida se o horário está dentro das janelas permitidas
 */
export function validateTimeWindows(
    requestedDate: Date,
    customTimeWindows: Record<string, TimeWindow[]>
): ValidationResult {
    const dayOfWeek = requestedDate.toLocaleDateString('pt-BR', { weekday: 'short' });
    const windows = customTimeWindows[dayOfWeek] || [];

    if (windows.length === 0) {
        return {
            valid: false,
            reason: `Não há janelas de horário configuradas para ${dayOfWeek}`
        };
    }

    const timeStr = requestedDate.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    const isInWindow = windows.some(window => {
        return timeStr >= window.start && timeStr <= window.end;
    });

    if (!isInWindow) {
        const windowsStr = windows.map(w => `${w.start}-${w.end}`).join(', ');
        return {
            valid: false,
            reason: `Horário ${timeStr} fora das janelas permitidas para ${dayOfWeek}: ${windowsStr}`
        };
    }

    return { valid: true };
}

/**
 * Valida duração dinâmica
 */
export function validateDuration(
    duration: number,
    minDuration: number,
    maxDuration: number
): ValidationResult {
    if (duration < minDuration || duration > maxDuration) {
        return {
            valid: false,
            reason: `Duração deve estar entre ${minDuration} e ${maxDuration} minutos. Duração solicitada: ${duration} minutos.`
        };
    }

    return { valid: true };
}

/**
 * Sugere próximos horários disponíveis respeitando todas as regras
 */
export async function suggestAvailableSlots(
    agentId: string,
    count: number = 3,
    duration?: number
): Promise<Date[]> {
    const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        include: { organization: true }
    });

    if (!agent) return [];

    const slots: Date[] = [];
    let currentDate = new Date();

    // Começar da antecedência mínima
    if (agent.minAdvanceHours > 0) {
        currentDate.setHours(currentDate.getHours() + agent.minAdvanceHours);
    }

    const maxAttempts = 100;
    let attempts = 0;

    while (slots.length < count && attempts < maxAttempts) {
        attempts++;

        // Validar regras
        const validation = await validateSchedulingRules(agentId, currentDate, duration);

        if (validation.valid) {
            // Verificar disponibilidade real
            const available = await checkRealAvailability(agentId, currentDate, duration);
            if (available) {
                slots.push(new Date(currentDate));
            }
        }

        // Avançar 30 minutos
        currentDate.setMinutes(currentDate.getMinutes() + 30);
    }

    return slots;
}

/**
 * Verifica disponibilidade real (sem conflitos)
 */
async function checkRealAvailability(
    agentId: string,
    datetime: Date,
    duration?: number
): Promise<boolean> {
    const agent = await prisma.agent.findUnique({
        where: { id: agentId }
    });

    if (!agent) return false;

    const finalDuration = duration || agent.meetingDuration;
    const endTime = new Date(datetime.getTime() + (finalDuration + agent.bufferTime) * 60000);

    // Verificar conflitos no banco
    const conflicts = await prisma.appointment.count({
        where: {
            organizationId: agent.organizationId,
            scheduledAt: {
                gte: datetime,
                lt: endTime,
            },
            status: {
                notIn: ['CANCELLED', 'NO_SHOW']
            },
        },
    });

    return conflicts === 0;
}
