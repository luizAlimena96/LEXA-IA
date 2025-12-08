import OpenAI from 'openai';

export async function transcribeAudio(audioBase64: string, apiKey: string): Promise<string> {
    try {
        const openai = new OpenAI({ apiKey });
        const audioBuffer = Buffer.from(audioBase64, 'base64');

        // Convert Buffer to File-like object for OpenAI SDK
        const file = await OpenAI.toFile(audioBuffer, 'audio.ogg', {
            type: 'audio/ogg',
        });

        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: 'whisper-1',
            language: 'pt', // Force Portuguese for better accuracy
        });

        return transcription.text;
    } catch (error) {
        console.error('Error transcribing audio:', error);
        throw new Error('Falha na transcrição do áudio');
    }
}
