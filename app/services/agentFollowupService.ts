import { prisma } from '@/app/lib/prisma';

export async function checkAgentFollowUps() {
    try {
        console.log('⏰ Checking for Agent Follow-up automations...');

        // ═══════════════════════════════════════════════════════════════════
        // OTIMIZAÇÃO CRÍTICA: Buscar organization junto com follow-ups
        // Elimina N+1 query problem (de 100+ queries para 1 query)
        // ═══════════════════════════════════════════════════════════════════
        const followUps = await prisma.agentFollowUp.findMany({
            where: {
                isActive: true,
            },
            include: {
                agent: {
                    include: {
                        organization: true, // OTIMIZAÇÃO: Buscar organization aqui
                    }
                },
                agentState: true,
                crmStage: true,
            } as any,
        }) as any[];

        console.log(`Found ${followUps.length} active follow-up rules`);

        let processedCount = 0;

        for (const followUp of followUps) {
            const whereClause: any = {
                agentId: followUp.agentId,
                organizationId: followUp.agent.organizationId,
            };

            if (followUp.agentStateId) {
                if (followUp.agentState) {
                    whereClause.OR = [
                        { currentState: followUp.agentState.name },
                        { currentState: followUp.agentState.id }
                    ];
                }
            } else if (followUp.crmStageId) {
                const statesInStage = await prisma.state.findMany({
                    where: { crmStageId: followUp.crmStageId },
                    select: { id: true, name: true }
                });

                if (statesInStage.length > 0) {
                    whereClause.OR = statesInStage.flatMap((state: { id: string; name: string }) => [
                        { currentState: state.name },
                        { currentState: state.id }
                    ]);
                } else {
                    continue;
                }
            } else {
                continue;
            }

            // ═══════════════════════════════════════════════════════════════════
            // OTIMIZAÇÃO: Buscar leads com conversations e messages em uma query
            // Reduz queries de 3 por lead para 1 query total
            // ═══════════════════════════════════════════════════════════════════
            const leads = await prisma.lead.findMany({
                where: whereClause,
                take: 100, // Limit to 100 leads per check to reduce CPU load
                orderBy: { updatedAt: 'desc' }, // Process most recently updated first
                include: {
                    conversations: {
                        orderBy: { updatedAt: 'desc' },
                        take: 1,
                        include: {
                            messages: {
                                where: { fromMe: false }, // OTIMIZAÇÃO: Filtrar aqui
                                orderBy: { timestamp: 'desc' },
                                take: 1,
                            }
                        }
                    }
                }
            });

            for (const lead of leads) {
                const conversation = lead.conversations[0];
                if (!conversation) continue;

                const lastUserMessage = conversation.messages[0]; // Já filtrado na query
                if (!lastUserMessage) continue;

                const minutesSinceLastUserMsg = (new Date().getTime() - new Date(lastUserMessage.timestamp).getTime()) / 60000;

                if (!followUp.delayMinutes) continue;

                if (minutesSinceLastUserMsg >= followUp.delayMinutes) {
                    const alreadyExecuted = await prisma.automationLog.findFirst({
                        where: {
                            conversationId: conversation.id,
                            leadMessageId: lastUserMessage.id,
                            agentFollowUpId: followUp.id
                        }
                    });

                    if (!alreadyExecuted) {
                        console.log(`🚀 Triggering follow-up for lead ${lead.phone}`);

                        let message = followUp.messageTemplate;
                        message = message.replace(/{{lead.name}}/g, lead.name || '')
                            .replace(/{{lead.phone}}/g, lead.phone || '')
                            .replace(/{{lead.email}}/g, lead.email || '')
                            .replace(/{{lead.currentState}}/g, lead.currentState || '');

                        // OTIMIZAÇÃO: Organization já foi buscada no include
                        const organization = followUp.agent.organization;

                        if (!organization?.evolutionApiUrl || !organization?.evolutionApiKey || !organization?.evolutionInstanceName) {
                            console.error(`❌ Missing Evolution API configuration for organization ${followUp.agent.organizationId}`);
                            continue;
                        }

                        const { sendMessage: sendEvolutionMessage } = await import('./evolutionService');

                        try {
                            await sendEvolutionMessage({
                                apiUrl: organization.evolutionApiUrl,
                                apiKey: organization.evolutionApiKey,
                                instanceName: organization.evolutionInstanceName
                            }, lead.phone, message);

                            console.log(`📱 Sent WhatsApp message to ${lead.phone}`);

                            const sentMessage = await prisma.message.create({
                                data: {
                                    conversationId: conversation.id,
                                    content: message,
                                    fromMe: true,
                                    type: 'TEXT',
                                    messageId: crypto.randomUUID(),
                                },
                            });

                            const { messageEventEmitter } = await import('@/app/lib/eventEmitter');
                            messageEventEmitter.emit(conversation.id, {
                                type: 'new-message',
                                message: {
                                    id: sentMessage.id,
                                    content: sentMessage.content,
                                    time: new Date(sentMessage.timestamp).toLocaleTimeString('pt-BR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }),
                                    sent: true,
                                    read: false,
                                    role: 'assistant',
                                },
                            });

                            await prisma.automationLog.create({
                                data: {
                                    agentFollowUpId: followUp.id,
                                    conversationId: conversation.id,
                                    leadMessageId: lastUserMessage.id,
                                }
                            });

                            processedCount++;
                        } catch (error) {
                            console.error(`❌ Error sending follow-up to ${lead.phone}:`, error);
                            // Continue com próximo lead mesmo se houver erro
                        }
                    }
                }
            }
        }

        console.log(`✅ Processed ${processedCount} follow-ups`);
        return processedCount;
    } catch (error) {
        console.error('Error in checkAgentFollowUps:', error);
        throw error;
    }
}
