'use client';

import { useState } from 'react';
import LeadCard from './LeadCard';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';

interface CRMStage {
    id: string;
    name: string;
    color: string;
    order: number;
}

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

interface KanbanColumnProps {
    stage: CRMStage;
    leads: Lead[];
    draggedLeadId: string | null;
    onLeadClick: (lead: Lead) => void;
    onDragStart: (leadId: string) => void;
    onDragEnd: () => void;
    onDrop: () => void;
    onEditStage?: () => void;
    onDeleteStage?: () => void;
    isUncategorized?: boolean;
}

export default function KanbanColumn({
    stage,
    leads,
    draggedLeadId,
    onLeadClick,
    onDragStart,
    onDragEnd,
    onDrop,
    onEditStage,
    onDeleteStage,
    isUncategorized
}: KanbanColumnProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!isDragOver) setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        onDrop();
    };

    return (
        <div
            className={`flex-shrink-0 w-80 bg-gray-100 dark:bg-gray-800/50 rounded-xl flex flex-col transition-all ${isDragOver && !isUncategorized ? 'ring-2 ring-indigo-500 bg-gray-200 dark:bg-gray-800/70' : ''
                }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Header */}
            <div
                className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
                style={{ borderLeftColor: stage.color, borderLeftWidth: '4px' }}
            >
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{stage.name}</h3>
                    <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-300">
                        {leads.length}
                    </span>
                </div>

                {!isUncategorized && (
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>

                        {showMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowMenu(false)}
                                />
                                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-700 rounded-lg shadow-xl z-20 py-1 min-w-[120px] border border-gray-100 dark:border-gray-600">
                                    <button
                                        onClick={() => {
                                            setShowMenu(false);
                                            onEditStage?.();
                                        }}
                                        className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowMenu(false);
                                            onDeleteStage?.();
                                        }}
                                        className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2 text-red-500 dark:text-red-400"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Excluir
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Cards */}
            <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
                {leads.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 text-sm">
                        Nenhum lead nesta etapa
                    </div>
                ) : (
                    leads.map(lead => (
                        <LeadCard
                            key={lead.id}
                            lead={lead}
                            isDragging={draggedLeadId === lead.id}
                            onClick={() => onLeadClick(lead)}
                            onDragStart={() => onDragStart(lead.id)}
                            onDragEnd={onDragEnd}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
