import { NextRequest, NextResponse } from 'next/server';
import { testZapSignConnection } from '@/app/services/zapSignService';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { apiToken } = body;

        if (!apiToken) {
            return NextResponse.json(
                { error: 'API token is required' },
                { status: 400 }
            );
        }

        const isValid = await testZapSignConnection(apiToken);

        if (isValid) {
            return NextResponse.json({
                success: true,
                message: 'Connection successful',
            });
        } else {
            return NextResponse.json(
                { success: false, message: 'Invalid API token' },
                { status: 401 }
            );
        }
    } catch (error) {
        console.error('Error testing ZapSign connection:', error);
        return NextResponse.json(
            { error: 'Failed to test connection' },
            { status: 500 }
        );
    }
}
