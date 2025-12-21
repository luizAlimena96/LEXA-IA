'use client';

import { useState } from 'react';
import KanbanColumn from './KanbanColumn';

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

interface KanbanBoardProps {
    stages: CRMStage[];
    leadsByStage: Record<string, Lead[]>;
    uncategorizedLeads: Lead[];
    onLeadClick: (lead: Lead) => void;
    onLeadMove: (leadId: string, newStageId: string) => void;
    onEditStage: (stage: CRMStage) => void;
    onDeleteStage: (stageId: string) => void;
}

export default function KanbanBoard({
    stages,
    leadsByStage,
    uncategorizedLeads,
    onLeadClick,
    onLeadMove,
    onEditStage,
    onDeleteStage
}: KanbanBoardProps) {
    const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

    const handleDragStart = (leadId: string) => {
        setDraggedLeadId(leadId);
    };

    const handleDragEnd = () => {
        setDraggedLeadId(null);
    };

    const handleDrop = (stageId: string) => {
        if (draggedLeadId) {
            onLeadMove(draggedLeadId, stageId);
            setDraggedLeadId(null);
        }
    };

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x" style={{ minHeight: 'calc(100vh - 200px)' }}>
            {/* Uncategorized Column */}
            {uncategorizedLeads.length > 0 && (
                <div className="snap-start">
                    <KanbanColumn
                        stage={{
                            id: '_uncategorized',
                            name: 'Sem Etapa',
                            color: '#6b7280',
                            order: -1
                        }}
                        leads={uncategorizedLeads}
                        draggedLeadId={draggedLeadId}
                        onLeadClick={onLeadClick}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDrop={() => { }}
                        isUncategorized
                    />
                </div>
            )}

            {/* Stage Columns */}
            {stages.map(stage => (
                <div key={stage.id} className="snap-start">
                    <KanbanColumn
                        stage={stage}
                        leads={leadsByStage[stage.id] || []}
                        draggedLeadId={draggedLeadId}
                        onLeadClick={onLeadClick}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDrop={() => handleDrop(stage.id)}
                        onEditStage={() => onEditStage(stage)}
                        onDeleteStage={() => onDeleteStage(stage.id)}
                    />
                </div>
            ))}

            {/* Add Stage Column Placeholder */}
            <div className="snap-start flex-shrink-0 w-80 bg-gray-50 dark:bg-gray-800/30 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center min-h-[400px]">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Arraste leads entre as colunas</p>
            </div>
        </div>
    );
}
