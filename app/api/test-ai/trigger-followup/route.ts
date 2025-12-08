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
                crmStage: true,
            },
        });

        if (followUps.length === 0) {
            return NextResponse.json({ message: 'Nenhuma regra de follow-up ativa encontrada para este agente.' });
        }

        console.log(`[DEBUG] Found ${followUps.length} follow-up rules`);
        console.log(`[DEBUG] Lead current state: "${lead.currentState}"`);

        const triggeredRules = [];

        for (const followUp of followUps) {
            console.log(`[DEBUG] Checking rule: ${followUp.name}`);
            console.log(`[DEBUG]   - agentStateId: ${followUp.agentStateId}`);
            console.log(`[DEBUG]   - agentState?.name: ${followUp.agentState?.name}`);
            console.log(`[DEBUG]   - crmStageId: ${followUp.crmStageId}`);
            console.log(`[DEBUG]   - crmStage?.name: ${followUp.crmStage?.name}`);

            // Check state match
            let stateMatch = false;

            if (followUp.agentStateId && followUp.agentState) {
                // Check against Name OR ID
                console.log(`[DEBUG]   - Checking agentState: "${followUp.agentState.name}" vs "${lead.currentState}"`);
                if (lead.currentState === followUp.agentState.name || lead.currentState === followUp.agentState.id) {
                    stateMatch = true;
                    console.log(`[DEBUG]   - ✅ MATCHED via agentState!`);
                }
            } else if (followUp.crmStageId && followUp.crmStage) {
                // Check if lead's current state belongs to this CRM Stage
                console.log(`[DEBUG]   - Checking if state "${lead.currentState}" belongs to CRM Stage "${followUp.crmStage.name}"`);

                // Find all states that belong to this CRM Stage
                const statesInStage = await prisma.state.findMany({
                    where: { crmStageId: followUp.crmStageId },
                    select: { id: true, name: true }
                });

                console.log(`[DEBUG]   - States in CRM Stage: ${statesInStage.map(s => s.name).join(', ')}`);

                // Check if current state matches any state in this CRM Stage
                const matchingState = statesInStage.find(
                    s => s.name === lead.currentState || s.id === lead.currentState
                );

                if (matchingState) {
                    stateMatch = true;
                    console.log(`[DEBUG]   - ✅ MATCHED via crmStage! (state "${matchingState.name}" belongs to "${followUp.crmStage.name}")`);
                }
            }

            if (!stateMatch) {
                console.log(`[DEBUG]   - ❌ No match`);
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
                    ruleName: followUp.agentState?.name || followUp.crmStage?.name || 'Regra',
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

                // Check if it matches any CRM stage ID
                try {
                    const matchingStage = await prisma.cRMStage.findUnique({ where: { id: lead.currentState } });
                    if (matchingStage) currentStateDisplay = `${matchingStage.name} (ID)`;
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
