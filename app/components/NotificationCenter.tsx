import React, { useState, useEffect, useRef } from 'react';
import { Bell, Calendar, UserPlus, MessageSquare, FileText, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ActivityLog {
    id: string;
    type: string;
    description: string;
    metadata: any;
    createdAt: string;
}

export default function NotificationCenter() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        fetchLogs();
        // Poll every minute
        const interval = setInterval(fetchLogs, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const fetchLogs = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/activity-logs`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                // Simple check: if first item ID changed, we have new stuff. 
                // ideally we track 'lastReadId'. For now just show content.
                setLogs(data);
                if (data.length > 0) {
                    // Logic for red dot could be refined later
                    setHasUnread(true);
                }
            }
        } catch (error) {
            console.error('Error fetching activity logs:', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'EVENT_SCHEDULED': return <Calendar className="w-4 h-4 text-blue-500" />;
            case 'LEAD_CREATED': return <UserPlus className="w-4 h-4 text-green-500" />;
            case 'FEEDBACK_RECEIVED': return <MessageSquare className="w-4 h-4 text-yellow-500" />;
            case 'CONTRACT_SENT': return <FileText className="w-4 h-4 text-purple-500" />;
            default: return <Bell className="w-4 h-4 text-gray-500" />;
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        // Less than an hour
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m atrás`;
        }
        // Less than a day
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}h atrás`;
        }
        return date.toLocaleDateString('pt-BR');
    };

    const handleOpen = () => {
        setIsOpen(!isOpen);
        setHasUnread(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleOpen}
                className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {hasUnread && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden z-50">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Notificações</h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {logs.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                Nenhuma atividade recente.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50 dark:divide-gray-800">
                                {logs.map((log) => (
                                    <div key={log.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                        <div className="flex gap-3">
                                            <div className="mt-1 bg-gray-50 dark:bg-gray-800 p-1.5 rounded-lg h-fit">
                                                {getIcon(log.type)}
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                                                    {log.description}
                                                </p>
                                                <span className="text-xs text-gray-400 mt-1 block">
                                                    {formatTime(log.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-center">
                        <button className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                            Ver todas as atividades
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
