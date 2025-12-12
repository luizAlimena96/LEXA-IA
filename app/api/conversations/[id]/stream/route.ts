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

                let heartbeatInterval: NodeJS.Timeout | null = null;
                let connectionTimeout: NodeJS.Timeout | null = null;
                let isClosed = false;

                // Centralized cleanup function
                const cleanup = () => {
                    if (isClosed) return;
                    isClosed = true;

                    console.log('[SSE] Cleaning up connection for conversation:', conversationId);

                    if (heartbeatInterval) {
                        clearInterval(heartbeatInterval);
                        heartbeatInterval = null;
                    }

                    if (connectionTimeout) {
                        clearTimeout(connectionTimeout);
                        connectionTimeout = null;
                    }

                    messageEventEmitter.removeClient(conversationId, callback);

                    try {
                        controller.close();
                    } catch (error) {
                        // Controller might already be closed
                    }
                };

                // Create callback for this client
                const callback = (data: any) => {
                    if (isClosed) return;

                    const message = `data: ${JSON.stringify(data)}\n\n`;
                    try {
                        controller.enqueue(encoder.encode(message));
                    } catch (error) {
                        console.error('[SSE] Error sending message to client:', error);
                        cleanup();
                    }
                };

                // Register client
                messageEventEmitter.addClient(conversationId, callback);

                // Send heartbeat every 30 seconds to keep connection alive
                heartbeatInterval = setInterval(() => {
                    if (isClosed) return;

                    try {
                        const heartbeat = `data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`;
                        controller.enqueue(encoder.encode(heartbeat));
                    } catch (error) {
                        console.error('[SSE] Error sending heartbeat:', error);
                        cleanup();
                    }
                }, 30000);

                // Auto-close connection after 5 minutes to prevent leaks
                const SSE_TIMEOUT = 5 * 60 * 1000; // 5 minutos
                connectionTimeout = setTimeout(() => {
                    console.log('[SSE] Connection timeout reached - closing connection');
                    const timeoutMessage = `data: ${JSON.stringify({ type: 'timeout', message: 'Connection timeout' })}\n\n`;
                    try {
                        controller.enqueue(encoder.encode(timeoutMessage));
                    } catch (error) {
                        // Ignore error if controller already closed
                    }
                    cleanup();
                }, SSE_TIMEOUT);

                // Cleanup on disconnect
                request.signal.addEventListener('abort', () => {
                    console.log('[SSE] Client disconnected');
                    cleanup();
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
