"use client";

import { useEffect, useRef, useCallback } from "react";

interface MessageEvent {
    type: 'new-message' | 'connected' | 'heartbeat';
    message?: {
        id: string;
        content: string;
        time: string;
        sent: boolean;
        read: boolean;
        role: 'user' | 'assistant';
    };
    conversationId?: string;
}

interface UseConversationStreamOptions {
    conversationId: string | null;
    onMessage: (message: MessageEvent['message']) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
}

/**
 * Custom hook to connect to Server-Sent Events stream for real-time conversation updates
 */
export function useConversationStream({
    conversationId,
    onMessage,
    onConnect,
    onDisconnect,
}: UseConversationStreamOptions) {
    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const MAX_RECONNECT_ATTEMPTS = 5;

    const connect = useCallback(() => {
        if (!conversationId) return;

        // Close existing connection
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        console.log('[SSE] Connecting to conversation stream:', conversationId);

        const eventSource = new EventSource(
            `/api/conversations/${conversationId}/stream`
        );

        eventSource.onopen = () => {
            console.log('[SSE] Connection established');
            reconnectAttemptsRef.current = 0;
            onConnect?.();
        };

        eventSource.onmessage = (event) => {
            try {
                const data: MessageEvent = JSON.parse(event.data);

                if (data.type === 'new-message' && data.message) {
                    console.log('[SSE] New message received:', data.message);
                    onMessage(data.message);
                } else if (data.type === 'connected') {
                    console.log('[SSE] Connected to conversation:', data.conversationId);
                } else if (data.type === 'heartbeat') {
                    // Heartbeat to keep connection alive
                    console.log('[SSE] Heartbeat received');
                }
            } catch (error) {
                console.error('[SSE] Error parsing message:', error);
            }
        };

        eventSource.onerror = (error) => {
            console.error('[SSE] Connection error:', error);
            eventSource.close();
            onDisconnect?.();

            // Stop after max attempts to prevent infinite loops
            if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
                console.error('[SSE] Max reconnection attempts reached - stopping reconnection');
                return; // Stop reconnecting
            }

            // Exponential backoff for reconnection
            const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
            reconnectAttemptsRef.current++;

            console.log(`[SSE] Reconnecting in ${backoffTime}ms (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);

            reconnectTimeoutRef.current = setTimeout(() => {
                connect();
            }, backoffTime);
        };

        eventSourceRef.current = eventSource;
    }, [conversationId, onMessage, onConnect, onDisconnect]);

    useEffect(() => {
        if (conversationId) {
            connect();
        }

        return () => {
            console.log('[SSE] Cleaning up connection');
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };
    }, [conversationId, connect]);

    return {
        isConnected: eventSourceRef.current?.readyState === EventSource.OPEN,
    };
}
