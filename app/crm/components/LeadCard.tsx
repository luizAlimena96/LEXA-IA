'use client';

import { User, Clock, MessageSquare, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Lead {
    id: string;
    name: string | null;
    phone: string;
    email?: string;
    status: string;
    currentState?: string;
    conversationSummary?: string;
    extractedData?: any;
    crmStageId?: string;
    agentId: string;
    updatedAt: string;
    conversations?: Array<{
        id: string;
        lastMessageAt?: string;
        unreadCount?: number;
        tags?: Array<{ id: string; name: string; color: string }>;
    }>;
}

interface LeadCardProps {
    lead: Lead;
    isDragging: boolean;
    onClick: () => void;
    onDragStart: () => void;
    onDragEnd: () => void;
}

export default function LeadCard({
    lead,
    isDragging,
    onClick,
    onDragStart,
    onDragEnd
}: LeadCardProps) {
    const conversation = lead.conversations?.[0];
    const tags = conversation?.tags || [];
    const unreadCount = conversation?.unreadCount || 0;
    const lastMessageAt = conversation?.lastMessageAt;

    const timeAgo = lastMessageAt
        ? formatDistanceToNow(new Date(lastMessageAt), { addSuffix: true, locale: ptBR })
        : lead.updatedAt
            ? formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true, locale: ptBR })
            : null;

    return (
        <div
            draggable
            onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move';
                onDragStart();
            }}
            onDragEnd={onDragEnd}
            onClick={onClick}
            className={`bg-white dark:bg-gray-700/80 rounded-lg p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm ${isDragging ? 'opacity-50 scale-95' : ''
                }`}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-600 flex items-center justify-center">
                        <User className="w-4 h-4 text-indigo-600 dark:text-white" />
                    </div>
                    <div>
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm leading-tight">
                            {lead.name || 'Sem nome'}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatPhone(lead.phone)}</p>
                    </div>
                </div>

                {unreadCount > 0 && (
                    <span className="bg-indigo-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {unreadCount}
                    </span>
                )}
            </div>

            {/* Summary */}
            {lead.conversationSummary && (
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2 bg-gray-50 dark:bg-gray-800/50 rounded px-2 py-1">
                    {lead.conversationSummary}
                </p>
            )}

            {/* Tags */}
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {tags.slice(0, 3).map(tag => (
                        <span
                            key={tag.id}
                            className="text-xs px-1.5 py-0.5 rounded border border-transparent"
                            style={{ backgroundColor: tag.color + '30', color: tag.color, borderColor: tag.color + '40' }}
                        >
                            {tag.name}
                        </span>
                    ))}
                    {tags.length > 3 && (
                        <span className="text-xs text-gray-400">+{tags.length - 3}</span>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                {timeAgo && (
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo}
                    </span>
                )}

                {conversation && (
                    <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        Ver chat
                    </span>
                )}
            </div>
        </div>
    );
}


function formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
        const ddd = cleaned.substring(2, 4);
        const part1 = cleaned.substring(4, 9);
        const part2 = cleaned.substring(9, 13);
        return `(${ddd}) ${part1}-${part2}`;
    }
    return phone;
}
