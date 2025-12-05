import { NextRequest } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { messageEventEmitter } from '@/app/lib/eventEmitter';

// SSE endpoint for real-time conversation updates
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Authenticate user
        const user = await requireAuth();
        const { id: conversationId } = await params;

        // Create SSE stream
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            start(controller) {
                // Send initial connection message
                const initialMessage = `data: ${JSON.stringify({ type: 'connected', conversationId })}\n\n`;
                controller.enqueue(encoder.encode(initialMessage));

                // Create callback for this client
                const callback = (data: any) => {
                    const message = `data: ${JSON.stringify(data)}\n\n`;
                    try {
                        controller.enqueue(encoder.encode(message));
                    } catch (error) {
                        console.error('[SSE] Error sending message to client:', error);
                    }
                };

                // Register client
                messageEventEmitter.addClient(conversationId, callback);

                // Send heartbeat every 30 seconds to keep connection alive
                const heartbeatInterval = setInterval(() => {
                    try {
                        const heartbeat = `data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`;
                        controller.enqueue(encoder.encode(heartbeat));
                    } catch (error) {
                        console.error('[SSE] Error sending heartbeat:', error);
                        clearInterval(heartbeatInterval);
                    }
                }, 30000);

                // Cleanup on disconnect
                request.signal.addEventListener('abort', () => {
                    console.log('[SSE] Client disconnected');
                    clearInterval(heartbeatInterval);
                    messageEventEmitter.removeClient(conversationId, callback);
                    try {
                        controller.close();
                    } catch (error) {
                        // Controller might already be closed
                    }
                });
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no', // Disable buffering in nginx
            },
        });
    } catch (error) {
        console.error('[SSE] Error setting up stream:', error);
        return new Response('Unauthorized', { status: 401 });
    }
}
