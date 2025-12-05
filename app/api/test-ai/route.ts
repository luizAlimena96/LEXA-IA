import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError } from '@/app/lib/errors';
import { processMessage } from '@/app/services/aiService';

// POST /api/test-ai - Process test message with AI
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();

        // Only SUPER_ADMIN can use this
        if (user.role !== 'SUPER_ADMIN') {
            throw new ValidationError('Only SUPER_ADMIN can access this endpoint');
        }

        const body = await request.json();
        const { message, organizationId, agentId, conversationHistory } = body;

        if (!message || !organizationId || !agentId) {
            throw new ValidationError('Message, organizationId, and agentId are required');
        }

        // Get organization and agent
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
        });

        if (!organization) {
            throw new ValidationError('Organization not found');
        }

        const agent = await prisma.agent.findUnique({
            where: { id: agentId },
            include: {
                states: {
                    orderBy: { order: 'asc' },
                },
                matrix: true, // Include matrix to resolve names
            },
        });

        if (!agent) {
            throw new ValidationError('Agent not found');
        }

        // Create or find test lead for this organization (reuse same test lead)
        const testPhone = `test_${organizationId}`;

        let lead = await prisma.lead.findFirst({
            where: {
                phone: testPhone,
                organizationId,
            },
        });

        if (!lead) {
            lead = await prisma.lead.create({
                data: {
                    phone: testPhone,
                    name: 'Test User (SUPER_ADMIN)',
                    status: 'NEW',
                    currentState: agent.states?.[0]?.name || 'INICIO',
                    agentId: agent.id,
                    organizationId,
                },
            });
        }

        // Create or find test conversation (reuse same conversation)
        let conversation = await prisma.conversation.findFirst({
            where: {
                whatsapp: testPhone,
                organizationId,
            },
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    whatsapp: testPhone,
                    leadId: lead.id,
                    agentId: agent.id,
                    organizationId,
                },
            });
        }

        // Save user message
        await prisma.message.create({
            data: {
                conversationId: conversation.id,
                content: message,
                fromMe: false,
                type: 'TEXT',
                messageId: crypto.randomUUID(),
            },
        });

        // Process with AI and capture thinking
        const aiResponse = await processMessage({
            message,
            conversationId: conversation.id,
            organizationId,
        });

        // Get the latest message to extract thinking (it was saved in processMessage)
        const lastMessage = await prisma.message.findFirst({
            where: {
                conversationId: conversation.id,
                fromMe: true,
            },
            orderBy: { timestamp: 'desc' },
        });

        // Update lead state
        const updatedLead = await prisma.lead.findUnique({
            where: { id: lead.id },
        });

        // Resolve state name
        let stateName = updatedLead?.currentState || 'UNKNOWN';
        if (stateName && agent) {
            // Check if it's a matrix item ID
            const matrixItem = agent.matrix.find(m => m.id === stateName);
            if (matrixItem) {
                stateName = matrixItem.title;
            } else {
                // Check if it's a state name (already correct) or ID?
                // Usually states are stored by name, but let's be safe
                const stateItem = agent.states.find(s => s.id === stateName);
                if (stateItem) {
                    stateName = stateItem.name;
                }
            }
        }

        return NextResponse.json({
            response: aiResponse,
            thinking: lastMessage?.thought || 'Pensamento não disponível',
            state: stateName,
            leadData: {
                name: updatedLead?.name,
                email: updatedLead?.email,
                phone: updatedLead?.phone,
            },
        });
    } catch (error) {
        return handleError(error);
    }
}

