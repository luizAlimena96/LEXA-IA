import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { handleError } from '@/app/lib/error-handler';

// Force dynamic ensures this route is always executed dynamically
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { organizationName, phone, action } = body;

        // Validation
        if (!organizationName || !phone || !action) {
            return NextResponse.json(
                { error: 'Missing required fields: organizationName, phone, action' },
                { status: 400 }
            );
        }

        // 1. Find Organization by Name (or Slug)
        const organization = await prisma.organization.findFirst({
            where: {
                OR: [
                    { name: { equals: organizationName, mode: 'insensitive' } },
                    { slug: { equals: organizationName, mode: 'insensitive' } }
                ]
            }
        });

        if (!organization) {
            return NextResponse.json(
                { error: `Organization '${organizationName}' not found` },
                { status: 404 }
            );
        }

        // 2. Normalize Phone (basic cleaning)
        // Check if phone matches directly or variations
        const cleanPhone = phone.replace(/\D/g, ''); // Remove non-numbers

        // 3. Find Conversation
        // We try to find by exact match, or clean match
        // Note: Database usually stores full DDI+DDD+Number
        let conversation = await prisma.conversation.findFirst({
            where: {
                organizationId: organization.id,
                OR: [
                    { whatsapp: phone },
                    { whatsapp: cleanPhone },
                    { whatsapp: { contains: cleanPhone } } // Risky but helpful fallback
                ]
            },
            include: { lead: true }
        });

        // 4. Determine Action
        const actionStr = String(action).toUpperCase();
        let enableAi: boolean;

        // OFF keywords
        if (['OFF', 'DISABLE', 'STOP', 'FALSE', '0', 'X'].includes(actionStr)) {
            enableAi = false;
        }
        // ON keywords
        else if (['ON', 'ENABLE', 'START', 'TRUE', '1', 'Y'].includes(actionStr)) {
            enableAi = true;
        }
        else {
            return NextResponse.json(
                { error: `Invalid action: '${action}'. Use 'ON'/'Y' or 'OFF'/'X'.` },
                { status: 400 }
            );
        }

        let message = '';

        if (conversation) {
            // Update existing conversation
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: { aiEnabled: enableAi }
            });
            message = `AI ${enableAi ? 'ENABLED' : 'DISABLED'} for conversation ${conversation.whatsapp}`;
        } else {
            // If conversation doesn't exist, we should check if Lead exists
            // If Lead exists, we might want to ensure their next conversation starts with this setting?
            // But Schema doesn't have aiEnabled on Lead. 
            // So we return 404 for conversation, but maybe user wants to PRE-SET it?
            // For now, let's just require an active conversation or at least a lead.
            // Actually, if no conversation exists, we can't toggle the AI on/off for it.

            return NextResponse.json(
                { error: `Conversation not found for phone ${phone} in organization ${organization.name}` },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            status: enableAi ? 'ENABLED' : 'DISABLED',
            organization: organization.name,
            phone: conversation.whatsapp,
            message
        });

    } catch (error) {
        return handleError(error);
    }
}
