// Evolution API Service
// Handles WhatsApp connection via Evolution API

interface EvolutionConfig {
    apiUrl: string;
    apiKey: string;
    instanceName: string;
}

interface QRCodeResponse {
    qrCode: string;
    status: 'pending' | 'connected' | 'error';
}

interface ConnectionStatus {
    connected: boolean;
    phone?: string;
    connectedAt?: Date;
}

export async function generateQRCode(config: EvolutionConfig): Promise<string> {
    try {
        const response = await fetch(`${config.apiUrl}/instance/connect/${config.instanceName}`, {
            method: 'GET',
            headers: {
                'apikey': config.apiKey,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to generate QR Code');
        }

        const data = await response.json();
        return data.qrcode || data.qr || '';
    } catch (error) {
        console.error('Error generating QR Code:', error);
        throw error;
    }
}

export async function checkConnectionStatus(config: EvolutionConfig): Promise<ConnectionStatus> {
    try {
        const response = await fetch(`${config.apiUrl}/instance/connectionState/${config.instanceName}`, {
            method: 'GET',
            headers: {
                'apikey': config.apiKey,
            },
        });

        if (!response.ok) {
            return { connected: false };
        }

        const data = await response.json();

        return {
            connected: data.state === 'open' || data.instance?.state === 'open',
            phone: data.instance?.phoneNumber,
        };
    } catch (error) {
        console.error('Error checking connection status:', error);
        return { connected: false };
    }
}

export async function disconnectInstance(config: EvolutionConfig): Promise<void> {
    try {
        await fetch(`${config.apiUrl}/instance/logout/${config.instanceName}`, {
            method: 'DELETE',
            headers: {
                'apikey': config.apiKey,
            },
        });
    } catch (error) {
        console.error('Error disconnecting instance:', error);
        throw error;
    }
}
