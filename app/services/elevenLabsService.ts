// ElevenLabs Service - Audio processing (Speech-to-Text + Text-to-Speech)

import { ElevenLabsClient } from 'elevenlabs';

// Text-to-Speech - Gerar áudio a partir de texto
export async function textToSpeech(
    text: string,
    voiceId?: string,
    apiKey?: string
): Promise<Buffer> {
    try {
        const client = new ElevenLabsClient({
            apiKey: apiKey || process.env.ELEVENLABS_API_KEY || 'dummy-key-for-build',
        });

        const voice = voiceId || process.env.ELEVENLABS_VOICE_ID || 'Rachel';

        const audio = await client.generate({
            voice,
            text,
            model_id: 'eleven_multilingual_v2',
        });

        // Convert stream to buffer
        const chunks: Buffer[] = [];
        for await (const chunk of audio) {
            chunks.push(chunk);
        }

        return Buffer.concat(chunks);
    } catch (error) {
        console.error('Error generating speech:', error);
        throw error;
    }
}

// Get available voices
export async function getVoices() {
    try {
        const client = new ElevenLabsClient({
            apiKey: process.env.ELEVENLABS_API_KEY || 'dummy-key-for-build',
        });
        const voices = await client.voices.getAll();
        return voices.voices;
    } catch (error) {
        console.error('Error fetching voices:', error);
        return [];
    }
}

// Download audio from Evolution API
export async function downloadAudioFromEvolution(
    messageId: string,
    instanceName: string,
    evolutionApiUrl: string,
    evolutionApiKey: string
): Promise<Buffer> {
    try {
        const response = await fetch(
            `${evolutionApiUrl}/chat/getBase64FromMediaMessage/${instanceName}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    apikey: evolutionApiKey,
                },
                body: JSON.stringify({
                    'message.key.id': messageId,
                    convertToMp4: false,
                }),
            }
        );

        const data = await response.json();
        const base64Audio = data.base64;

        return Buffer.from(base64Audio, 'base64');
    } catch (error) {
        console.error('Error downloading audio:', error);
        throw error;
    }
}

// Send audio message via Evolution API
export async function sendAudioMessage(
    phone: string,
    audioBuffer: Buffer,
    instanceName: string,
    evolutionApiUrl: string,
    evolutionApiKey: string
) {
    try {
        const base64Audio = audioBuffer.toString('base64');

        await fetch(`${evolutionApiUrl}/message/sendWhatsAppAudio/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: evolutionApiKey,
            },
            body: JSON.stringify({
                number: phone,
                audioBase64: base64Audio,
            }),
        });
    } catch (error) {
        console.error('Error sending audio message:', error);
        throw error;
    }
}
