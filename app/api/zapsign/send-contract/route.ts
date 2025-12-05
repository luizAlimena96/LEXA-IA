import { NextRequest, NextResponse } from 'next/server';
import { sendContractToLead } from '@/app/services/zapSignService';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { leadId, organizationId } = body;
        if (!leadId || !organizationId) {
            return NextResponse.json(
                { error: 'leadId and organizationId are required' },
                { status: 400 }
            );
        }
        const result = await sendContractToLead(leadId, organizationId);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in send-contract API:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send contract' },
            { status: 500 }
        );
    }
}
