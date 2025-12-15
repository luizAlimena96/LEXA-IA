'use client';

import { Pencil, Trash2, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CRMStage } from '../interfaces';

interface SortableStageItemProps {
    stage: CRMStage;
    onEdit: (stage: CRMStage) => void;
    onDelete: (id: string) => void;
}

function SortableStageItem({ stage, onEdit, onDelete }: SortableStageItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: stage.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
            <div className="flex items-center gap-3">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                    <GripVertical className="h-5 w-5 text-gray-400" />
                </button>

                <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: stage.color }}
                />

                <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                        {stage.name}
                    </h4>
                    {stage.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {stage.description}
                        </p>
                    )}
                    {stage.states && stage.states.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {stage.states.map((state) => (
                                <span
                                    key={state.id}
                                    className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                                >
                                    {state.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEdit(stage)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Editar"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => onDelete(stage.id)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Excluir"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

interface CRMStagesListProps {
    stages: CRMStage[];
    onEdit: (stage: CRMStage) => void;
    onDelete: (id: string) => void;
}

export default function CRMStagesList({ stages, onEdit, onDelete }: CRMStagesListProps) {
    if (stages.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p>Nenhuma etapa criada</p>
                <p className="text-sm mt-2">Clique em "Nova Etapa" para começar</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {stages.map((stage) => (
                <SortableStageItem
                    key={stage.id}
                    stage={stage}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}

export { SortableStageItem };
