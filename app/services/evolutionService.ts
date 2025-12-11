// Evolution API Service
// Handles WhatsApp connection via Evolution API
import QRCode from 'qrcode';

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

interface CreateInstanceResponse {
    instance: {
        instanceName: string;
        status: string;
    };
}

// Helper function to build URLs without double slashes
function buildUrl(baseUrl: string, path: string): string {
    const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const endpoint = path.startsWith('/') ? path : `/${path}`;
    return `${base}${endpoint}`;
}

export async function createInstance(config: EvolutionConfig): Promise<{ existed: boolean }> {
    try {
        const url = buildUrl(config.apiUrl, '/instance/create');
        console.log('Creating Evolution API instance at:', url);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': config.apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                instanceName: config.instanceName,
                qrcode: true,
                integration: 'WHATSAPP-BAILEYS',
            }),
        });

        console.log('Create Instance Response Status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Create Instance Error Response:', errorText);

            const isConflict = response.status === 409;
            const isForbidden = response.status === 403;
            const isAlreadyInUse = errorText.includes('already exists') ||
                errorText.includes('already in use') ||
                errorText.includes('This name');

            if (isConflict || (isForbidden && isAlreadyInUse)) {
                console.log('Instance already exists (detected via status/message), continuing...');
                return { existed: true };
            }

            throw new Error(`Failed to create instance: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Instance created successfully:', data);
        return { existed: false };
    } catch (error) {
        console.error('Error creating instance:', error);
        throw error;
    }
}

export async function generateQRCode(config: EvolutionConfig): Promise<string> {
    try {
        const { existed } = await createInstance(config);

        const url = buildUrl(config.apiUrl, `/instance/connect/${config.instanceName}`);
        console.log('Attempting to generate QR Code at:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': config.apiKey,
            },
        });

        console.log('QR Code API Response Status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('QR Code API Error Response:', errorText);

            if (response.status === 401 && existed) {
                throw new Error('This name is already in use by another account (Unauthorized)');
            }

            throw new Error(`Failed to generate QR Code: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('QR Code API Response Data:', JSON.stringify(data, null, 2));

        const qrCode = data.qrcode || data.qr || data.code || data.base64 || '';

        if (!qrCode) {
            console.error('No QR code found in response. Available keys:', Object.keys(data));
            throw new Error('QR Code not found in API response');
        }

        // Ensure it's a proper data URI if it's a base64 string
        if (!qrCode.startsWith('http') && !qrCode.startsWith('data:')) {
            // If it's a pairing code (starts with 2@) or just raw data, convert to QR image
            if (qrCode.startsWith('2@') || !qrCode.match(/^[A-Za-z0-9+/=]+$/)) {
                try {
                    console.log('Converting raw pairing code to QR image...');
                    return await QRCode.toDataURL(qrCode);
                } catch (err) {
                    console.error('Error converting QR code to image:', err);
                    throw new Error('Failed to generate QR code image');
                }
            }
            return `data:image/png;base64,${qrCode}`;
        }

        return qrCode;
    } catch (error) {
        console.error('Error generating QR Code:', error);
        throw error;
    }
}

export async function checkConnectionStatus(config: EvolutionConfig): Promise<ConnectionStatus> {
    try {
        const response = await fetch(buildUrl(config.apiUrl, `/instance/connectionState/${config.instanceName}`), {
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
        await fetch(buildUrl(config.apiUrl, `/instance/logout/${config.instanceName}`), {
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

export async function sendMessage(config: EvolutionConfig, number: string, text: string): Promise<void> {
    try {
        const url = buildUrl(config.apiUrl, `/message/sendText/${config.instanceName}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': config.apiKey,
            },
            body: JSON.stringify({
                number,
                text,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to send message: ${response.status} - ${errorText}`);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
}

/**
 * Send media (image/video) via Evolution API
 */
export async function sendMediaMessage(
    config: EvolutionConfig,
    number: string,
    base64: string,
    mediaType: 'image' | 'video',
    mimeType: string,
    caption?: string
): Promise<void> {
    try {
        const url = buildUrl(config.apiUrl, `/message/sendMedia/${config.instanceName}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': config.apiKey,
            },
            body: JSON.stringify({
                number,
                mediatype: mediaType,
                mimetype: mimeType,
                media: `data:${mimeType};base64,${base64}`,
                caption,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to send media: ${response.status} - ${errorText}`);
        }

        console.log(`[Evolution API] ${mediaType} sent successfully`);
    } catch (error) {
        console.error('Error sending media:', error);
        throw error;
    }
}

/**
 * Send document (PDF) via Evolution API
 */
export async function sendDocument(
    config: EvolutionConfig,
    number: string,
    base64: string,
    fileName: string,
    mimeType: string
): Promise<void> {
    try {
        const url = buildUrl(config.apiUrl, `/message/sendMedia/${config.instanceName}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': config.apiKey,
            },
            body: JSON.stringify({
                number,
                mediatype: 'document',
                mimetype: mimeType,
                media: `data:${mimeType};base64,${base64}`,
                fileName,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to send document: ${response.status} - ${errorText}`);
        }

        console.log('[Evolution API] Document sent successfully:', fileName);
    } catch (error) {
        console.error('Error sending document:', error);
        throw error;
    }
}
