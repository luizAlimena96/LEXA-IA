// Auto-Scheduling Service - Manage automatic appointment scheduling based on CRM stages

import { prisma } from '@/app/lib/prisma';

export interface AutoSchedulingConfig {
    id: string;
    agentId: string;
    crmStageId: string;
    duration: number;
    minAdvanceHours: number;
    preferredTime?: string | null;
    daysOfWeek: string[];
    messageTemplate: string;
    autoConfirm: boolean;
    moveToStageId?: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    crmStage?: {
        id: string;
        name: string;
        color: string;
    };
    moveToStage?: {
        id: string;
        name: string;
        color: string;
    } | null;
}

export interface CreateAutoSchedulingConfigInput {
    crmStageId: string;
    duration?: number;
    minAdvanceHours?: number;
    preferredTime?: string;
    daysOfWeek?: string[];
    messageTemplate: string;
    autoConfirm?: boolean;
    moveToStageId?: string;
}

export interface UpdateAutoSchedulingConfigInput {
    duration?: number;
    minAdvanceHours?: number;
    preferredTime?: string;
    daysOfWeek?: string[];
    messageTemplate?: string;
    autoConfirm?: boolean;
    moveToStageId?: string;
    isActive?: boolean;
}

export interface AvailableSlot {
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    datetime: Date;
}

/**
 * Get all auto-scheduling configs for an agent
 */
