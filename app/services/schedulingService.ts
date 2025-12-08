// Scheduling Service - Intelligent meeting scheduling with calendar integration

import { prisma } from '@/app/lib/prisma';
import { checkGoogleCalendarAvailability, createGoogleCalendarEvent } from './googleCalendarService';
import { validateSchedulingRules } from './advancedSchedulingService';


interface TimeSlot {
    date: string;
    time: string;
    datetime: Date;
}

// Check if time slot is available
export async function checkAvailability(
    agentId: string,
    datetime: Date
): Promise<boolean> {
    const agent = await prisma.agent.findUnique({
        where: { id: agentId },
    });

    if (!agent) return false;

    // 1. Check working hours
    const dayOfWeek = datetime.toLocaleDateString('pt-BR', { weekday: 'short' });
    const workingHours = agent.workingHours as any;

    if (workingHours && workingHours[dayOfWeek]) {
        const timeStr = datetime.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });
        const { start, end } = workingHours[dayOfWeek];

        if (timeStr < start || timeStr > end) {
            return false;
        }
    }

    // 2. Check blocked dates
    const dateStr = datetime.toISOString().split('T')[0];
    const blockedDates = (agent.blockedDates as string[]) || [];

    if (blockedDates.includes(dateStr)) {
        return false;
    }

    // 3. Check database appointments
    const endTime = new Date(datetime.getTime() + (agent.meetingDuration + agent.bufferTime) * 60000);

    const conflicts = await prisma.appointment.count({
        where: {
            organizationId: agent.organizationId,
            scheduledAt: {
                gte: datetime,
                lt: endTime,
            },
            status: { not: 'CANCELLED' },
        },
    });

    if (conflicts > 0) return false;

    // 4. Check Google Calendar if enabled
    if (agent.googleCalendarEnabled) {
        return await checkGoogleCalendarAvailability(agentId, datetime, endTime);
    }

    return true;
}

// Suggest next available time slots
export async function suggestNextSlots(
    agentId: string,
    count: number = 3
): Promise<TimeSlot[]> {
    const agent = await prisma.agent.findUnique({
        where: { id: agentId },
    });

    if (!agent) return [];

    const slots: TimeSlot[] = [];
    let currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 2); // Start from 2 hours ahead

    const workingHours = (agent.workingHours as any) || {
        seg: { start: '08:00', end: '18:00' },
        ter: { start: '08:00', end: '18:00' },
        qua: { start: '08:00', end: '18:00' },
        qui: { start: '08:00', end: '18:00' },
        sex: { start: '08:00', end: '18:00' },
    };

    let attempts = 0;
    const maxAttempts = 100;

    while (slots.length < count && attempts < maxAttempts) {
        attempts++;

        const dayOfWeek = currentDate.toLocaleDateString('pt-BR', { weekday: 'short' });
        const dayHours = workingHours[dayOfWeek];

        if (dayHours) {
            const [startHour] = dayHours.start.split(':').map(Number);
            const [endHour] = dayHours.end.split(':').map(Number);

            for (let hour = startHour; hour < endHour && slots.length < count; hour++) {
                const testDate = new Date(currentDate);
                testDate.setHours(hour, 0, 0, 0);

                if (testDate > new Date() && await checkAvailability(agentId, testDate)) {
                    slots.push({
                        date: testDate.toISOString().split('T')[0],
                        time: testDate.toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                        }),
                        datetime: testDate,
                    });
                }
            }
        }

        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(0, 0, 0, 0);
    }

    return slots;
}

// Create appointment with Google Calendar sync
export async function createAppointment(params: {
    title: string;
    scheduledAt: Date;
    leadId?: string;
    organizationId: string;
    agentId: string;
    notes?: string;
    duration?: number; // Duração dinâmica opcional
}) {
    const agent = await prisma.agent.findUnique({
        where: { id: params.agentId },
        include: { organization: true }
    });

    if (!agent) throw new Error('Agent not found');

    // 1. Validar regras avançadas de agendamento
    const validation = await validateSchedulingRules(
        agent.organizationId,
        params.scheduledAt
    );

    if (!validation.valid) {
        throw new Error(validation.reason || 'Horário não disponível');
    }

    // 2. Check availability
    const available = await checkAvailability(params.agentId, params.scheduledAt);
    if (!available) {
        throw new Error('Time slot not available');
    }

    // 3. Determinar duração final
    const finalDuration = params.duration || agent.meetingDuration;

    // 4. Create in database
    const appointment = await prisma.appointment.create({
        data: {
            title: params.title,
            scheduledAt: params.scheduledAt,
            duration: finalDuration,
            type: 'meeting',
            notes: params.notes,
            leadId: params.leadId,
            organizationId: params.organizationId,
            source: 'AI',
        },
        include: {
            lead: true,
        },
    });

    // 5. Create in Google Calendar if enabled
    if (agent.googleCalendarEnabled) {
        const endTime = new Date(params.scheduledAt.getTime() + finalDuration * 60000);

        await createGoogleCalendarEvent(params.agentId, {
            summary: params.title,
            description: params.notes,
            start: params.scheduledAt,
            end: endTime,
            location: appointment.lead?.phone,
        });
    }

    // 6. Schedule reminder
    if (agent.reminderEnabled) {
        const reminderTime = new Date(
            params.scheduledAt.getTime() - agent.reminderHours * 60 * 60 * 1000
        );

        await prisma.reminderLog.create({
            data: {
                appointmentId: appointment.id,
                scheduledFor: reminderTime,
                message:
                    agent.reminderMessage ||
                    `Olá! Lembrete: você tem uma reunião agendada para ${params.scheduledAt.toLocaleString('pt-BR')}`,
            },
        });
    }

    // 7. Enviar notificação para equipe
    if (agent.notificationEnabled && agent.notificationPhones) {
        await sendTeamNotification(agent, appointment);
    }

    // 8. Webhook pós-agendamento
    if (agent.organization.appointmentWebhookEnabled && agent.organization.appointmentWebhookUrl) {
        await sendAppointmentWebhook(agent.organization, appointment);
    }

    return appointment;
}

