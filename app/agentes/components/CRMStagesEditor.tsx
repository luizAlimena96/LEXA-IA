'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Pencil, Trash2, GripVertical, X, TrendingUp, Info } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CRMStage {
    id: string;
    name: string;
    description?: string | null;
    color: string;
    order: number;
    states?: Array<{
        id: string;
        name: string;
        order: number;
    }>;
}

interface State {
    id: string;
    name: string;
    order: number;
    crmStageId?: string | null;
}

interface CRMStagesEditorProps {
    agentId: string;
    organizationId?: string;
}

interface StageFormData {
    name: string;
    description: string;
    color: string;
    stateIds: string[];
}

const DEFAULT_COLORS = [
    '#6366f1', // Indigo
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#14b8a6', // Teal
];

function SortableStageItem({ stage, onEdit, onDelete }: {
    stage: CRMStage;
    onEdit: (stage: CRMStage) => void;
    onDelete: (id: string) => void;
}) {
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
            <div className="flex items-start gap-3">
                {/* Drag Handle */}
                <button
                    {...attributes}
                    {...listeners}
                    className="mt-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing"
                >
                    <GripVertical className="h-5 w-5" />
                </button>

                {/* Color Indicator */}
                <div
                    className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: stage.color }}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white">{stage.name}</h4>
                    {stage.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{stage.description}</p>
                    )}
                    {stage.states && stage.states.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            {stage.states.map((state) => (
                                <span
                                    key={state.id}
                                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                >
                                    {state.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                    <button
                        onClick={() => onEdit(stage)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                        title="Editar"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => onDelete(stage.id)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Excluir"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}


export default function CRMStagesEditor({ agentId, organizationId }: CRMStagesEditorProps) {
    const [stages, setStages] = useState<CRMStage[]>([]);
    const [availableStates, setAvailableStates] = useState<State[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingStage, setEditingStage] = useState<CRMStage | null>(null);
    const [formData, setFormData] = useState<StageFormData>({
        name: '',
        description: '',
        color: DEFAULT_COLORS[0],
        stateIds: [],
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        loadData();
    }, [agentId, organizationId]);

    useEffect(() => {
        if (showModal && editingStage) {
            const stateIds = editingStage.states?.map((s) => s.id) || [];
            setFormData({
                name: editingStage.name,
                description: editingStage.description || '',
                color: editingStage.color,
                stateIds,
            });
        } else if (showModal && !editingStage) {
            setFormData({
                name: '',
                description: '',
                color: DEFAULT_COLORS[0],
                stateIds: [],
            });
        }
    }, [showModal, editingStage]);

    const loadData = async () => {
        try {
            setLoading(true);
            const statesUrl = organizationId
                ? `/api/states?organizationId=${organizationId}`
                : `/api/states?agentId=${agentId}`;

            const [stagesRes, statesRes] = await Promise.all([
                fetch(`/api/agents/${agentId}/crm-stages`),
                fetch(statesUrl),
            ]);

            if (!stagesRes.ok || !statesRes.ok) {
                throw new Error('Erro ao carregar dados');
            }

            const [stagesData, statesData] = await Promise.all([
                stagesRes.json(),
                statesRes.json(),
            ]);

            setStages(stagesData);
            setAvailableStates(statesData);
        } catch (error) {
            console.error('Error loading data:', error);
            showMessage('error', 'Não foi possível carregar os dados');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = stages.findIndex((s) => s.id === active.id);
            const newIndex = stages.findIndex((s) => s.id === over.id);

            const newStages = arrayMove(stages, oldIndex, newIndex).map((stage, index) => ({
                ...stage,
                order: index,
            }));

            setStages(newStages);

            try {
                await fetch(`/api/agents/${agentId}/crm-stages/reorder`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        stages: newStages.map((s) => ({ id: s.id, order: s.order })),
                    }),
                });
            } catch (error) {
                console.error('Error reordering stages:', error);
                showMessage('error', 'Erro ao reordenar etapas');
                loadData();
            }
        }
    };

    const handleOpenModal = (stage?: CRMStage) => {
        setEditingStage(stage || null);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingStage(null);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            showMessage('error', 'Nome é obrigatório');
            return;
        }

        try {
            setSaving(true);
            const url = editingStage
                ? `/api/agents/${agentId}/crm-stages/${editingStage.id}`
                : `/api/agents/${agentId}/crm-stages`;

            const method = editingStage ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao salvar');
            }

            const savedStage = await response.json();

            showMessage('success', editingStage ? 'Etapa atualizada!' : 'Etapa criada!');
            handleCloseModal();
            loadData();
        } catch (error: any) {
            console.error('Error saving stage:', error);
            showMessage('error', error.message || 'Erro ao salvar etapa');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta etapa? Os estados não serão excluídos.')) {
            return;
        }

        try {
            const response = await fetch(`/api/agents/${agentId}/crm-stages/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Erro ao excluir');
            }

            showMessage('success', 'Etapa excluída!');
            loadData();
        } catch (error) {
            console.error('Error deleting stage:', error);
            showMessage('error', 'Erro ao excluir etapa');
        }
    };

    const unassignedStates = availableStates.filter((state) => !state.crmStageId);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Message Toast */}
            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'}`}>
                    <div className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        <span>{message.text}</span>
                    </div>
                </div>
            )}

            {/* Info Alert */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-medium mb-1">Etapas do CRM</p>
                        <p>
                            Organize seus estados FSM em etapas do funil de vendas.
                            Arraste para reordenar e atribua múltiplos estados a cada etapa.
                        </p>
                    </div>
                </div>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Etapas do Pipeline</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {stages.length} etapa{stages.length !== 1 ? 's' : ''} configurada{stages.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Nova Etapa
                </button>
            </div>

            {/* Stages List */}
            {stages.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Nenhuma etapa criada</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Clique em "Nova Etapa" para começar</p>
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={stages.map((s) => s.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-3">
                            {stages.map((stage) => (
                                <SortableStageItem
                                    key={stage.id}
                                    stage={stage}
                                    onEdit={handleOpenModal}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            {/* Unassigned States Warning */}
            {unassignedStates.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>{unassignedStates.length} estado{unassignedStates.length !== 1 ? 's' : ''}</strong> sem etapa atribuída: {unassignedStates.map(s => s.name).join(', ')}
                    </p>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-gray-500/10 dark:bg-black/30 backdrop-blur-md flex items-center justify-center p-4 z-50"
                    onClick={handleCloseModal}
                >
                    <div
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {editingStage ? 'Editar Etapa' : 'Nova Etapa'}
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nome da Etapa *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Em Contato, Proposta Enviada"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Descrição
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Descrição opcional da etapa"
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                />
                            </div>

                            {/* Color */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Cor
                                </label>
                                <div className="flex gap-2">
                                    {DEFAULT_COLORS.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setFormData({ ...formData, color })}
                                            className={`w-8 h-8 rounded-full border-2 ${formData.color === color ? 'border-gray-900 dark:border-white' : 'border-transparent'
                                                }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* States */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Estados FSM
                                </label>
                                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 max-h-60 overflow-y-auto space-y-2 bg-white dark:bg-gray-900">
                                    {availableStates.map((state) => {
                                        const isSelected = formData.stateIds.includes(state.id);
                                        const isDisabled = !!(state.crmStageId && state.crmStageId !== editingStage?.id);

                                        return (
                                            <label
                                                key={state.id}
                                                className={`flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    disabled={isDisabled}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData({
                                                                ...formData,
                                                                stateIds: [...formData.stateIds, state.id],
                                                            });
                                                        } else {
                                                            setFormData({
                                                                ...formData,
                                                                stateIds: formData.stateIds.filter((id) => id !== state.id),
                                                            });
                                                        }
                                                    }}
                                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">{state.name}</span>
                                                {isDisabled && (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">(em outra etapa)</span>
                                                )}
                                            </label>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Selecione os estados que pertencem a esta etapa
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={handleCloseModal}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !formData.name.trim()}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>Salvar</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}