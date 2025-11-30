import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';
import { getWebhookTemplate } from '@/app/services/crmService';

// GET /api/crm/templates?type=datacrazy&event=lead.created
export async function GET(request: NextRequest) {
    try {
        await requireAuth();

        const { searchParams } = new URL(request.url);
        const crmType = searchParams.get('type');
        const event = searchParams.get('event');

        if (!crmType || !event) {
            return NextResponse.json({ error: 'Type and event are required' }, { status: 400 });
        }

        const template = getWebhookTemplate(crmType, event);

        if (!template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        return NextResponse.json(template);
    } catch (error) {
        return handleError(error);
    }
}
