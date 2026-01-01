'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface ActivityLog {
    id: string;
    type: string;
    description: string;
    metadata: any;
    createdAt: string;
}

interface NotificationEvent {
    type: 'new_activity';
    organizationId: string;
    activity: ActivityLog;
}

interface UseNotificationsRealtimeOptions {
    organizationId: string | null;
    onNewActivity?: (activity: ActivityLog) => void;
    enabled?: boolean;
}

/**
 * Hook to listen for real-time activity log notifications via WebSocket
 * Uses the existing CRM WebSocket namespace
 */
export function useNotificationsRealtime({
    organizationId,
    onNewActivity,
    enabled = true
}: UseNotificationsRealtimeOptions) {
    const socketRef = useRef<Socket | null>(null);
    const onNewActivityRef = useRef(onNewActivity);

    // Keep callback ref updated
    useEffect(() => {
        onNewActivityRef.current = onNewActivity;
    }, [onNewActivity]);

    const connect = useCallback(() => {
        if (!organizationId || !enabled) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
        // Remove /api suffix and trailing slashes to get base URL
        const wsUrl = apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

        console.log('[Notifications Realtime] Connecting to CRM WebSocket:', wsUrl);

        // Use the existing CRM namespace
        const socket = io(`${wsUrl}/crm`, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
            console.log('[Notifications Realtime] Connected to WebSocket');
            // Join organization room
            socket.emit('join:organization', { organizationId });
        });

        socket.on('disconnect', () => {
            console.log('[Notifications Realtime] Disconnected from WebSocket');
        });

        socket.on('connect_error', (error) => {
            console.error('[Notifications Realtime] Connection error:', error.message);
        });

        // Listen for CRM updates - specifically activity_created events
        socket.on('crm:update', (event: any) => {
            if (event.type === 'activity_created' && event.data) {
                console.log('[Notifications Realtime] New activity:', event.data);
                onNewActivityRef.current?.(event.data);
            }
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
            console.log('[Notifications Realtime] Disconnected');
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
