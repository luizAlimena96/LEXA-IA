// WhatsApp Connection Monitoring Job
// Checks all organizations' WhatsApp connections and sends alerts on disconnection

import { checkAllConnections } from '@/app/services/whatsappMonitoringService';

export async function processWhatsAppMonitoring() {
    console.log('[WhatsApp Monitoring Job] Starting connection check...');

    try {
        const result = await checkAllConnections();

        console.log('[WhatsApp Monitoring Job] ✅ Check complete:', result);

        return result;
    } catch (error) {
        console.error('[WhatsApp Monitoring Job] ❌ Error:', error);
        throw error;
    }
}
