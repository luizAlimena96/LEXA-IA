import { prisma } from '@/app/lib/prisma';
import { sendMessage } from './whatsappService';

export async function checkAgentFollowUps() {
    try {
        console.log('⏰ Checking for Agent Follow-up automations...');

        // 1. Find active AgentFollowUp rules
        const followUps = await prisma.agentFollowUp.findMany({
            where: {
                isActive: true,
            },
            include: {
                agent: true,
                agentState: true,
                matrixItem: true,
            },
        });

        console.log(`Found ${followUps.length} active follow-up rules`);

        let processedCount = 0;

        for (const followUp of followUps) {
            // 2. Find leads in the target state for this agent
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
            } else if (followUp.matrixItemId) {
                if (followUp.matrixItem) {
                    whereClause.OR = [
                        { currentState: followUp.matrixItem.title },
                        { currentState: followUp.matrixItem.id }
                    ];
                }
            } else {
                continue; // No state defined
            }

            // Fetch leads
            const leads = await prisma.lead.findMany({
                where: whereClause,
                include: {
                    conversations: {
                        orderBy: { updatedAt: 'desc' },
                        take: 1,
                        include: {
                            messages: {
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

                // Check last message from LEAD
                const lastUserMessage = await prisma.message.findFirst({
                    where: {
                        conversationId: conversation.id,
                        fromMe: false, // Message from Lead
                    },
                    orderBy: { timestamp: 'desc' },
                });

                if (!lastUserMessage) continue;

                // Calculate time since last user message
                const minutesSinceLastUserMsg = (new Date().getTime() - new Date(lastUserMessage.timestamp).getTime()) / 60000;

                if (minutesSinceLastUserMsg >= followUp.delayMinutes) {
                    // 3. Check if we already executed THIS follow-up for THIS user message
                    const alreadyExecuted = await prisma.automationLog.findFirst({
                        where: {
                            conversationId: conversation.id,
                            leadMessageId: lastUserMessage.id,
                            agentFollowUpId: followUp.id
                        }
                    });

                    if (!alreadyExecuted) {
                        console.log(`🚀 Triggering follow-up for lead ${lead.phone}`);

                        // Execute Action: Send Message
                        let message = followUp.messageTemplate;
                        // Replace variables
                        message = message.replace(/{{lead.name}}/g, lead.name || '')
                            .replace(/{{lead.phone}}/g, lead.phone || '')
                            .replace(/{{lead.email}}/g, lead.email || '')
                            .replace(/{{lead.currentState}}/g, lead.currentState || '');

                        await sendMessage(conversation.id, message);
                        console.log(`📱 Sent WhatsApp message to ${lead.phone}`);

                        // Log execution
                        await prisma.automationLog.create({
                            data: {
                                agentFollowUpId: followUp.id,
                                conversationId: conversation.id,
                                leadMessageId: lastUserMessage.id,
                            }
                        });

                        processedCount++;
                    }
                }
            }
        }

        return processedCount;
    } catch (error) {
        console.error('Error in checkAgentFollowUps:', error);
        throw error;
    }
}
