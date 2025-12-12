import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { processMessage } from '@/app/services/aiService';
import {
    downloadAudioFromEvolution,
    textToSpeech,
    sendAudioMessage,
} from '@/app/services/elevenLabsService';
import { transcribeAudio } from '@/app/services/transcriptionService';
import { sendMessage } from '@/app/services/evolutionService';
import {
    analyzeImage,
    analyzeDocument,
    processVideo,
    getUnsupportedFormatMessage,
} from '@/app/services/mediaAnalysisService';
import {
    addToBuffer,
    getBuffer,
    clearBuffer,
    scheduleProcessing,
    combineMessages,
    isBufferingAvailable,
    type BufferedMessage,
} from '@/app/services/messageBufferService';
import { logger } from '@/app/lib/conditional-logger';


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
        const isVideo = messageType === 'videoMessage' || messageData.videoMessage;
        const isText = messageData.conversation || messageData.extendedTextMessage;

        if (!isText && !isAudio && !isImage && !isDocument && !isVideo) {
            return NextResponse.json({ success: true });
        }

        const phone = data.key.remoteJid.replace('@s.whatsapp.net', '');
        const instanceName = body.instance;
        const messageId = data.key.id;

        // ═══════════════════════════════════════════════════════════════════
        // OTIMIZAÇÃO CRÍTICA: 1 query ao invés de 5
        // Reduz latência de ~250ms para ~50ms
        // ═══════════════════════════════════════════════════════════════════
        const organization = await prisma.organization.findFirst({
            where: { evolutionInstanceName: instanceName },
            include: {
                agents: {
                    take: 1,
                    include: {
                        states: {
                            orderBy: { order: 'asc' },
                            take: 1
                        },
                        leads: {
                            where: {
                                OR: [
                                    { phone },
                                    { phoneWith9: phone },
                                    { phoneNo9: phone },
                                ]
                            },
                            take: 1,
                        }
                    }
                },
                conversations: {
                    where: { whatsapp: phone },
                    take: 1,
                }
            },
        });

        if (!organization || !organization.agents[0]) {
            console.error('Organization or agent not found for instance:', instanceName);
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }

        const agent = organization.agents[0];
        let lead = agent.leads?.[0];
        let conversation = organization.conversations?.[0];

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

                const audioBase64 = audioBuffer.toString('base64');
                messageContent = await transcribeAudio(audioBase64, organization.openaiApiKey!);
                logger.info('Audio transcribed:', messageContent);
            } catch (error) {
                console.error('Error processing audio:', error);
                messageContent = '[Áudio recebido - não foi possível transcrever]';
            }
        } else if (isImage) {
            try {
                // Download base64 from Evolution API
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

                // Use dedicated media analysis service
                const apiKey = organization.openaiApiKey || process.env.OPENAI_API_KEY!;
                const result = await analyzeImage(base64Image, apiKey);

                if (result.success) {
                    messageContent = `[ANÁLISE DA IMAGEM]: ${result.content}`;
                } else {
                    messageContent = '[Imagem enviada - não foi possível analisar]';
                }
                logger.info('[Webhook] Image analyzed via mediaAnalysisService');
            } catch (error) {
                console.error('Error processing image:', error);
                messageContent = '[Imagem enviada - não foi possível analisar]';
            }
        } else if (isDocument) {
            try {
                const docName = messageData.documentMessage?.fileName || 'documento';
                const mimeType = messageData.documentMessage?.mimetype;

                // Validate PDF - reject other formats
                if (mimeType !== 'application/pdf') {
                    messageContent = `[Documento enviado: ${docName}] - Formato não suportado`;

                    // Send unsupported format message immediately
                    await sendMessage({
                        apiUrl: organization.evolutionApiUrl!,
                        apiKey: organization.evolutionApiKey!,
                        instanceName: instanceName
                    }, phone, getUnsupportedFormatMessage());

                    logger.info('[Webhook] Unsupported document format:', mimeType);

                    // Still save the message to history
                    await prisma.message.create({
                        data: {
                            conversationId: 'temp', // Will be handled later
                            content: messageContent,
                            fromMe: false,
                            type: 'TEXT',
                            messageId: messageId,
                        },
                    }).catch(() => { }); // Ignore if fails

                    return NextResponse.json({ success: true });
                }

                // Download base64 from Evolution API
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
                const base64PDF = mediaData.base64;

                // Use dedicated media analysis service
                const apiKey = organization.openaiApiKey || process.env.OPENAI_API_KEY!;
                const result = await analyzeDocument(base64PDF, docName, mimeType, apiKey);

                if (result.success) {
                    messageContent = `[CONTEÚDO DO DOCUMENTO PDF: ${docName}]\n${result.content}`;
                    logger.info('[Webhook] PDF analyzed, content length:', result.content.length);
                } else {
                    messageContent = `[Documento PDF: ${docName}] - Não foi possível extrair`;
                }
            } catch (error) {
                console.error('Error processing document:', error);
                messageContent = '[Documento enviado - não foi possível processar]';
            }
        } else if (isVideo) {
            // Register video receipt (no content analysis)
            const result = processVideo();
            messageContent = `[${result.content}]`;
            logger.info('[Webhook] Video received');
        }

        // Create lead if doesn't exist (já foi buscado na query otimizada)
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

        // Create conversation if doesn't exist (já foi buscado na query otimizada)
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

        // Check AI enabled (conversation já foi buscada na query otimizada)
        if (conversation?.aiEnabled === false) {
            logger.info('🚫 IA desabilitada para esta conversa, pulando processamento');
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

            logger.info('🚫 IA desligada para conversa:', conversation.id);
            return NextResponse.json({ success: true, aiDisabled: true });
        }

        // ═══════════════════════════════════════════════════════════════════
        // MESSAGE BUFFER LOGIC - Humanize AI by collecting messages before responding
        // ═══════════════════════════════════════════════════════════════════

        const bufferEnabled = agent.messageBufferEnabled && await isBufferingAvailable();

        if (bufferEnabled) {
            logger.info(`[Buffer] Buffer enabled for agent. Delay: ${agent.messageBufferDelayMs}ms`);

            // Determine message type for buffer
            const msgType: BufferedMessage['type'] = isAudio ? 'AUDIO' : isImage ? 'IMAGE' : isDocument ? 'DOCUMENT' : isVideo ? 'VIDEO' : 'TEXT';

            // Add message to buffer
            await addToBuffer(phone, {
                content: messageContent,
                type: msgType,
                timestamp: Date.now(),
                messageId: messageId,
                audioTranscription: isAudio ? messageContent : undefined,
                imageAnalysis: isImage ? messageContent : undefined,
                documentContent: isDocument ? messageContent : undefined,
            });

            // Schedule processing with callback (timer-based only, no message limit)
            await scheduleProcessing(
                phone,
                agent.messageBufferDelayMs,
                async (bufferedMessages) => {
                    // This runs when timer expires
                    logger.info(`[Buffer] Processing ${bufferedMessages.length} messages for ${phone}`);

                    const combinedContent = combineMessages(bufferedMessages);
                    const hasAudio = bufferedMessages.some(m => m.type === 'AUDIO');

                    try {
                        const aiResult = await processMessage({
                            message: combinedContent,
                            conversationId: conversation.id,
                            organizationId: organization.id,
                        });

                        const aiResponse = aiResult.response;

                        // Extract lead data from combined message
                        const { extractAndUpdateLeadData, checkLeadDataComplete } = await import('@/app/services/leadDataExtraction');
                        try {
                            await extractAndUpdateLeadData(lead.id, combinedContent);
                        } catch (error) {
                            console.error('[Buffer] Error in data extraction:', error);
                        }

                        // Send response
                        // Check if audio responses are enabled (defaults to true if undefined)
                        const audioEnabled = agent.audioResponseEnabled !== false;

                        if (hasAudio && audioEnabled) {
                            // If any message was audio AND audio is enabled, respond with audio
                            try {
                                const audioResponse = await textToSpeech(aiResponse);
                                await sendAudioMessage(
                                    phone,
                                    audioResponse,
                                    instanceName,
                                    organization.evolutionApiUrl!,
                                    organization.evolutionApiKey!
                                );
                                logger.info('[Buffer] Audio response sent');
                            } catch (error) {
                                console.error('[Buffer] Error sending audio response:', error);
                            }
                        } else {
                            // Text response
                            await sendMessage({
                                apiUrl: organization.evolutionApiUrl!,
                                apiKey: organization.evolutionApiKey!,
                                instanceName: instanceName
                            }, phone, aiResponse);
                            logger.info('[Buffer] Text response sent');
                        }
                    } catch (error) {
                        console.error('[Buffer] Error processing buffered messages:', error);
                    }
                }
            );

            // Return immediately - processing will happen after delay
            return NextResponse.json({ success: true, buffered: true });
        }

        // ═══════════════════════════════════════════════════════════════════
        // IMMEDIATE PROCESSING (buffer disabled or unavailable)
        // ═══════════════════════════════════════════════════════════════════

        const aiResult = await processMessage({
            message: messageContent,
            conversationId: conversation.id,
            organizationId: organization.id,
        });

        const aiResponse = aiResult.response;

        const { extractAndUpdateLeadData, checkLeadDataComplete } = await import('@/app/services/leadDataExtraction');

        try {
            const extraction = await extractAndUpdateLeadData(lead.id, messageContent);

            if (extraction.updated) {
                logger.info('✅ Lead data extracted:', extraction.extractedFields.join(', '));
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

                    logger.info('🚀 Triggering automatic contract sending for lead:', lead.id);

                    const { sendContractToLead } = await import('@/app/services/zapSignService');

                    try {
                        const contractResult = await sendContractToLead(lead.id, organization.id);

                        if (contractResult.success) {
                            logger.info('✅ Contract sent successfully:', contractResult.documentId);

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
                logger.info('⏳ Lead data incomplete. Missing:', dataStatus.missingFields.join(', '));
            }
        } catch (error) {
            console.error('Error in data extraction:', error);
        }

        // Check if audio responses are enabled for immediate processing
        const audioEnabled = agent.audioResponseEnabled !== false;

        if (isAudio && audioEnabled) {
            // Audio messages: respond with ONLY audio (no text) - only if audio is enabled
            try {
                const audioResponse = await textToSpeech(aiResponse);

                await sendAudioMessage(
                    phone,
                    audioResponse,
                    instanceName,
                    organization.evolutionApiUrl!,
                    organization.evolutionApiKey!
                );

                logger.info('[Webhook] Audio response sent successfully (audio only, no text)');
            } catch (error) {
                console.error('Error sending audio response:', error);
                // Do NOT send text as fallback - user requested audio only
                logger.info('[Webhook] Audio response failed, NOT sending text fallback');
            }
        } else {
            // Non-audio messages: respond with text
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
