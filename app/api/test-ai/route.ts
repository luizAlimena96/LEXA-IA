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

        // Get the latest debug log to extract thinking
        const debugLog = await prisma.debugLog.findFirst({
            where: {
                conversationId: conversation.id,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Save AI response
        await prisma.message.create({
            data: {
                conversationId: conversation.id,
                content: aiResponse,
                fromMe: true,
                type: 'TEXT',
                messageId: crypto.randomUUID(),
            },
        });

        // Update lead state
        const updatedLead = await prisma.lead.findUnique({
            where: { id: lead.id },
        });

        return NextResponse.json({
            response: aiResponse,
            thinking: debugLog?.aiThinking || 'Pensamento não disponível',
            state: updatedLead?.currentState || 'UNKNOWN',
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