export async function getAutoSchedulingConfigs(agentId: string): Promise<AutoSchedulingConfig[]> {
    const configs = await prisma.autoSchedulingConfig.findMany({
        where: { agentId },
        include: {
            crmStage: {
                select: {
                    id: true,
                    name: true,
                    color: true,
                },
            },
            moveToStage: {
                select: {
                    id: true,
                    name: true,
                    color: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    return configs;
}

/**
 * Get a single auto-scheduling config
 */
export async function getAutoSchedulingConfig(
    agentId: string,
    configId: string
): Promise<AutoSchedulingConfig | null> {
    const config = await prisma.autoSchedulingConfig.findFirst({
        where: {
            id: configId,
            agentId,
        },
        include: {
            crmStage: {
                select: {
                    id: true,
                    name: true,
                    color: true,
                },
            },
            moveToStage: {
                select: {
                    id: true,
                    name: true,
                    color: true,
                },
            },
        },
    });

    return config;
}

/**
 * Create a new auto-scheduling config
 */
export async function createAutoSchedulingConfig(
    agentId: string,
    data: CreateAutoSchedulingConfigInput
): Promise<AutoSchedulingConfig> {
    const config = await prisma.autoSchedulingConfig.create({
        data: {
            agentId,
            crmStageId: data.crmStageId,
            duration: data.duration || 60,
            minAdvanceHours: data.minAdvanceHours || 2,
            preferredTime: data.preferredTime || null,
            daysOfWeek: data.daysOfWeek || ['MON', 'TUE', 'WED', 'THU', 'FRI'],
            messageTemplate: data.messageTemplate,
            autoConfirm: data.autoConfirm || false,
            moveToStageId: data.moveToStageId || null,
        },
        include: {
            crmStage: {
                select: {
                    id: true,
                    name: true,
                    color: true,
                },
            },
            moveToStage: {
                select: {
                    id: true,
                    name: true,
                    color: true,
                },
            },
        },
    });

    return config;
}

/**
 * Update an auto-scheduling config
 */
export async function updateAutoSchedulingConfig(
    agentId: string,
    configId: string,
    data: UpdateAutoSchedulingConfigInput
): Promise<AutoSchedulingConfig> {
    const config = await prisma.autoSchedulingConfig.update({
        where: {
            id: configId,
            agentId,
        },
        data,
        include: {
            crmStage: {
                select: {
                    id: true,
                    name: true,
                    color: true,
                },
            },
            moveToStage: {
                select: {
                    id: true,
                    name: true,
                    color: true,
                },
            },
        },
    });

    return config;
}

/**
 * Delete an auto-scheduling config
 */
export async function deleteAutoSchedulingConfig(agentId: string, configId: string): Promise<void> {
    await prisma.autoSchedulingConfig.delete({
        where: {
            id: configId,
            agentId,
        },
    });
}

/**
 * Get available time slots for scheduling
 */
export async function getAvailableSlots(
    agentId: string,
    config: AutoSchedulingConfig,
    limit: number = 3
): Promise<AvailableSlot[]> {
    const slots: AvailableSlot[] = [];
    const now = new Date();
    const minDate = new Date(now.getTime() + config.minAdvanceHours * 60 * 60 * 1000);

    // Get agent and organization details
    const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        include: {
            organization: {
                select: {
                    id: true,
                    workingHours: true,
                    googleCalendarEnabled: true,
                },
            },
        },
    });

    if (!agent) return slots;

    // Prioritize agent working hours, fallback to organization
    const workingShifts = (agent.workingHours || agent.organization.workingHours) as any;
    const daysOfWeek = config.daysOfWeek;

    // Map English day abbreviations to Portuguese keys used in workingHours
    const dayMap: Record<string, string> = {
        'SUN': 'dom',
        'MON': 'seg',
        'TUE': 'ter',
        'WED': 'qua',
        'THU': 'qui',
        'FRI': 'sex',
        'SAT': 'sab'
    };

    // Import Google Calendar check dynamically to avoid circular dependencies if any
    const { checkGoogleCalendarAvailability, checkGoogleCalendarAvailabilityOrganization } = await import('./googleCalendarService');

    // Generate slots for next 14 days
    for (let dayOffset = 0; dayOffset < 14 && slots.length < limit; dayOffset++) {
        const checkDate = new Date(minDate);
        checkDate.setDate(checkDate.getDate() + dayOffset);
        checkDate.setHours(0, 0, 0, 0);

        const dayName = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][checkDate.getDay()];
        const ptDay = dayMap[dayName];

        // Check if day is in allowed days for this config
        if (!daysOfWeek.includes(dayName)) continue;

        // Get working hours for this day using Portuguese key
        const dayShifts = workingShifts?.[ptDay] || [];
        if (!dayShifts || dayShifts.length === 0) continue;

        // For each shift, generate slots
        for (const shift of dayShifts) {
            if (!shift.start || !shift.end) continue;

            const [startHour, startMin] = shift.start.split(':').map(Number);
            const [endHour, endMin] = shift.end.split(':').map(Number);

            let currentTime = new Date(checkDate);
            currentTime.setHours(startHour, startMin, 0, 0);

            const endTime = new Date(checkDate);
            endTime.setHours(endHour, endMin, 0, 0);

            // Generate slots every hour
            while (currentTime < endTime && slots.length < limit) {
                // Check if slot is in the future
                if (currentTime > minDate) {
                    // Check preferred time
                    const hour = currentTime.getHours();
                    let matchesPreference = true;

                    if (config.preferredTime === 'morning' && hour >= 12) {
                        matchesPreference = false;
                    } else if (config.preferredTime === 'afternoon' && hour < 12) {
                        matchesPreference = false;
                    }

                    if (matchesPreference) {
                        const slotEnd = new Date(currentTime.getTime() + config.duration * 60000); // duration in minutes

                        // Check Google Calendar availability
                        let isAvailable = true;

                        if (agent.googleCalendarEnabled) {
                            isAvailable = await checkGoogleCalendarAvailability(agent.id, currentTime, slotEnd);
                        } else if (agent.organization.googleCalendarEnabled) {
                            isAvailable = await checkGoogleCalendarAvailabilityOrganization(agent.organization.id, currentTime, slotEnd);
                        }

                        if (isAvailable) {
                            const dateStr = currentTime.toISOString().split('T')[0];
                            const timeStr = `${String(currentTime.getHours()).padStart(2, '0')}:${String(
                                currentTime.getMinutes()
                            ).padStart(2, '0')}`;

                            slots.push({
                                date: dateStr,
                                time: timeStr,
                                datetime: new Date(currentTime),
                            });
                        }
                    }
                }

                // Move to next hour (or slot duration?)
                // Usually slots are fixed intervals (e.g. every hour or every 30 mins)
                // Here we iterate every hour. Could be improved to use config.duration step, but hourly is standard for now.
                currentTime.setHours(currentTime.getHours() + 1);
            }
        }
    }

    return slots.slice(0, limit);
}

/**
 * Format message template with slot data
 */
export function formatSchedulingMessage(
    template: string,
    slots: AvailableSlot[],
    leadData: any
): string {
    let message = template;

    // Replace lead variables
    message = message.replace(/\{\{lead\.name\}\}/g, leadData.name || 'Cliente');
    message = message.replace(/\{\{lead\.phone\}\}/g, leadData.phone || '');
    message = message.replace(/\{\{lead\.email\}\}/g, leadData.email || '');

    // Replace slot variables
    slots.forEach((slot, index) => {
        const slotNum = index + 1;
        const date = new Date(slot.datetime);
        const dateFormatted = date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
        });

        message = message.replace(new RegExp(`\\{\\{slot${slotNum}\\.date\\}\\}`, 'g'), dateFormatted);
        message = message.replace(new RegExp(`\\{\\{slot${slotNum}\\.time\\}\\}`, 'g'), slot.time);
    });

    return message;
}
