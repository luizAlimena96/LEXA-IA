// CRM Calendar Sync Service - Sincroniza eventos do CRM com Google Calendar

import { prisma } from '@/app/lib/prisma';
import { createGoogleCalendarEvent } from './googleCalendarService';

interface CRMEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    duration: number; // minutos
    description?: string;
}

/**
 * Sincroniza calendário do CRM com Google Calendar e marca slots como bloqueados
 */
export async function syncCRMCalendar(organizationId: string): Promise<void> {
    const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: { agents: true }
    });

    if (!org?.crmCalendarSyncEnabled || !org.crmCalendarApiUrl) {
        console.log(`[CRM Sync] Org ${org?.name} não tem sync habilitado`);
        return;
    }

    console.log(`[CRM Sync] Iniciando sincronização para ${org.name}`);

    try {
        // 1. Buscar eventos do CRM
        const crmEvents = await fetchCRMEvents(org);
        console.log(`[CRM Sync] Encontrados ${crmEvents.length} eventos no CRM`);

        // 2. Para cada agente com Google Calendar habilitado
        for (const agent of org.agents) {
            if (!agent.googleCalendarEnabled) continue;

            console.log(`[CRM Sync] Sincronizando eventos para agente ${agent.name}`);

            for (const event of crmEvents) {
                // Verificar se já existe
                const existing = await prisma.appointment.findFirst({
                    where: {
                        crmEventId: event.id,
                        organizationId,
                    }
                });

                if (existing) {
                    console.log(`[CRM Sync] Evento ${event.id} já existe, pulando`);
                    continue;
                }

                // 3. Criar no Google Calendar
                try {
                    await createGoogleCalendarEvent(agent.id, {
                        start: event.start,
                        end: event.end,
                        summary: `[CRM] ${event.title}`,
                        description: event.description || `Sincronizado do CRM - ID: ${event.id}`
                    });
                } catch (error) {
                    console.error(`[CRM Sync] Erro ao criar evento no Google Calendar:`, error);
                }

                // 4. Marcar como bloqueado no sistema
                await prisma.appointment.create({
                    data: {
                        title: `[CRM] ${event.title}`,
                        scheduledAt: event.start,
                        duration: event.duration,
                        type: 'CRM_SYNC',
                        status: 'CRM_BLOCKED',
                        source: 'CRM_SYNC',
                        crmEventId: event.id,
                        crmSynced: true,
                        organizationId,
                        notes: event.description,
                    }
                });

                console.log(`[CRM Sync] ✅ Evento ${event.id} sincronizado`);
            }
        }

        console.log(`[CRM Sync] ✅ Sincronização completa para ${org.name}`);
    } catch (error) {
        console.error(`[CRM Sync] ❌ Erro na sincronização:`, error);
        throw error;
    }
}

/**
 * Busca eventos do CRM via API
 */
async function fetchCRMEvents(org: any): Promise<CRMEvent[]> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };

    // Adicionar autenticação baseada no tipo
    if (org.crmCalendarApiKey) {
        headers['Authorization'] = `Bearer ${org.crmCalendarApiKey}`;
    }

    try {
        const response = await fetch(org.crmCalendarApiUrl, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            throw new Error(`CRM API retornou status ${response.status}`);
        }

        const data = await response.json();

        // Normalizar formato baseado no tipo de CRM
        return normalizeCRMEvents(data, org.crmCalendarType);
    } catch (error) {
        console.error('[CRM Sync] Erro ao buscar eventos do CRM:', error);
        throw error;
    }
}

/**
 * Normaliza eventos de diferentes CRMs para formato padrão
 */
function normalizeCRMEvents(data: any, crmType?: string): CRMEvent[] {
    if (!data) return [];

    // DataCrazy format
    if (crmType === 'datacrazy') {
        return (data.events || []).map((e: any) => ({
            id: e.id || e.event_id,
            title: e.title || e.name || 'Evento CRM',
            start: new Date(e.start_time || e.start),
            end: new Date(e.end_time || e.end),
            duration: calculateDuration(e.start_time || e.start, e.end_time || e.end),
            description: e.description || e.notes
        }));
    }

    // RD Station format
    if (crmType === 'rdstation') {
        return (data.appointments || []).map((e: any) => ({
            id: e.uuid || e.id,
            title: e.title || 'Reunião',
            start: new Date(e.scheduled_to),
            end: new Date(e.scheduled_to_end || addMinutes(e.scheduled_to, 60)),
            duration: e.duration || 60,
            description: e.notes
        }));
    }

    // Custom/Generic format
    return (data.events || data.appointments || data).map((e: any) => ({
        id: e.id || e.event_id || String(Math.random()),
        title: e.title || e.summary || e.name || 'Evento',
        start: new Date(e.start || e.start_time || e.scheduledAt),
        end: new Date(e.end || e.end_time || e.scheduledEnd || addMinutes(e.start, 60)),
        duration: e.duration || calculateDuration(e.start, e.end) || 60,
        description: e.description || e.notes || e.details
    }));
}

/**
 * Calcula duração em minutos entre duas datas
 */
function calculateDuration(start: string | Date, end: string | Date): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.floor((endDate.getTime() - startDate.getTime()) / 60000);
}

/**
 * Adiciona minutos a uma data ISO string
 */
function addMinutes(dateStr: string, minutes: number): string {
    const date = new Date(dateStr);
    date.setMinutes(date.getMinutes() + minutes);
    return date.toISOString();
}

/**
 * Testa conexão com CRM
 */
export async function testCRMConnection(
    apiUrl: string,
    apiKey?: string
): Promise<{ success: boolean; message: string; eventsCount?: number }> {
    try {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            return {
                success: false,
                message: `Erro: API retornou status ${response.status}`
            };
        }

        const data = await response.json();
        const events = data.events || data.appointments || data || [];

        return {
            success: true,
            message: 'Conexão estabelecida com sucesso!',
            eventsCount: Array.isArray(events) ? events.length : 0
        };
    } catch (error: any) {
        return {
            success: false,
            message: `Erro ao conectar: ${error.message}`
        };
    }
}

/**
 * Remove eventos CRM antigos (mais de 30 dias no passado)
 */
export async function cleanupOldCRMEvents(organizationId: string): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.appointment.deleteMany({
        where: {
            organizationId,
            source: 'CRM_SYNC',
            scheduledAt: {
                lt: thirtyDaysAgo
            }
        }
    });

    console.log(`[CRM Sync] Removidos ${result.count} eventos antigos`);
    return result.count;
}
