// AI Scheduling Handlers - Implementation of scheduling function tools

import { validateSchedulingRules, suggestAlternativeSlots } from './advancedSchedulingService';
import { createGoogleCalendarEventOrganization } from './googleCalendarService';
import { prisma } from '@/app/lib/prisma';

/**
 * Check if a specific date/time is available
 */
export async function handleCheckAvailability(args: any, organizationId: string) {
    try {
        const datetime = new Date(`${args.date}T${args.time}:00`);
        const result = await validateSchedulingRules(organizationId, datetime);

        if (result.valid) {
            return {
                available: true,
                message: `O horário ${args.date} às ${args.time} está disponível! Gostaria de confirmar o agendamento?`
            };
        } else {
            return {
                available: false,
                reason: result.reason,
                message: `Infelizmente ${result.reason}. Posso sugerir outros horários disponíveis?`
            };
        }
    } catch (error) {
        console.error('Error checking availability:', error);
        return {
            available: false,
            error: 'Erro ao verificar disponibilidade'
        };
    }
}

/**
 * Suggest 3 available time slots
 */
export async function handleSuggestSlots(args: any, organizationId: string) {
    try {
        const preferredDate = args.preferredDate
            ? new Date(args.preferredDate)
            : new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow

        const slots = await suggestAlternativeSlots(organizationId, preferredDate, 3);

        if (slots.length === 0) {
            return {
                success: false,
                message: 'Desculpe, não encontrei horários disponíveis nos próximos dias. Por favor, entre em contato diretamente.'
            };
        }

        const slotsList = slots.map((s, i) => `${i + 1}. ${s.formatted}`).join('\n');

        return {
            success: true,
            slots: slots.map(s => ({
                datetime: s.datetime.toISOString(),
                formatted: s.formatted
            })),
            message: `Aqui estão os próximos horários disponíveis:\n\n${slotsList}\n\nQual horário prefere?`
        };
    } catch (error) {
        console.error('Error suggesting slots:', error);
        return {
            success: false,
            error: 'Erro ao buscar horários disponíveis'
        };
    }
}

/**
 * Book a meeting
 */
export async function handleBookMeeting(
    args: any,
    organizationId: string,
    leadId: string,
    conversationId: string
) {
    try {
        const datetime = new Date(`${args.date}T${args.time}:00`);

        // 1. Validate availability
        const validation = await validateSchedulingRules(organizationId, datetime);
        if (!validation.valid) {
            return {
                success: false,
                error: validation.reason,
                message: `Não foi possível agendar: ${validation.reason}`
            };
        }

        // 2. Create appointment in database
        const appointment = await prisma.appointment.create({
            data: {
                title: `Reunião com ${args.leadName}`,
                scheduledAt: datetime,
                duration: 60, // Default 1 hour
                type: 'meeting',
                notes: args.notes || '',
                leadId,
                organizationId,
                source: 'AI',
                status: 'SCHEDULED'
            },
            include: {
                lead: true
            }
        });

        // 3. Create Google Calendar event
        const org = await prisma.organization.findUnique({
            where: { id: organizationId }
        });

        if (org?.googleCalendarEnabled) {
            const googleEvent = await createGoogleCalendarEventOrganization(organizationId, {
                summary: `Reunião com ${args.leadName}`,
                description: args.notes || '',
                start: datetime,
                end: new Date(datetime.getTime() + 60 * 60 * 1000),
                attendees: appointment.lead?.email ? [appointment.lead.email] : undefined
            });

            // Update appointment with Google Event ID
            if (googleEvent?.id) {
                await prisma.appointment.update({
                    where: { id: appointment.id },
                    data: { googleEventId: googleEvent.id }
                });
            }
        }

        // 4. Schedule reminders
        await scheduleAppointmentReminders(
            appointment.id,
            datetime,
            leadId,
            organizationId
        );

        const formattedDate = datetime.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const formattedTime = datetime.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        return {
            success: true,
            appointmentId: appointment.id,
            message: `✅ Reunião agendada com sucesso!\n\n📅 Data: ${formattedDate}\n🕐 Horário: ${formattedTime}\n\nVocê receberá lembretes antes da reunião. Até lá!`
        };
    } catch (error) {
        console.error('Error booking meeting:', error);
        return {
            success: false,
            error: 'Erro ao agendar reunião',
            message: 'Desculpe, ocorreu um erro ao agendar a reunião. Por favor, tente novamente.'
        };
    }
}

/**
 * Reschedule an existing meeting
 */
export async function handleRescheduleMeeting(args: any, organizationId: string) {
    try {
        const newDatetime = new Date(`${args.newDate}T${args.newTime}:00`);

        // 1. Validate new time
        const validation = await validateSchedulingRules(organizationId, newDatetime);
        if (!validation.valid) {
            return {
                success: false,
                error: validation.reason,
                message: `Não foi possível reagendar: ${validation.reason}`
            };
        }

        // 2. Get existing appointment
        const existingAppointment = await prisma.appointment.findUnique({
            where: { id: args.appointmentId },
            include: { lead: true }
        });

        if (!existingAppointment) {
            return {
                success: false,
                error: 'Agendamento não encontrado'
            };
        }

        // 3. Update appointment
        const appointment = await prisma.appointment.update({
            where: { id: args.appointmentId },
            data: {
                scheduledAt: newDatetime,
                rescheduledFrom: args.appointmentId,
                status: 'SCHEDULED'
            }
        });

        // 4. Update Google Calendar event
        if (existingAppointment.googleEventId) {
            const { updateGoogleCalendarEvent } = await import('./googleCalendarService');
            // Note: This function needs to be created for organization-level
            // For now, we'll delete and recreate
            const googleEvent = await createGoogleCalendarEventOrganization(organizationId, {
                summary: existingAppointment.title,
                description: existingAppointment.notes || '',
                start: newDatetime,
                end: new Date(newDatetime.getTime() + 60 * 60 * 1000),
                attendees: existingAppointment.lead?.email ? [existingAppointment.lead.email] : undefined
            });

            if (googleEvent?.id) {
                await prisma.appointment.update({
                    where: { id: appointment.id },
                    data: { googleEventId: googleEvent.id }
                });
            }
        }

        // 5. Cancel old reminders and schedule new ones
        await prisma.reminderLog.deleteMany({
            where: { appointmentId: args.appointmentId }
        });

        await scheduleAppointmentReminders(
            appointment.id,
            newDatetime,
            existingAppointment.leadId!,
            organizationId
        );

        const formattedDate = newDatetime.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const formattedTime = newDatetime.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        return {
            success: true,
            message: `✅ Reunião reagendada com sucesso!\n\n📅 Nova data: ${formattedDate}\n🕐 Novo horário: ${formattedTime}`
        };
    } catch (error) {
        console.error('Error rescheduling meeting:', error);
        return {
            success: false,
            error: 'Erro ao reagendar reunião'
        };
    }
}

