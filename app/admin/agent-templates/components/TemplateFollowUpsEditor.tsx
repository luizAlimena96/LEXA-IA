'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Clock, Loader2 } from 'lucide-react';
import api from '@/app/lib/api-client';
import FollowupModal from '@/app/agentes/components/modals/FollowupModal';
import type { AgentFollowUp } from '@/app/types';

interface TemplateFollowUpsEditorProps {
    templateId: string;
    onUpdate: () => void;
}

export default function TemplateFollowUpsEditor({ templateId, onUpdate }: TemplateFollowUpsEditorProps) {
    const [followups, setFollowups] = useState<AgentFollowUp[]>([]);
    const [crmStages, setCrmStages] = useState<Array<{ id: string; name: string; color: string; order: number }>>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<AgentFollowUp | null>(null);
    const [followupForm, setFollowupForm] = useState({
        name: '',
        message: '',
        isActive: true,
        crmStageId: null as string | null,
        triggerMode: 'TIMER',
        delayMinutes: 60,
        scheduledTime: '',
        mediaItems: [] as any[],
        businessHoursEnabled: false,
        businessHoursStart: '08:00',
        businessHoursEnd: '18:00',
        aiDecisionEnabled: false,
        aiDecisionPrompt: '',
    });

    useEffect(() => {
        loadData();
    }, [templateId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [followupsData, stagesData] = await Promise.all([
                api.get(`/agent-templates/${templateId}/followups`) as Promise<AgentFollowUp[]>,
                api.get(`/agent-templates/${templateId}/crm-stages`) as Promise<any[]>
            ]);
            setFollowups(Array.isArray(followupsData) ? followupsData : []);
            setCrmStages(Array.isArray(stagesData) ? stagesData : []);
        } catch (error) {
            console.error('Erro ao carregar follow-ups:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = (crmStageId?: string) => {
        setEditingItem(null);
        setFollowupForm({
            name: '',
            message: '',
            isActive: true,
            crmStageId: crmStageId || null,
            triggerMode: 'TIMER',
            delayMinutes: 60,
            scheduledTime: '',
            mediaItems: [],
            businessHoursEnabled: false,
            businessHoursStart: '08:00',
            businessHoursEnd: '18:00',
            aiDecisionEnabled: false,
            aiDecisionPrompt: '',
        });
        setShowModal(true);
    };

    const handleEdit = (item: AgentFollowUp) => {
        setEditingItem(item);
        setFollowupForm({
            name: item.name,
            message: item.message || '',
            isActive: item.isActive,
            crmStageId: item.crmStageId || null,
            triggerMode: item.triggerMode || 'TIMER',
            delayMinutes: item.delayMinutes || 60,
            scheduledTime: item.scheduledTime || '',
            mediaItems: item.mediaItems || [],
            businessHoursEnabled: item.businessHoursEnabled || false,
            businessHoursStart: item.businessHoursStart || '08:00',
            businessHoursEnd: item.businessHoursEnd || '18:00',
            aiDecisionEnabled: item.aiDecisionEnabled || false,
            aiDecisionPrompt: item.aiDecisionPrompt || '',
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        const hasMessage = followupForm.message?.trim();
        const hasAiPrompt = followupForm.aiDecisionEnabled && followupForm.aiDecisionPrompt?.trim();

        if (!followupForm.name.trim()) {
            alert('Preencha o nome do follow-up');
            return;
        }

        if (!hasMessage && !hasAiPrompt) {
            alert('Preencha a mensagem ou habilite IA com prompt');
            return;
        }

        try {
            const data = {
                name: followupForm.name,
                triggerMode: followupForm.triggerMode,
                delayMinutes: followupForm.delayMinutes,
                scheduledTime: followupForm.scheduledTime,
                messageTemplate: followupForm.message,
                mediaItems: followupForm.mediaItems,
                businessHoursEnabled: followupForm.businessHoursEnabled,
                businessHoursStart: followupForm.businessHoursStart,
                businessHoursEnd: followupForm.businessHoursEnd,
                isActive: followupForm.isActive,
                crmStageId: followupForm.crmStageId || undefined,
                aiDecisionEnabled: followupForm.aiDecisionEnabled,
                aiDecisionPrompt: followupForm.aiDecisionPrompt,
            };

            if (editingItem) {
                await api.put(`/agent-templates/${templateId}/followups/${editingItem.id}`, data);
            } else {
                if (!followupForm.crmStageId) {
                    alert('Erro: É obrigatório vincular a uma etapa CRM');
                    return;
                }
                await api.post(`/agent-templates/${templateId}/followups`, data);
            }

            setShowModal(false);
            loadData();
            onUpdate();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Erro ao salvar follow-up');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este follow-up?')) return;

        try {
            await api.delete(`/agent-templates/${templateId}/followups/${id}`);
            loadData();
            onUpdate();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Erro ao excluir follow-up');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Follow-ups Automáticos</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Configure mensagens automáticas de acompanhamento
                    </p>
                </div>
                <button
                    onClick={() => handleCreate()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                >
                    <Plus className="w-5 h-5" />
                    Novo Follow-up
                </button>
            </div>

            {/* CRM Stages Tabs */}
            {crmStages.length > 0 && (
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="flex gap-4 overflow-x-auto">
                        {crmStages.map((stage) => {
                            const stageFollowups = followups.filter(f => f.crmStageId === stage.id);
                            return (
                                <button
                                    key={stage.id}
                                    onClick={() => handleCreate(stage.id)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:border-indigo-500 transition-colors whitespace-nowrap"
                                >
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: stage.color }}
                                    />
                                    <span className="text-gray-700 dark:text-gray-300">{stage.name}</span>
                                    {stageFollowups.length > 0 && (
                                        <span className="px-2 py-0.5 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">
                                            {stageFollowups.length}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            )}

            {followups.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Nenhum follow-up configurado
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Crie follow-ups automáticos para engajar seus leads
                    </p>
                    <button
                        onClick={() => handleCreate()}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Criar Primeiro Follow-up
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {followups.map((item) => {
                        const stage = crmStages.find(s => s.id === item.crmStageId);
                        return (
                            <div
                                key={item.id}
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {item.name}
                                            </h3>
                                            <span className={`px-2 py-1 text-xs font-medium rounded ${item.isActive
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                }`}>
                                                {item.isActive ? 'Ativo' : 'Inativo'}
                                            </span>
                                            {stage && (
                                                <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                                    <div
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: stage.color }}
                                                    />
                                                    {stage.name}
                                                </span>
                                            )}
                                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                                {item.triggerMode === 'TIMER' ? `${item.delayMinutes}min` : 'Agendado'}
                                            </span>
                                            {item.businessHoursEnabled && (
                                                <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                                                    Horário Comercial
                                                </span>
                                            )}
                                            {item.aiDecisionEnabled && (
                                                <span className="px-2 py-1 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded">
                                                    AI Decision
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                                            {item.message || item.aiDecisionPrompt}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Follow-up Modal */}
            {showModal && (
                <FollowupModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                    isEditing={!!editingItem}
                    form={followupForm}
                    onFormChange={setFollowupForm}
                    agentId={templateId}
                />
            )}
        </div>
    );
}

