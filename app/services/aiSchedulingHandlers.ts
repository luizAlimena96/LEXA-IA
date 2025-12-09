import { validateSchedulingRules, suggestAlternativeSlots } from './advancedSchedulingService';
import { createGoogleCalendarEventOrganization, updateGoogleCalendarEventOrganization, deleteGoogleCalendarEventOrganization } from './googleCalendarService';
import { prisma } from '@/app/lib/prisma';


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

export async function handleBookMeeting(
    args: any,
    organizationId: string,
    leadId: string,
    conversationId: string
) {
    try {
        const datetime = new Date(`${args.date}T${args.time}:00`);

        const validation = await validateSchedulingRules(organizationId, datetime);
        if (!validation.valid) {
            return {
                success: false,
                error: validation.reason,
                message: `Não foi possível agendar: ${validation.reason}`
            };
        }

        const appointment = await prisma.appointment.create({
            data: {
                title: `Reunião com ${args.leadName}`,
                scheduledAt: datetime,
                duration: 60,
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

            if (googleEvent?.id) {
                await prisma.appointment.update({
                    where: { id: appointment.id },
                    data: { googleEventId: googleEvent.id }
                });
            }
        }

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



export async function handleListAppointments(leadId: string) {
    try {
        const appointments = await prisma.appointment.findMany({
            where: {
                leadId,
                status: {
                    in: ['SCHEDULED']
                },
                scheduledAt: {
                    gte: new Date()
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

        const appointmentsList = appointments.map((apt: { id: string; title: string; scheduledAt: Date; notes: string | null }, i: number) => {
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
            appointments: appointments.map((apt: { id: string; title: string; scheduledAt: Date; notes: string | null }) => ({
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


async function scheduleAppointmentReminders(
    appointmentId: string,
    appointmentDateTime: Date,
    leadId: string,
    organizationId: string
) {
    try {
        const templates = await prisma.appointmentReminder.findMany({
            where: {
                appointment: {
                    organizationId
                }
            }
        });

        const lead = await prisma.lead.findUnique({
            where: { id: leadId }
        });

        const org = await prisma.organization.findUnique({
            where: { id: organizationId }
        });

        for (const template of templates) {
            // Calculate reminder time based on minutesBefore
            const reminderTime = new Date(
                appointmentDateTime.getTime() - template.minutesBefore * 60 * 1000
            );

            if (reminderTime < new Date()) continue;

            // Use leadMessageTemplate or teamMessageTemplate based on sendToLead/sendToTeam
            let message = template.sendToLead ? template.leadMessageTemplate : (template.teamMessageTemplate || template.leadMessageTemplate);

            // Replace template variables
            message = message
                .replace(/\{\{lead\.name\}\}/g, lead?.name || 'Cliente')
                .replace(/\{\{lead\.phone\}\}/g, lead?.phone || '')
                .replace(/\{\{appointment\.date\}\}/g, appointmentDateTime.toLocaleDateString('pt-BR'))
                .replace(/\{\{appointment\.time\}\}/g, appointmentDateTime.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                }))
                .replace(/\{\{appointment\.location\}\}/g, 'Online');

            await prisma.appointmentReminder.create({
                data: {
                    appointmentId,
                    scheduledFor: reminderTime,
                    minutesBefore: template.minutesBefore,
                    sendToLead: template.sendToLead,
                    sendToTeam: template.sendToTeam,
                    leadMessageTemplate: template.leadMessageTemplate,
                    teamMessageTemplate: template.teamMessageTemplate,
                    teamPhones: template.teamPhones || [],
                    sent: false
                }
            });
        }

        console.log(`✅ Scheduled ${templates.length} reminders for appointment ${appointmentId}`);
    } catch (error) {
        console.error('Error scheduling reminders:', error);
    }
}

export async function handleCancelMeeting(
    args: any,
    organizationId: string,
    leadId: string,
    conversationId: string
) {
    try {
        const appointment = await prisma.appointment.findFirst({
            where: {
                organizationId,
                leadId,
                status: 'SCHEDULED',
                scheduledAt: { gte: new Date() }
            },
            orderBy: { scheduledAt: 'asc' }
        });

        if (!appointment) {
            return {
                success: false,
                error: 'No upcoming appointment found',
                message: 'Não encontrei nenhum agendamento futuro para cancelar.'
            };
        }

        if (appointment.googleEventId) {
            await deleteGoogleCalendarEventOrganization(organizationId, appointment.googleEventId);
        }
        await prisma.appointment.update({
            where: { id: appointment.id },
            data: { status: 'CANCELLED' }
        });

        return {
            success: true,
            data: { appointmentId: appointment.id },
            message: `Agendamento de ${appointment.scheduledAt.toLocaleDateString('pt-BR')} cancelado com sucesso.`
        };
    } catch (error) {
        console.error('Error cancelling meeting:', error);
        return {
            success: false,
            error: 'Internal error',
            message: 'Erro ao cancelar o agendamento.'
        };
    }
}

export async function handleRescheduleMeeting(
    args: any,
    organizationId: string,
    leadId: string
) {
    try {
        const datetime = new Date(`${args.date}T${args.time}:00`);

        const validation = await validateSchedulingRules(organizationId, datetime);
        if (!validation.valid) {
            return {
                success: false,
                error: validation.reason,
                message: `Não é possível reagendar para este horário: ${validation.reason}`
            };
        }

        const appointment = await prisma.appointment.findFirst({
            where: {
                organizationId,
                leadId,
                status: 'SCHEDULED',
                scheduledAt: { gte: new Date() }
            },
            orderBy: { scheduledAt: 'asc' }
        });

        if (!appointment) {
            return {
                success: false,
                error: 'No appointment to reschedule',
                message: 'Não encontrei um agendamento anterior para reagendar. Quer marcar um novo?'
            };
        }

        if (appointment.googleEventId) {
            await updateGoogleCalendarEventOrganization(
                organizationId,
                appointment.googleEventId,
                {
                    start: datetime,
                    end: new Date(datetime.getTime() + appointment.duration * 60000)
                }
            );
        }

        await prisma.appointment.update({
            where: { id: appointment.id },
            data: {
                scheduledAt: datetime,
                status: 'SCHEDULED'
            }
        });

        return {
            success: true,
            data: { appointmentId: appointment.id },
            message: `Agendamento reagendado com sucesso para ${datetime.toLocaleDateString('pt-BR')} às ${datetime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`
        };

    } catch (error) {
        console.error('Error rescheduling meeting:', error);
        return {
            success: false,
            error: 'Internal error',
            message: 'Erro ao reagendar o compromisso.'
        };
    }
}