/**
 * Cancel a meeting
 */
export async function handleCancelMeeting(args: any, organizationId: string) {
    try {
        // 1. Get appointment
        const appointment = await prisma.appointment.findUnique({
            where: { id: args.appointmentId }
        });

        if (!appointment) {
            return {
                success: false,
                error: 'Agendamento não encontrado'
            };
        }

        // 2. Update appointment status
        await prisma.appointment.update({
            where: { id: args.appointmentId },
            data: {
                status: 'CANCELLED',
                cancelReason: args.reason || 'Cancelado pelo lead'
            }
        });

        // 3. Delete Google Calendar event (if exists)
        // Note: Need to implement deleteGoogleCalendarEvent for organization

        // 4. Cancel reminders
        await prisma.reminderLog.updateMany({
            where: { appointmentId: args.appointmentId },
            data: { status: 'cancelled' }
        });

        return {
            success: true,
            message: '✅ Reunião cancelada com sucesso. Se precisar reagendar, é só me avisar!'
        };
    } catch (error) {
        console.error('Error cancelling meeting:', error);
        return {
            success: false,
            error: 'Erro ao cancelar reunião'
        };
    }
}

/**
 * List all appointments for a lead
 */
export async function handleListAppointments(leadId: string) {
    try {
        const appointments = await prisma.appointment.findMany({
            where: {
                leadId,
                status: {
                    in: ['SCHEDULED']
                },
                scheduledAt: {
                    gte: new Date() // Only future appointments
                }
            },
            orderBy: {
                scheduledAt: 'asc'
            }
        });

        if (appointments.length === 0) {
            return {
                success: true,
                appointments: [],
                message: 'Você não tem nenhuma reunião agendada no momento.'
            };
        }

        const appointmentsList = appointments.map((apt, i) => {
            const date = apt.scheduledAt.toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const time = apt.scheduledAt.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            return `${i + 1}. ${apt.title}\n   📅 ${date}\n   🕐 ${time}`;
        }).join('\n\n');

        return {
            success: true,
            appointments: appointments.map(apt => ({
                id: apt.id,
                title: apt.title,
                scheduledAt: apt.scheduledAt.toISOString(),
                notes: apt.notes
            })),
            message: `Suas reuniões agendadas:\n\n${appointmentsList}`
        };
    } catch (error) {
        console.error('Error listing appointments:', error);
        return {
            success: false,
            error: 'Erro ao listar agendamentos'
        };
    }
}

/**
 * Schedule appointment reminders
 */
async function scheduleAppointmentReminders(
    appointmentId: string,
    appointmentDateTime: Date,
    leadId: string,
    organizationId: string
) {
    try {
        // Get all active reminder templates
        const templates = await prisma.appointmentReminder.findMany({
            where: {
                organizationId,
                isActive: true
            }
        });

        // Get lead and organization data
        const lead = await prisma.lead.findUnique({
            where: { id: leadId }
        });

        const org = await prisma.organization.findUnique({
            where: { id: organizationId }
        });

        for (const template of templates) {
            const reminderTime = new Date(
                appointmentDateTime.getTime() - template.advanceHours * 60 * 60 * 1000
            );

            // Skip if reminder time is in the past
            if (reminderTime < new Date()) continue;

            let message = template.messageTemplate;

            // Replace variables based on recipient type
            if (template.recipientType === 'LEAD') {
                message = message
                    .replace(/\{\{lead\.name\}\}/g, lead?.name || 'Cliente')
                    .replace(/\{\{appointment\.date\}\}/g, appointmentDateTime.toLocaleDateString('pt-BR'))
                    .replace(/\{\{appointment\.time\}\}/g, appointmentDateTime.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                    }))
                    .replace(/\{\{appointment\.location\}\}/g, 'Online');
            } else {
                // CLIENT reminder
                message = message
                    .replace(/\{\{lead\.name\}\}/g, lead?.name || 'Cliente')
                    .replace(/\{\{lead\.phone\}\}/g, lead?.phone || '')
                    .replace(/\{\{appointment\.date\}\}/g, appointmentDateTime.toLocaleDateString('pt-BR'))
                    .replace(/\{\{appointment\.time\}\}/g, appointmentDateTime.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                    }));
            }

            // Create reminder log
            await prisma.reminderLog.create({
                data: {
                    appointmentId,
                    scheduledFor: reminderTime,
                    message,
                    status: 'pending'
                }
            });
        }

        console.log(`✅ Scheduled ${templates.length} reminders for appointment ${appointmentId}`);
    } catch (error) {
        console.error('Error scheduling reminders:', error);
    }
}
