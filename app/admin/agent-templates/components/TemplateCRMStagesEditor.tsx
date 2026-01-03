'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, TrendingUp, Info } from 'lucide-react';
import SearchInput from "@/app/components/SearchInput";
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
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CRMStage, State, CRMStagesEditorProps, StageFormData } from '@/app/agentes/components/interfaces';
import CRMStagesList, { SortableStageItem } from '@/app/agentes/components/crm-stages/CRMStagesList';
import CRMStageModal from '@/app/agentes/components/crm-stages/CRMStageModal';
import api from '@/app/lib/api-client';

interface TemplateCRMStagesEditorProps {
    templateId: string;
    onUpdate: () => void;
}

export default function TemplateCRMStagesEditor({ templateId, onUpdate }: TemplateCRMStagesEditorProps) {
    const [stages, setStages] = useState<CRMStage[]>([]);
    const [availableStates, setAvailableStates] = useState<State[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingStage, setEditingStage] = useState<CRMStage | null>(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalError, setModalError] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        loadData();
    }, [templateId]);

    const loadData = async () => {
        try {
            setLoading(true);

            const [stagesData, statesData] = await Promise.all([
                api.get(`/agent-templates/${templateId}/crm-stages`),
                api.get(`/agent-templates/${templateId}/states`),
            ]);

            setStages(Array.isArray(stagesData) ? stagesData : []);
            setAvailableStates(Array.isArray(statesData) ? statesData : []);
        } catch (error) {
            console.error('Error loading data:', error);
            showMessage('error', 'Erro ao carregar dados');
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
                await api.put(`/agent-templates/${templateId}/crm-stages/reorder`, {
                    stages: newStages.map((s) => ({ id: s.id, order: s.order })),
                });
                onUpdate();
            } catch (error) {
                console.error('Error reordering stages:', error);
                showMessage('error', 'Erro ao reordenar etapas');
                loadData();
            }
        }
    };

    const handleOpenModal = (stage?: CRMStage) => {
        setEditingStage(stage || null);
        setModalError(null);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingStage(null);
    };

    const handleSave = async (data: StageFormData) => {
        setModalError(null);
        try {
            setSaving(true);
            if (editingStage) {
                await api.put(`/agent-templates/${templateId}/crm-stages/${editingStage.id}`, data);
                showMessage('success', 'Etapa atualizada!');
            } else {
                await api.post(`/agent-templates/${templateId}/crm-stages`, {
                    ...data,
                    order: stages.length,
                });
                showMessage('success', 'Etapa criada!');
            }
            handleCloseModal();
            loadData();
            onUpdate();
        } catch (error: any) {
            console.error('Error saving stage:', error);
            if (error.response?.data?.message) {
                setModalError(error.response.data.message);
            } else {
                showMessage('error', 'Erro ao salvar etapa');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta etapa? Os estados não serão excluídos.')) {
            return;
        }

        try {
            await api.delete(`/agent-templates/${templateId}/crm-stages/${id}`);
            showMessage('success', 'Etapa excluída!');
            loadData();
            onUpdate();
        } catch (error) {
            console.error('Error deleting stage:', error);
            showMessage('error', 'Erro ao excluir etapa');
        }
    };

    const filteredStages = stages.filter((stage) =>
        stage.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                            Organize os estados do seu agente em etapas do CRM. Arraste para reordenar.
                            Cada etapa pode conter múltiplos estados.
                        </p>
                    </div>
                </div>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Etapas do CRM</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {stages.length} etapa{stages.length !== 1 ? 's' : ''} criada{stages.length !== 1 ? 's' : ''}
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

            {/* Search Bar */}
            <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Pesquisar etapas..."
                className="max-w-md"
            />

            {/* Stages List with Drag and Drop */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={filteredStages.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <CRMStagesList
                        stages={filteredStages}
                        onEdit={handleOpenModal}
                        onDelete={handleDelete}
                    />
                </SortableContext>
            </DndContext>

            {/* Modal */}
            {showModal && (
                <CRMStageModal
                    stage={editingStage}
                    availableStates={availableStates}
                    onSave={handleSave}
                    onClose={handleCloseModal}
                    saving={saving}
                    stages={stages}
                    error={modalError}
                />
            )}
        </div>
    );
}