// GET /api/test-ai - Get conversation history
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organizationId');

        if (!organizationId) {
            throw new ValidationError('Organization ID is required');
        }

        // Only SUPER_ADMIN can use this
        if (user.role !== 'SUPER_ADMIN') {
            throw new ValidationError('Only SUPER_ADMIN can access this endpoint');
        }

        const testPhone = `test_${organizationId}`;

        const conversation = await prisma.conversation.findFirst({
            where: {
                whatsapp: testPhone,
                organizationId,
            },
            include: {
                messages: {
                    orderBy: { timestamp: 'asc' },
                },
            },
        });

        if (!conversation) {
            return NextResponse.json([]);
        }

        const lead = conversation.leadId ? await prisma.lead.findUnique({
            where: { id: conversation.leadId },
        }) : null;

        const agent = await prisma.agent.findUnique({
            where: { id: conversation.agentId },
            include: {
                states: true,
                matrix: true,
            },
        });

        let currentResolvedState = 'UNKNOWN';
        if (lead?.currentState && agent) {
            const matrixItem = agent.matrix.find(m => m.id === lead.currentState);
            if (matrixItem) {
                currentResolvedState = matrixItem.title;
            } else {
                const stateItem = agent.states.find(s => s.id === lead.currentState || s.name === lead.currentState);
                if (stateItem) {
                    currentResolvedState = stateItem.name;
                } else {
                    currentResolvedState = lead.currentState;
                }
            }
        }

        // Fetch debug logs to get thoughts
        const debugLogs = await prisma.debugLog.findMany({
            where: {
                conversationId: conversation.id,
            },
            orderBy: { createdAt: 'asc' },
        });

        const messagesWithThoughts = conversation.messages.map((msg, index) => {
            let thinking = msg.thought; // Use stored thought if available
            let state = undefined;

            if (msg.fromMe) { // AI Message
                // If thought is missing in Message, try DebugLog
                if (!thinking) {
                    const log = debugLogs.find(l => l.aiResponse === msg.content);
                    if (log) {
                        thinking = log.aiThinking;
                    }
                }

                // For the LAST AI message, attach the current resolved state
                // For older messages, we could try to find it in logs, but for now let's fix the "Current State" display
                const isLastAiMessage = index === conversation.messages.length - 1 ||
                    conversation.messages.slice(index + 1).every(m => !m.fromMe);

                if (isLastAiMessage) {
                    state = currentResolvedState;
                } else {
                    // Try to get historical state from logs if possible, or leave undefined
                    const log = debugLogs.find(l => l.aiResponse === msg.content);
                    if (log) {
                        // Resolve log state if it's an ID
                        let logState = log.currentState;
                        if (logState && agent) {
                            const mItem = agent.matrix.find(m => m.id === logState);
                            if (mItem) logState = mItem.title;
                            else {
                                const sItem = agent.states.find(s => s.id === logState || s.name === logState);
                                if (sItem) logState = sItem.name;
                            }
                        }
                        state = logState;
                    }
                }
            }

            return {
                id: msg.id,
                content: msg.content,
                fromMe: msg.fromMe,
                timestamp: msg.timestamp,
                thinking,
                state
            };
        });

        return NextResponse.json(messagesWithThoughts);
    } catch (error) {
        return handleError(error);
    }
}

// DELETE /api/test-ai - Reset conversation
export async function DELETE(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organizationId');

        if (!organizationId) {
            throw new ValidationError('Organization ID is required');
        }

        // Only SUPER_ADMIN can use this
        if (user.role !== 'SUPER_ADMIN') {
            throw new ValidationError('Only SUPER_ADMIN can access this endpoint');
        }

        const testPhone = `test_${organizationId}`;

        const conversation = await prisma.conversation.findFirst({
            where: {
                whatsapp: testPhone,
                organizationId,
            },
        });

        if (conversation) {
            // Delete conversation (cascades to messages)
            await prisma.conversation.delete({
                where: { id: conversation.id },
            });

            // Also delete debug logs for this conversation
            await prisma.debugLog.deleteMany({
                where: { conversationId: conversation.id },
            });
        }

        // Reset lead status? Maybe not necessary, but good for clean slate
        const lead = await prisma.lead.findFirst({
            where: {
                phone: testPhone,
                organizationId,
            },
        });

        if (lead) {
            await prisma.lead.delete({
                where: { id: lead.id }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleError(error);
    }
}
