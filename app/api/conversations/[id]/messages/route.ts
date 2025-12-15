import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError } from '@/app/lib/errors';
// import { sendMediaMessage, sendDocument } from '@/app/services/evolutionService';
// import { sendAudioMessage } from '@/app/services/elevenLabsService';

// GET /api/conversations/[id]/messages - Get messages for a conversation
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Authentication handled by backend
        const { id: conversationId } = await params;

        // Verify conversation exists
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            select: { organizationId: true },
        });

        if (!conversation) {
            throw new ValidationError('Conversation not found');
        }

        const messages = await prisma.message.findMany({
            where: {
                conversationId,
            },
            orderBy: {
                timestamp: 'asc',
            },
        });

        return NextResponse.json(messages);
    } catch (error) {
        return handleError(error);
    }
}

// POST /api/conversations/[id]/messages - Send a message (text or media)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Authentication handled by backend
        const { id: conversationId } = await params;

        const contentType = request.headers.get('content-type') || '';

        // Handle FormData (media upload)
        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const file = formData.get('file') as File;
            const mediaType = formData.get('mediaType') as string;
            const caption = formData.get('caption') as string | null;

            if (!file || !mediaType) {
                throw new ValidationError('File and mediaType are required');
            }

            // Validate file type
            if (mediaType === 'document' && file.type !== 'application/pdf') {
                throw new ValidationError('Apenas PDF é aceito para documentos');
            }

            // Get conversation details
            const conversation = await prisma.conversation.findUnique({
                where: { id: conversationId },
                select: {
                    organizationId: true,
                    whatsapp: true,
                    organization: {
                        select: {
                            evolutionApiUrl: true,
                            evolutionApiKey: true,
                            evolutionInstanceName: true,
                        }
                    }
                },
            });

            if (!conversation) {
                throw new ValidationError('Conversation not found');
            }

            const { evolutionApiUrl, evolutionInstanceName } = conversation.organization || {};
            const evolutionApiKey = process.env.EVOLUTION_API_KEY;

            if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstanceName) {
                const missing = [];
                if (!evolutionApiUrl) missing.push('URL da API');
                if (!evolutionApiKey) missing.push('EVOLUTION_API_KEY no .env');
                if (!evolutionInstanceName) missing.push('Nome da Instância');
                throw new ValidationError(`Evolution API não configurada. Faltando: ${missing.join(', ')}. Configure na página de Clientes.`);
            }

            // Convert file to base64
            const buffer = Buffer.from(await file.arrayBuffer());
            const base64 = buffer.toString('base64');
            const phone = conversation.whatsapp;

            const config = {
                apiUrl: evolutionApiUrl,
                apiKey: evolutionApiKey,
                instanceName: evolutionInstanceName,
            };

            // TODO: Send media via Evolution API
            // Services not available in frontend, should be moved to backend
            /*
            if (mediaType === 'audio') {
                await sendAudioMessage(
                    phone,
                    buffer,
                    evolutionInstanceName,
                    evolutionApiUrl,
                    evolutionApiKey
                );
            } else if (mediaType === 'image' || mediaType === 'video') {
                await sendMediaMessage(
                    config,
                    phone,
                    base64,
                    mediaType as 'image' | 'video',
                    file.type,
                    caption || undefined
                );
            } else if (mediaType === 'document') {
                await sendDocument(
                    config,
                    phone,
                    base64,
                    file.name,
                    file.type
                );
            }
            */

            // Save message to database
            const message = await prisma.message.create({
                data: {
                    conversationId,
                    content: caption || `[${mediaType.toUpperCase()} enviado: ${file.name}]`,
                    fromMe: true,
                    type: mediaType.toUpperCase() as any,
                    messageId: crypto.randomUUID(),
                },
            });

            // Update conversation timestamp
            await prisma.conversation.update({
                where: { id: conversationId },
                data: { updatedAt: new Date() },
            });

            console.log(`[Messages API] ${mediaType} message saved to database (Evolution API call commented out)`);
            return NextResponse.json(message, { status: 201 });
        }

        // Handle JSON (text message)
        const body = await request.json();
        const { content, role } = body;

        if (!content || !role) {
            throw new ValidationError('Content and role are required');
        }

        // Verify conversation belongs to user's organization
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            select: {
                organizationId: true,
                whatsapp: true,
                organization: {
                    select: {
                        evolutionApiUrl: true,
                        evolutionApiKey: true,
                        evolutionInstanceName: true,
                    }
                }
            },
        });

        if (!conversation) {
            throw new ValidationError('Conversation not found');
        }

        const message = await prisma.message.create({
            data: {
                conversationId,
                content,
                fromMe: role === 'assistant',
                type: 'TEXT',
                messageId: crypto.randomUUID(),
            },
        });

        // Update conversation updatedAt
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        });

        // Send message via Evolution API if it's from assistant
        if (role === 'assistant' && conversation.organization?.evolutionApiUrl) {
            const { evolutionApiUrl, evolutionInstanceName } = conversation.organization;

            // Use global Evolution API key from environment
            const evolutionApiKey = process.env.EVOLUTION_API_KEY;

            // Validate Evolution API configuration
            if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstanceName) {
                console.error('❌ Evolution API configuration incomplete:', {
                    hasUrl: !!evolutionApiUrl,
                    hasKey: !!evolutionApiKey,
                    hasInstance: !!evolutionInstanceName,
                });
                throw new ValidationError(
                    'Evolution API não configurada. Verifique EVOLUTION_API_KEY no .env e URL/Instância na página de Clientes.'
                );
            }

            try {
                const evolutionUrl = `${evolutionApiUrl}/message/sendText/${evolutionInstanceName}`;
                console.log('📤 Sending message via Evolution API:', {
                    url: evolutionUrl,
                    instance: evolutionInstanceName,
                    to: conversation.whatsapp,
                    contentLength: content.length,
                });

                const response = await fetch(evolutionUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': evolutionApiKey,
                    },
                    body: JSON.stringify({
                        number: conversation.whatsapp,
                        text: content,
                    }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('❌ Evolution API error:', {
                        status: response.status,
                        statusText: response.statusText,
                        error: errorText,
                        url: evolutionUrl,
                    });
                    throw new Error(
                        `Erro ao enviar via WhatsApp (${response.status}): ${response.statusText}`
                    );
                }

                const responseData = await response.json();
                console.log('✅ Message sent via Evolution API:', responseData);
            } catch (error: any) {
                console.error('❌ Error sending message via Evolution:', {
                    error: error.message,
                    stack: error.stack,
                });

                // Throw error to prevent message from being saved as "sent"
                throw new Error(
                    error.message || 'Erro ao enviar mensagem via WhatsApp. Verifique a configuração da Evolution API.'
                );
            }
        }

        return NextResponse.json(message, { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}
