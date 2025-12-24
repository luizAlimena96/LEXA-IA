'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface CRMEvent {
    type: 'lead_created' | 'lead_updated' | 'lead_deleted' | 'lead_moved' |
    'tag_added' | 'tag_removed' | 'message_received' | 'stage_updated';
    organizationId: string;
    agentId?: string;
    data?: any;
}

interface UseCRMRealtimeOptions {
    organizationId: string | null;
    onUpdate?: (event: CRMEvent) => void;
    enabled?: boolean;
}

export function useCRMRealtime({ organizationId, onUpdate, enabled = true }: UseCRMRealtimeOptions) {
    const socketRef = useRef<Socket | null>(null);
    const onUpdateRef = useRef(onUpdate);

    // Keep callback ref updated
    useEffect(() => {
        onUpdateRef.current = onUpdate;
    }, [onUpdate]);

    const connect = useCallback(() => {
        if (!organizationId || !enabled) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
        const wsUrl = apiUrl.replace('/api', '');

        console.log('[CRM Realtime] Connecting to WebSocket:', wsUrl);

        const socket = io(`${wsUrl}/crm`, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
            console.log('[CRM Realtime] Connected to WebSocket');
            // Join organization room
            socket.emit('join:organization', { organizationId });
        });

        socket.on('disconnect', () => {
            console.log('[CRM Realtime] Disconnected from WebSocket');
        });

        socket.on('connect_error', (error) => {
            console.error('[CRM Realtime] Connection error:', error.message);
        });

        // Listen for CRM updates
        socket.on('crm:update', (event: CRMEvent) => {
            console.log('[CRM Realtime] Received event:', event.type, event.data);
            onUpdateRef.current?.(event);
        });

        socketRef.current = socket;

        return socket;
    }, [organizationId, enabled]);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            if (organizationId) {
                socketRef.current.emit('leave:organization', { organizationId });
            }
            socketRef.current.disconnect();
            socketRef.current = null;
            console.log('[CRM Realtime] Disconnected');
        }
    }, [organizationId]);

    useEffect(() => {
        const socket = connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return {
        isConnected: !!socketRef.current?.connected,
        disconnect,
        reconnect: connect,
    };
}