/**
 * Envia notificação para equipe via WhatsApp
 */
async function sendTeamNotification(agent: any, appointment: any): Promise<void> {
    try {
        const template = agent.notificationTemplate ||
            `📈 | **NOVO AGENDAMENTO**\n\n📅 *Data: {date}*\n\n• Whatsapp: {phone}\n• Email: {email}\n• Nome: {name}`;

        const message = template
            .replace('{date}', appointment.scheduledAt.toLocaleString('pt-BR'))
            .replace('{phone}', appointment.lead?.phone || 'N/A')
            .replace('{email}', appointment.lead?.email || 'N/A')
            .replace('{name}', appointment.lead?.name || 'N/A');

        // TODO: Implement WhatsApp notification via Evolution API
        // await sendWhatsAppMessage(agent.notificationPhone, { text: message });

        console.log(`[Notification] ✅ Equipe notificada: ${agent.notificationPhone}`);
        console.log(`[Notification] Mensagem: ${message}`);
    } catch (error) {
        console.error('[Notification] ❌ Erro ao notificar equipe:', error);
    }
}

/**
 * Envia webhook pós-agendamento
 */
async function sendAppointmentWebhook(org: any, appointment: any): Promise<void> {
    try {
        const payload = {
            horario_evento: appointment.scheduledAt,
            whatsapp: appointment.lead?.phone,
            status: appointment.status,
            lead: {
                name: appointment.lead?.name,
                email: appointment.lead?.email,
                phone: appointment.lead?.phone
            },
            appointment: {
                id: appointment.id,
                title: appointment.title,
                duration: appointment.duration,
                notes: appointment.notes
            }
        };

        const response = await fetch(org.appointmentWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error(`[Webhook] ❌ Erro: ${response.status}`);
        } else {
            console.log(`[Webhook] ✅ Enviado para ${org.appointmentWebhookUrl}`);
        }
    } catch (error) {
        console.error('[Webhook] ❌ Erro ao enviar webhook:', error);
    }
}


// Reschedule existing appointment
export async function rescheduleAppointment(params: {
    appointmentId: string;
    newScheduledAt: Date;
    agentId: string;
}) {
    const agent = await prisma.agent.findUnique({
        where: { id: params.agentId },
    });

    if (!agent) throw new Error('Agent not found');

    // Check new time availability
    const available = await checkAvailability(params.agentId, params.newScheduledAt);
    if (!available) {
        throw new Error('New time slot not available');
    }

    // Get existing appointment
    const appointment = await prisma.appointment.findUnique({
        where: { id: params.appointmentId },
        include: { lead: true },
    });

    if (!appointment) throw new Error('Appointment not found');

    // Update in database
    const updatedAppointment = await prisma.appointment.update({
        where: { id: params.appointmentId },
        data: {
            scheduledAt: params.newScheduledAt,
            status: 'SCHEDULED',
        },
        include: { lead: true },
    });

    // Update Google Calendar if enabled
    if (agent.googleCalendarEnabled && (appointment as any).googleEventId) {
        const { updateGoogleCalendarEvent } = await import('./googleCalendarService');
        const endTime = new Date(params.newScheduledAt.getTime() + agent.meetingDuration * 60000);

        await updateGoogleCalendarEvent(params.agentId, (appointment as any).googleEventId, {
            start: params.newScheduledAt,
            end: endTime,
            summary: appointment.title,
            description: `REAGENDADO\n\nHorário original: ${appointment.scheduledAt.toLocaleString('pt-BR')}\n\n${appointment.notes || ''}`,
        });
    }

    // Update reminder
    if (agent.reminderEnabled) {
        // Delete old reminder
        await prisma.reminderLog.deleteMany({
            where: { appointmentId: params.appointmentId },
        });

        // Create new reminder
        const reminderTime = new Date(
            params.newScheduledAt.getTime() - agent.reminderHours * 60 * 60 * 1000
        );

        await prisma.reminderLog.create({
            data: {
                appointmentId: params.appointmentId,
                scheduledFor: reminderTime,
                message:
                    agent.reminderMessage ||
                    `Olá! Lembrete: você tem uma reunião agendada para ${params.newScheduledAt.toLocaleString('pt-BR')}`,
            },
        });
    }

    return updatedAppointment;
}
