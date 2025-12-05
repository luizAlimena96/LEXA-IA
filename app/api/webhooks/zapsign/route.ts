import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        console.log('ZapSign webhook received:', body);

        const { event, document } = body;

        if (!document || !document.token) {
            return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
        }

        const lead = await prisma.lead.findFirst({
            where: {
                zapSignDocumentId: document.token,
            },
        });

        if (!lead) {
            console.log('Lead not found for document:', document.token);
            return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
        }

        if (event === 'doc_signed' || document.status === 'signed') {
            await prisma.lead.update({
                where: { id: lead.id },
                data: {
                    zapSignStatus: 'signed',
                    zapSignSignedAt: new Date(),
                    status: 'WON',
                },
            });

            console.log(`Contract signed for lead ${lead.id}`);
        } else {
            await prisma.lead.update({
                where: { id: lead.id },
                data: {
                    zapSignStatus: document.status,
                },
            });
        }

        return NextResponse.json({ message: 'Webhook processed successfully' });
    } catch (error) {
        console.error('Error processing ZapSign webhook:', error);
        return NextResponse.json(
            { error: 'Failed to process webhook' },
            { status: 500 }
        );
    }
}
