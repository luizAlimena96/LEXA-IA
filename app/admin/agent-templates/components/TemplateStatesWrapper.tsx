'use client';

import { useState, useEffect } from 'react';
import api from '@/app/lib/api-client';
import StatesTab from './TemplateStatesTab';
import StateModal from './TemplateStateModal';
import type { AgentState } from '@/app/agentes/components/interfaces';

interface TemplateStatesWrapperProps {
    templateId: string;
    onUpdate: () => void;
}

export default function TemplateStatesWrapper({ templateId, onUpdate }: TemplateStatesWrapperProps) {
    const [states, setStates] = useState<AgentState[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingState, setEditingState] = useState<AgentState | null>(null);
    const [stateForm, setStateForm] = useState<any>({
        name: '',
        missionPrompt: '',
        dataKey: '',
        dataType: '',
        dataDescription: '',
        availableRoutes: {
            rota_de_sucesso: [],
            rota_de_persistencia: [],
            rota_de_escape: [],
        },
        tools: undefined,
        mediaItems: undefined,
        mediaTiming: 'after',
        prohibitions: '',
        responseType: '',
    });

    useEffect(() => {
        loadStates();
    }, [templateId]);

    const loadStates = async () => {
        try {
            setLoading(true);
            const data = await api.get(`/agent-templates/${templateId}/states`);
            setStates(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Erro ao carregar estados:', error);
            setStates([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingState(null);
        setStateForm({
            name: '',
            missionPrompt: '',
            dataKey: '',
            dataType: '',
            dataDescription: '',
            availableRoutes: {
                rota_de_sucesso: [],
                rota_de_persistencia: [],
                rota_de_escape: [],
            },
            tools: undefined,
            mediaItems: undefined,
            mediaTiming: 'after',
            prohibitions: '',
            responseType: '',
        });
        setShowModal(true);
    };

    const handleEdit = (state: AgentState) => {
        setEditingState(state);
        setStateForm({
            name: state.name,
            missionPrompt: state.missionPrompt,
            dataKey: state.dataKey || '',
            dataType: state.dataType || '',
            dataDescription: state.dataDescription || '',
            availableRoutes: state.availableRoutes || {
                rota_de_sucesso: [],
                rota_de_persistencia: [],
                rota_de_escape: [],
            },
            tools: state.tools,
            mediaItems: state.mediaItems,
            mediaTiming: state.mediaTiming || 'after',
            prohibitions: state.prohibitions || '',
            responseType: state.responseType || '',
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            const dataToSave = {
                ...stateForm,
                templateId,
                order: editingState ? editingState.order : states.length + 1,
            };

            if (editingState) {
                await api.put(`/agent-templates/${templateId}/states/${editingState.id}`, dataToSave);
            } else {
                await api.post(`/agent-templates/${templateId}/states`, dataToSave);
            }

            setShowModal(false);
            loadStates();
            onUpdate();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Erro ao salvar estado');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/agent-templates/${templateId}/states/${id}`);
            loadStates();
            onUpdate();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Erro ao excluir estado');
        }
    };

    const handleReorder = async (newStates: AgentState[]) => {
        try {
            setStates(newStates);
            await api.put(`/agent-templates/${templateId}/states/reorder`, {
                states: newStates.map((s, idx) => ({ id: s.id, order: idx + 1 })),
            });
            onUpdate();
        } catch (error: any) {
            console.error('Erro ao reordenar estados:', error);
            loadStates();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <>
            <StatesTab
                items={states}
                onCreate={handleCreate}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReorder={handleReorder}
            />

            {showModal && (
                <StateModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                    editing={editingState}
                    form={stateForm}
                    onFormChange={setStateForm}
                    availableStates={states.map(s => s.name)}
                />
            )}
        </>
    );
}
