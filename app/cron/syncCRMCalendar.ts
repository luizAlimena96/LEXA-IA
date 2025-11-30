// Cron Job: CRM Calendar Sync
// Executa a cada 15 minutos para sincronizar eventos do CRM com Google Calendar

import cron from 'node-cron';
import { prisma } from '@/app/lib/prisma';
import { syncCRMCalendar, cleanupOldCRMEvents } from '@/app/services/crmCalendarSyncService';

// Executar a cada 15 minutos
cron.schedule('*/15 * * * *', async () => {
    console.log('[CRON] Iniciando sincronização CRM → Calendar');

    try {
        const orgs = await prisma.organization.findMany({
            where: { crmCalendarSyncEnabled: true },
            select: { id: true, name: true }
        });

        console.log(`[CRON] Encontradas ${orgs.length} organizações com sync habilitado`);

        for (const org of orgs) {
            try {
                await syncCRMCalendar(org.id);
                console.log(`[CRON] ✅ Sincronizado: ${org.name}`);
            } catch (error: any) {
                console.error(`[CRON] ❌ Erro em ${org.name}:`, error.message);
            }
        }

        console.log('[CRON] Sincronização completa');
    } catch (error) {
        console.error('[CRON] ❌ Erro geral:', error);
    }
});

// Limpeza de eventos antigos - executar diariamente às 3h da manhã
cron.schedule('0 3 * * *', async () => {
    console.log('[CRON] Iniciando limpeza de eventos antigos');

    try {
        const orgs = await prisma.organization.findMany({
            where: { crmCalendarSyncEnabled: true },
            select: { id: true, name: true }
        });

        let totalCleaned = 0;

        for (const org of orgs) {
            try {
                const cleaned = await cleanupOldCRMEvents(org.id);
                totalCleaned += cleaned;
            } catch (error) {
                console.error(`[CRON] Erro ao limpar ${org.name}:`, error);
            }
        }

        console.log(`[CRON] ✅ Limpeza completa: ${totalCleaned} eventos removidos`);
    } catch (error) {
        console.error('[CRON] ❌ Erro na limpeza:', error);
    }
});

console.log('[CRON] CRM Calendar Sync job iniciado');
console.log('[CRON] - Sincronização: a cada 15 minutos');
console.log('[CRON] - Limpeza: diariamente às 3h');
