
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
    try {
        // 1. Authentication Check
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse Request Body
        const body = await request.json();
        const { url, method, headers, body: requestBody } = body;

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        console.log('[Proxy Request] Forwarding to:', url, method);

        // 3. Prepare Fetch Options
        // Remove host-specific headers that might cause issues
        const forwardHeaders: Record<string, string> = { ...headers };

        // Ensure we don't send restricted headers or headers that might confuse the target
        delete forwardHeaders['host'];
        delete forwardHeaders['content-length'];

        const fetchOptions: RequestInit = {
            method: method || 'GET',
            headers: forwardHeaders,
            body: requestBody || undefined,
        };

        // 4. Execute Request
        const response = await fetch(url, fetchOptions);

        // 5. Read Response
        let responseData: any;
        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/json')) {
            try {
                responseData = await response.json();
            } catch {
                responseData = await response.text();
            }
        } else {
            responseData = await response.text();
        }

        // 6. Return Response to Client
        // We return the status code from the external API, but wrap the body
        return NextResponse.json({
            status: response.status,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries()),
            data: responseData
        }, { status: 200 }); // Always 200 from proxy, status inside body determines success

    } catch (error: any) {
        console.error('[Proxy Request] Error:', error);
        return NextResponse.json({
            status: 500,
            ok: false,
            error: error.message || 'Internal Proxy Error'
        }, { status: 500 });
    }
}
