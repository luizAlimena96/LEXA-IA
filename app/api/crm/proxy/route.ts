import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';

// Proxy endpoint to make external API calls and avoid CORS issues
export async function POST(request: NextRequest) {
    try {
        await requireAuth();

        const body = await request.json();
        const { url, method, headers, body: requestBody } = body;

        if (!url) {
            return NextResponse.json(
                { error: 'URL is required' },
                { status: 400 }
            );
        }

        console.log('🔄 Proxy Request:', {
            url,
            method,
            headers: Object.keys(headers || {}),
        });

        const startTime = Date.now();

        try {
            const options: RequestInit = {
                method: method || 'GET',
                headers: headers || {},
            };

            if (requestBody && ['POST', 'PUT', 'PATCH'].includes(method)) {
                options.body = requestBody;
            }

            const response = await fetch(url, options);
            const endTime = Date.now();

            let data;
            const contentType = response.headers.get('content-type');

            if (contentType?.includes('application/json')) {
                data = await response.json().catch(() => ({}));
            } else {
                data = await response.text();
            }

            console.log('✅ Proxy Response:', {
                status: response.status,
                time: `${endTime - startTime}ms`,
            });

            return NextResponse.json({
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                data,
                responseTime: endTime - startTime,
            });

        } catch (fetchError: any) {
            console.error('❌ Fetch Error:', fetchError.message);

            return NextResponse.json({
                status: 0,
                statusText: 'Network Error',
                error: fetchError.message,
                details: {
                    name: fetchError.name,
                    message: fetchError.message,
                    cause: fetchError.cause,
                },
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('❌ Proxy Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
