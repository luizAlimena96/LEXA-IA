import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { processMessage } from '@/app/services/aiService';
import {
    downloadAudioFromEvolution,
    speechToText,
    textToSpeech,
    sendAudioMessage,
} from '@/app/services/elevenLabsService';
import { sendMessage } from '@/app/services/evolutionService';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const event = body.event;

        if (event !== 'messages.upsert') {
            return NextResponse.json({ success: true });
        }

        const data = body.data;
        const messageData = data.message;
        const messageType = data.messageType;

        if (data.key.fromMe) {
            return NextResponse.json({ success: true });
        }
        const isAudio = messageType === 'audioMessage' || messageData.audioMessage;
        const isImage = messageType === 'imageMessage' || messageData.imageMessage;
        const isDocument = messageType === 'documentMessage' || messageData.documentMessage;
        const isText = messageData.conversation || messageData.extendedTextMessage;

        if (!isText && !isAudio && !isImage && !isDocument) {
            return NextResponse.json({ success: true });
        }

        const phone = data.key.remoteJid.replace('@s.whatsapp.net', '');
        const instanceName = body.instance;
        const messageId = data.key.id;

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

        let messageContent = '';

        if (isText) {
            messageContent = messageData.conversation || messageData.extendedTextMessage?.text || '';
        } else if (isAudio) {
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
            try {
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
            try {
                const docName = messageData.documentMessage?.fileName || 'documento';
                messageContent = `[Documento enviado: ${docName}]`;
                console.log('Document received:', docName);
            } catch (error) {
                console.error('Error processing document:', error);
                messageContent = '[Documento enviado]';
            }
        }

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

        const userMessage = await prisma.message.create({
            data: {
                conversationId: conversation.id,
                content: messageContent,
                fromMe: false,
                type: isAudio ? 'AUDIO' : isImage ? 'IMAGE' : isDocument ? 'DOCUMENT' : 'TEXT',
                messageId: messageId,
            },
        });

        // Emit SSE event for real-time updates
        const { messageEventEmitter } = await import('@/app/lib/eventEmitter');
        messageEventEmitter.emit(conversation.id, {
            type: 'new-message',
            message: {
                id: userMessage.id,
                content: userMessage.content,
                time: new Date(userMessage.timestamp).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                sent: false,
                read: true,
                role: 'user',
            },
        });

        const currentConversation = await prisma.conversation.findUnique({
            where: { id: conversation.id },
        });

        if (currentConversation?.aiEnabled === false) {
            console.log('🚫 IA desabilitada para esta conversa, pulando processamento');
            return NextResponse.json({ success: true, aiDisabled: true });
        }

        const { processAIControl, getAIDisabledMessage } = await import('@/app/services/aiControlService');
        const aiWasDisabled = await processAIControl(messageContent, conversation.id);

        if (aiWasDisabled) {
            const confirmationMessage = getAIDisabledMessage();

            await sendMessage({
                apiUrl: organization.evolutionApiUrl!,
                apiKey: organization.evolutionApiKey!,
                instanceName: instanceName
            }, phone, confirmationMessage);

            await prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    content: confirmationMessage,
                    fromMe: true,
                    type: 'TEXT',
                    messageId: crypto.randomUUID(),
                },
            });

            console.log('🚫 IA desligada para conversa:', conversation.id);
            return NextResponse.json({ success: true, aiDisabled: true });
        }

        const aiResponse = await processMessage({
            message: messageContent,
            conversationId: conversation.id,
            organizationId: organization.id,
        });

        const { extractAndUpdateLeadData, checkLeadDataComplete } = await import('@/app/services/leadDataExtraction');

        try {
            const extraction = await extractAndUpdateLeadData(lead.id, messageContent);

            if (extraction.updated) {
                console.log('✅ Lead data extracted:', extraction.extractedFields.join(', '));
            }

            const dataStatus = await checkLeadDataComplete(lead.id);

            if (dataStatus.complete) {
                const currentLead = await prisma.lead.findUnique({
                    where: { id: lead.id },
                    include: { organization: true },
                });

                if (currentLead?.currentState === 'ENVIO_CONTRATO' &&
                    !currentLead.zapSignDocumentId &&
                    currentLead.organization?.zapSignEnabled) {

                    console.log('🚀 Triggering automatic contract sending for lead:', lead.id);

                    const { sendContractToLead } = await import('@/app/services/zapSignService');

                    try {
                        const contractResult = await sendContractToLead(lead.id, organization.id);

                        if (contractResult.success) {
                            console.log('✅ Contract sent successfully:', contractResult.documentId);

                            await prisma.lead.update({
                                where: { id: lead.id },
                                data: { currentState: 'AGUARDANDO_ASSINATURA' },
                            });
                            await sendMessage({
                                apiUrl: organization.evolutionApiUrl!,
                                apiKey: organization.evolutionApiKey!,
                                instanceName: instanceName
                            }, phone, `✅ Contrato enviado com sucesso! Você receberá um link para assinatura digital em instantes. Qualquer dúvida, estou aqui para ajudar!`);
                        }
                    } catch (error) {
                        console.error('❌ Error sending contract:', error);
                    }
                }
            } else if (dataStatus.missingFields.length > 0) {
                console.log('⏳ Lead data incomplete. Missing:', dataStatus.missingFields.join(', '));
            }
        } catch (error) {
            console.error('Error in data extraction:', error);
        }

        if (isAudio) {
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
                await sendMessage({
                    apiUrl: organization.evolutionApiUrl!,
                    apiKey: organization.evolutionApiKey!,
                    instanceName: instanceName
                }, phone, aiResponse);
            }
        } else {
            await sendMessage({
                apiUrl: organization.evolutionApiUrl!,
                apiKey: organization.evolutionApiKey!,
                instanceName: instanceName
            }, phone, aiResponse);
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
