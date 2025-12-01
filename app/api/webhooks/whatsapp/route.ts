import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { processMessage } from '@/app/services/aiService';
import {
    downloadAudioFromEvolution,
    speechToText,
    textToSpeech,
    sendAudioMessage,
} from '@/app/services/elevenLabsService';

// Webhook to receive messages from Evolution API
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Evolution API sends different event types
        const event = body.event;

        // Only process incoming messages
        if (event !== 'messages.upsert') {
            return NextResponse.json({ success: true });
        }

        const data = body.data;
        const messageData = data.message;
        const messageType = data.messageType;

        // Skip if sent by us
        if (data.key.fromMe) {
            return NextResponse.json({ success: true });
        }

        // Detect message type
        const isAudio = messageType === 'audioMessage' || messageData.audioMessage;
        const isImage = messageType === 'imageMessage' || messageData.imageMessage;
        const isDocument = messageType === 'documentMessage' || messageData.documentMessage;
        const isText = messageData.conversation || messageData.extendedTextMessage;

        // Skip if not supported type
        if (!isText && !isAudio && !isImage && !isDocument) {
            return NextResponse.json({ success: true });
        }

        const phone = data.key.remoteJid.replace('@s.whatsapp.net', '');
        const instanceName = body.instance;
        const messageId = data.key.id;

        // Find organization by instance name
        const organization = await prisma.organization.findFirst({
            where: { evolutionInstanceName: instanceName },
            include: {
                agents: {
                    take: 1,
                    include: {
                        states: {
                            orderBy: { order: 'asc' },
                            take: 1
                        }
                    }
                },
            },
        });

        if (!organization || !organization.agents[0]) {
            console.error('Organization or agent not found for instance:', instanceName);
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }

        const agent = organization.agents[0];

        // Extract message content based on type
        let messageContent = '';

        if (isText) {
            messageContent = messageData.conversation || messageData.extendedTextMessage?.text || '';
        } else if (isAudio) {
            // Process audio message
            try {
                const audioBuffer = await downloadAudioFromEvolution(
                    messageId,
                    instanceName,
                    organization.evolutionApiUrl!,
                    organization.evolutionApiKey!
                );

                messageContent = await speechToText(audioBuffer);
                console.log('Audio transcribed:', messageContent);
            } catch (error) {
                console.error('Error processing audio:', error);
                messageContent = '[Áudio recebido - não foi possível transcrever]';
            }
        } else if (isImage) {
            // Process image message
            try {
                // Download image from Evolution API
                const response = await fetch(
                    `${organization.evolutionApiUrl}/chat/getBase64FromMediaMessage/${instanceName}`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            apikey: organization.evolutionApiKey!,
                        },
                        body: JSON.stringify({
                            'message.key.id': messageId,
                            convertToMp4: false,
                        }),
                    }
                );

                const mediaData = await response.json();
                const base64Image = mediaData.base64;

                // Analyze image with GPT-4 Vision
                const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    {
                                        type: 'text',
                                        text: 'Analise, entenda e descreva detalhadamente esta imagem:',
                                    },
                                    {
                                        type: 'image_url',
                                        image_url: {
                                            url: `data:image/jpeg;base64,${base64Image}`,
                                        },
                                    },
                                ],
                            },
                        ],
                        max_tokens: 500,
                    }),
                });

                const openaiData = await openaiResponse.json();
                const imageDescription = openaiData.choices[0].message.content;
                messageContent = `[Imagem enviada] ${imageDescription}`;
                console.log('Image analyzed:', imageDescription);
            } catch (error) {
                console.error('Error processing image:', error);
                messageContent = '[Imagem enviada - não foi possível analisar]';
            }
        } else if (isDocument) {
            // Process document message
            try {
                const docName = messageData.documentMessage?.fileName || 'documento';
                messageContent = `[Documento enviado: ${docName}]`;
                console.log('Document received:', docName);
            } catch (error) {
                console.error('Error processing document:', error);
                messageContent = '[Documento enviado]';
            }
        }

        // Find or create lead
        let lead = await prisma.lead.findFirst({
            where: {
                OR: [
                    { phone },
                    { phoneWith9: phone },
                    { phoneNo9: phone },
                ],
                organizationId: organization.id,
            },
        });

        if (!lead) {
            lead = await prisma.lead.create({
                data: {
                    phone,
                    phoneWith9: phone.length === 13 ? phone : null,
                    phoneNo9: phone.length === 12 ? phone : null,
                    status: 'NEW',
                    currentState: agent.states?.[0]?.name || 'INICIO',
                    agentId: agent.id,
                    organizationId: organization.id,
                },
            });
        }

        // Find or create conversation
        let conversation = await prisma.conversation.findFirst({
            where: {
                whatsapp: phone,
                organizationId: organization.id,
            },
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    whatsapp: phone,
                    leadId: lead.id,
                    agentId: agent.id,
                    organizationId: organization.id,
                },
            });
        }

        // Save user message
        await prisma.message.create({
            data: {
                conversationId: conversation.id,
                content: messageContent,
                fromMe: false,
                type: isAudio ? 'AUDIO' : isImage ? 'IMAGE' : isDocument ? 'DOCUMENT' : 'TEXT',
                messageId: messageId,
            },
        });

        // Process with AI
        const aiResponse = await processMessage({
            message: messageContent,
            conversationId: conversation.id,
            organizationId: organization.id,
        });

        // Send response
        if (isAudio) {
            // Generate audio response
            try {
                const audioResponse = await textToSpeech(aiResponse);

                await sendAudioMessage(
                    phone,
                    audioResponse,
                    instanceName,
                    organization.evolutionApiUrl!,
                    organization.evolutionApiKey!
                );
            } catch (error) {
                console.error('Error sending audio response:', error);
                // Fallback to text if audio fails
                await fetch(
                    `${organization.evolutionApiUrl}/message/sendText/${instanceName}`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            apikey: organization.evolutionApiKey!,
                        },
                        body: JSON.stringify({
                            number: phone,
                            text: aiResponse,
                        }),
                    }
                );
            }
        } else {
            // Send text response
            await fetch(
                `${organization.evolutionApiUrl}/message/sendText/${instanceName}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        apikey: organization.evolutionApiKey!,
                    },
                    body: JSON.stringify({
                        number: phone,
                        text: aiResponse,
                    }),
                }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
