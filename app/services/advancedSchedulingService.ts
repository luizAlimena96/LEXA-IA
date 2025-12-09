// Advanced Scheduling Service - Validates scheduling rules and suggests alternatives

import { prisma } from '@/app/lib/prisma';
import { checkGoogleCalendarAvailabilityOrganization, checkAvailabilityWithSyncedEvents } from './googleCalendarService';

interface ValidationResult {
    valid: boolean;
    reason?: string;
}

interface TimeSlot {
    datetime: Date;
    formatted: string;
}

/**
 * Validates if a requested datetime meets all scheduling rules
 */
export async function validateSchedulingRules(
    organizationId: string,
    requestedDateTime: Date
): Promise<ValidationResult> {
    const org = await prisma.organization.findUnique({
        where: { id: organizationId },
    });

    if (!org) {
        return { valid: false, reason: 'Organização não encontrada' };
    }

    // Rule 1: No same-day scheduling
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestedDate = new Date(requestedDateTime);
    requestedDate.setHours(0, 0, 0, 0);

    if (requestedDate.getTime() === today.getTime()) {
        return { valid: false, reason: 'Não é possível agendar para o mesmo dia' };
    }

    // Rule 2: Preparation time (minimum hours in advance)
    // TODO: Add schedulingPreparationHours to Organization schema
    const preparationHours = 24; // org.schedulingPreparationHours || 24;
    const minDateTime = new Date(Date.now() + preparationHours * 60 * 60 * 1000);

    if (requestedDateTime < minDateTime) {
        return {
            valid: false,
            reason: `É necessário agendar com pelo menos ${preparationHours} horas de antecedência`,
        };
    }

    // Rule 3: Business hours (with shifts support)
    const dayOfWeek = requestedDateTime.toLocaleDateString('pt-BR', { weekday: 'short' });
    const workingHours = (org.workingHours as any)?.[dayOfWeek] || [];

    if (workingHours.length === 0) {
        return { valid: false, reason: 'Não há horário de atendimento neste dia' };
    }

    const requestedTime = requestedDateTime.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });

    const isWithinShift = workingHours.some((shift: any) => {
        return requestedTime >= shift.start && requestedTime <= shift.end;
    });

    if (!isWithinShift) {
        return { valid: false, reason: 'Horário fora do expediente' };
    }

    // Rule 4: Check Google Calendar availability (1 hour meeting by default)
    const endTime = new Date(requestedDateTime.getTime() + 60 * 60 * 1000);

    // First check synced events from database
    const availableInDb = await checkAvailabilityWithSyncedEvents(
        organizationId,
        requestedDateTime,
        endTime
    );

    if (!availableInDb) {
        return { valid: false, reason: 'Horário já ocupado' };
    }

    // Then check Google Calendar directly if enabled
    if (org.googleCalendarEnabled) {
        const availableInGoogle = await checkGoogleCalendarAvailabilityOrganization(
            organizationId,
            requestedDateTime,
            endTime
        );

        if (!availableInGoogle) {
            return { valid: false, reason: 'Horário já ocupado no calendário' };
        }
    }

    return { valid: true };
}

/**
 * Suggests alternative time slots when preferred time is not available
 */
export async function suggestAlternativeSlots(
    organizationId: string,
    preferredDateTime: Date,
    count: number = 3
): Promise<TimeSlot[]> {
    const org = await prisma.organization.findUnique({
        where: { id: organizationId },
    });

    if (!org) return [];

    const suggestions: TimeSlot[] = [];
    const workingHours = (org.workingHours as any) || {};

    // Try to find slots starting from the preferred date
    let currentDate = new Date(preferredDateTime);
    let daysChecked = 0;
    const maxDaysToCheck = 14; // Check up to 2 weeks ahead

    while (suggestions.length < count && daysChecked < maxDaysToCheck) {
        const dayOfWeek = currentDate.toLocaleDateString('pt-BR', { weekday: 'short' });
        const shifts = workingHours[dayOfWeek] || [];

        // For each shift on this day
        for (const shift of shifts) {
            const [startHour, startMin] = shift.start.split(':').map(Number);
            const [endHour] = shift.end.split(':').map(Number);

            // Try every hour in the shift
            for (let hour = startHour; hour < endHour && suggestions.length < count; hour++) {
                const testDate = new Date(currentDate);
                testDate.setHours(hour, 0, 0, 0);

                // Skip if in the past
                if (testDate <= new Date()) continue;

                // Validate this slot
                const validation = await validateSchedulingRules(organizationId, testDate);
                if (validation.valid) {
                    suggestions.push({
                        datetime: testDate,
                        formatted: `${testDate.toLocaleDateString('pt-BR')} às ${testDate.toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}`,
                    });
                }
            }

            if (suggestions.length >= count) break;
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(0, 0, 0, 0);
        daysChecked++;
    }

    return suggestions.slice(0, count);
}

/**
 * Get all available slots for a specific date
 */
export async function getAvailableSlotsForDate(
    organizationId: string,
    date: Date
): Promise<TimeSlot[]> {
    const org = await prisma.organization.findUnique({
        where: { id: organizationId },
    });

    if (!org) return [];

    const slots: TimeSlot[] = [];
    const workingHours = (org.workingHours as any) || {};
    const dayOfWeek = date.toLocaleDateString('pt-BR', { weekday: 'short' });
    const shifts = workingHours[dayOfWeek] || [];

    for (const shift of shifts) {
        const [startHour, startMin] = shift.start.split(':').map(Number);
        const [endHour] = shift.end.split(':').map(Number);

        for (let hour = startHour; hour < endHour; hour++) {
            const testDate = new Date(date);
            testDate.setHours(hour, 0, 0, 0);

            // Skip if in the past
            if (testDate <= new Date()) continue;

            const validation = await validateSchedulingRules(organizationId, testDate);
            if (validation.valid) {
                slots.push({
                    datetime: testDate,
                    formatted: testDate.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                    }),
                });
            }
        }
    }

    return slots;
}
