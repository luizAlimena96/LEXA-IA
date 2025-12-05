import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';
import { ValidationError } from '@/app/lib/errors';

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        if (user.role !== 'SUPER_ADMIN') {
            throw new ValidationError('Only SUPER_ADMIN can access this endpoint');
        }

        const body = await request.json();
        const { organizationId, agentId } = body;

        if (!organizationId || !agentId) {
            throw new ValidationError('Organization ID and Agent ID are required');
        }

        const testPhone = `test_${organizationId}`;

        // Find the test conversation
        const conversation = await prisma.conversation.findFirst({
            where: {
                whatsapp: testPhone,
                organizationId,
                agentId,
            },
            include: {
                lead: true,
                messages: {
                    orderBy: { timestamp: 'desc' },
                    take: 1,
                }
            }
        });

        if (!conversation || !conversation.lead) {
            return NextResponse.json({ message: 'Conversa de teste não encontrada. Envie uma mensagem primeiro.' });
        }

        const lead = conversation.lead;

        // Find active AgentFollowUp rules
        const followUps = await prisma.agentFollowUp.findMany({
            where: {
                agentId,
                isActive: true,
            },
            include: {
                agentState: true,
                matrixItem: true,
            },
        });

        if (followUps.length === 0) {
            return NextResponse.json({ message: 'Nenhuma regra de follow-up ativa encontrada para este agente.' });
        }

        const triggeredRules = [];

        for (const followUp of followUps) {
            // Check state match
            let stateMatch = false;

            if (followUp.agentStateId && followUp.agentState) {
                // Check against Name OR ID
                if (lead.currentState === followUp.agentState.name || lead.currentState === followUp.agentState.id) {
                    stateMatch = true;
                }
            } else if (followUp.matrixItemId && followUp.matrixItem) {
                // Check against Title OR ID
                if (lead.currentState === followUp.matrixItem.title || lead.currentState === followUp.matrixItem.id) {
                    stateMatch = true;
                }
            }

            if (stateMatch) {
                // Execute Action: Create Message (Simulate sending)
                let messageContent = followUp.messageTemplate;
                // Replace variables
                messageContent = messageContent.replace(/{{lead.name}}/g, lead.name || '')
                    .replace(/{{lead.phone}}/g, lead.phone || '')
                    .replace(/{{lead.email}}/g, lead.email || '')
                    .replace(/{{lead.currentState}}/g, lead.currentState || '');

                // Create message in DB
                await prisma.message.create({
                    data: {
                        conversationId: conversation.id,
                        content: messageContent,
                        fromMe: true, // From AI
                        type: 'TEXT',
                        messageId: crypto.randomUUID(),
                        timestamp: new Date(),
                    }
                });

                // Calculate time for information purposes
                const lastMsg = conversation.messages[0];
                const minutesSince = lastMsg ? (new Date().getTime() - new Date(lastMsg.timestamp).getTime()) / 60000 : 0;

                triggeredRules.push({
                    ruleName: followUp.agentState?.name || followUp.matrixItem?.title || 'Regra',
                    message: messageContent,
                    info: `Delay configurado: ${followUp.delayMinutes} min. Tempo real decorrido: ${minutesSince.toFixed(1)} min. (Ignorado na simulação)`
                });
            }
        }

        if (triggeredRules.length > 0) {
            return NextResponse.json({
                success: true,
                message: `Follow-up disparado! (Modo Simulação: Tempo ignorado). \nRegras: ${triggeredRules.map(r => `${r.ruleName} [${r.info}]`).join(', ')}`,
                triggered: triggeredRules
            });
        } else {
            // Try to resolve the current state name for the error message
            let currentStateDisplay = lead.currentState || 'N/A';

            // Simple UUID regex check
            const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

            if (lead.currentState && isUUID(lead.currentState)) {
                // Check if it matches any state ID
                try {
                    const matchingState = await prisma.state.findUnique({ where: { id: lead.currentState } });
                    if (matchingState) currentStateDisplay = `${matchingState.name} (ID)`;
                } catch (e) { /* ignore */ }

                // Check if it matches any matrix ID
                try {
                    const matchingMatrix = await prisma.matrixItem.findUnique({ where: { id: lead.currentState } });
                    if (matchingMatrix) currentStateDisplay = `${matchingMatrix.title} (ID)`;
                } catch (e) { /* ignore */ }
            }

            return NextResponse.json({
                success: false,
                message: `Nenhuma regra corresponde ao estado atual do lead: ${currentStateDisplay}`
            });
        }

    } catch (error) {
        console.error('Error triggering follow-up:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
