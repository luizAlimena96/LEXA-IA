'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Settings, Zap, Tag, ArrowRight, Globe, X, ChevronDown } from 'lucide-react';
import api from '@/app/lib/api-client';

interface CRMAutomation {
    id: string;
    name: string;
    triggerType: 'DATAKEY_MATCH' | 'STAGE_CHANGE' | 'STATE_CHANGE' | 'INACTIVITY' | 'LEAD_CREATED' | 'TAG_ADDED' | 'MESSAGE_RECEIVED';
    triggerCondition: {
        dataKey?: string;
        operator?: 'equals' | 'contains' | 'not_equals' | 'exists' | 'not_exists';
        value?: string;
        stageId?: string;
        stateId?: string;
        inactivityDays?: number;
        tagId?: string;
        keyword?: string;
    };
    actionType: 'ADD_TAG' | 'REMOVE_TAG' | 'MOVE_STAGE' | 'WEBHOOK' | 'SEND_MESSAGE';
    actionConfig: {
        tagId?: string;
        stageId?: string;
        webhookUrl?: string;
        message?: string;
        templateId?: string;
    };
    isActive: boolean;
}

interface CRMStage {
    id: string;
    name: string;
    color: string;
}

interface Tag {
    id: string;
    name: string;
    color: string;
}

interface CRMAutomationsManagerProps {
    agentId: string;
    organizationId: string;
    stages: CRMStage[];
    tags: Tag[];
    availableDataKeys?: string[];
    onRefresh: () => void;
}

export default function CRMAutomationsManager({
    agentId,
    organizationId,
    stages = [],
    tags = [],
    availableDataKeys = [],
    onRefresh
}: CRMAutomationsManagerProps) {
    const [automations, setAutomations] = useState<CRMAutomation[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAutomation, setEditingAutomation] = useState<Partial<CRMAutomation> | null>(null);
    const [isCreatingTag, setIsCreatingTag] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#6366f1');

    useEffect(() => {
        if (organizationId) {
            loadAutomations();
        }
    }, [organizationId, agentId]);

    const loadAutomations = async () => {
        try {
            setLoading(true);
            const data = await api.crm.automations.list(organizationId);

            if (!Array.isArray(data)) {
                console.error('CRM Automations data is not an array:', data);
                setAutomations([]);
                return;
            }

            const mapped = data.map((item: any) => ({
                id: item.id,
                name: item.name,
                isActive: item.isActive,
                triggerType: item.triggerType,
                triggerCondition: item.actions?.triggerCondition || {},
                actionType: item.actions?.actionType || 'ADD_TAG',
                actionConfig: item.actions?.actionConfig || {},
            }));

            setAutomations(mapped);
        } catch (error) {
            console.error('Error loading automations:', error);
        } finally {
            setLoading(false);
        }
    };



    const handleCreate = () => {
        setEditingAutomation({
            name: '',
            triggerType: 'DATAKEY_MATCH',
            triggerCondition: { operator: 'equals' },
            actionType: 'ADD_TAG',
            actionConfig: {},
            isActive: true
        });
        setShowModal(true);
    };

    const handleEdit = (automation: CRMAutomation) => {
        setEditingAutomation(automation);
        setIsCreatingTag(false);
        setNewTagName('');
        setNewTagColor('#6366f1');
        setShowModal(true);
    };

    const handleDeleteAutomation = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta automação?')) return;
        try {
            await api.crm.automations.delete(id, organizationId);
            loadAutomations();
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Erro ao excluir automação');
        }
    };

    const handleSaveAutomation = async () => {
        if (!editingAutomation?.name) {
            alert('Nome é obrigatório');
            return;
        }

        try {
            // Prepare payload
            // We stuff everything into 'actions' property because backend schema expects 'actions' Json
            // and has specific columns for triggerType etc.

            const payload = {
                name: editingAutomation.name,
                organizationId, // Pass organizationId explicitly
                triggerType: editingAutomation.triggerType,
                isActive: editingAutomation.isActive ?? true,
                crmStageId: editingAutomation.triggerCondition?.stageId || null, // For index updates
                agentStateId: editingAutomation.triggerCondition?.stateId || null,

                // Pack configuration into 'actions' JSON
                actions: {
                    triggerCondition: editingAutomation.triggerCondition,
                    actionType: editingAutomation.actionType,
                    actionConfig: {
                        ...editingAutomation.actionConfig,
                        // If creating new tag, we need to handle it first? 
                        // Logic below handles tag creation
                    }
                }
            };

            // Handle New Tag Creation
            if (editingAutomation.actionType === 'ADD_TAG' && isCreatingTag && newTagName) {
                const createdTag = await api.tags.create({
                    name: newTagName,
                    color: newTagColor,
                    organizationId // Assuming api.tags.create needs orgId or inferred from token
                });

                // Update payload with new tag ID
                // @ts-ignore
                payload.actions.actionConfig.tagId = createdTag.id;

                // Refresh global data
                onRefresh();
            }

            if (editingAutomation.id) {
                await api.crm.automations.update(editingAutomation.id, payload);
            } else {
                await api.crm.automations.create({
                    ...payload,
                    crmConfigId: null // Backend will find default
                });
            }

            setEditingAutomation(null);
            setIsCreatingTag(false);
            setNewTagName('');
            setShowModal(false);
            loadAutomations();
        } catch (error) {
            console.error('Error saving automation:', error);
            alert('Erro ao salvar automação');
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        try {
            await api.crm.automations.update(id, { isActive: !currentStatus });
            loadAutomations();
        } catch (error) {
            console.error('Error toggling automation status:', error);
            alert('Erro ao alterar status da automação');
        }
    };

    const getTriggerLabel = (automation: CRMAutomation) => {
        switch (automation.triggerType) {
            case 'DATAKEY_MATCH':
                return `${automation.triggerCondition.dataKey} ${automation.triggerCondition.operator} "${automation.triggerCondition.value}"`;
            case 'STAGE_CHANGE':
                const stage = Array.isArray(stages) ? stages.find(s => s.id === automation.triggerCondition.stageId) : null;
                return `Entra na etapa "${stage?.name || 'Desconhecida'}"`;
            case 'INACTIVITY':
                return `Inativo há ${automation.triggerCondition.inactivityDays} dias`;
            default:
                return automation.triggerType;
        }
    };

    const getActionLabel = (automation: CRMAutomation) => {
        switch (automation.actionType) {
            case 'ADD_TAG':
                const tag = Array.isArray(tags) ? tags.find(t => t.id === automation.actionConfig.tagId) : null;
                return `Adicionar tag "${tag?.name || 'Desconhecida'}"`;
            case 'REMOVE_TAG':
                const tagRemove = Array.isArray(tags) ? tags.find(t => t.id === automation.actionConfig.tagId) : null;
                return `Remover tag "${tagRemove?.name || 'Desconhecida'}"`;
            case 'MOVE_STAGE':
                const targetStage = Array.isArray(stages) ? stages.find(s => s.id === automation.actionConfig.stageId) : null;
                return `Mover para "${targetStage?.name || 'Desconhecida'}"`;
            case 'WEBHOOK':
                return `Webhook: ${automation.actionConfig.webhookUrl?.substring(0, 30)}...`;
            default:
                return automation.actionType;
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-transparent">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Automações</h3>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Nova
                </button>
            </div>

            {automations.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    Nenhuma automação configurada
                </p>
            ) : (
                <div className="space-y-2">
                    {automations.map(automation => (
                        <div
                            key={automation.id}
                            className={`bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-transparent ${!automation.isActive ? 'opacity-50' : ''}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900 dark:text-white text-sm">{automation.name}</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleToggle(automation.id, automation.isActive)}
                                        className={`w-8 h-4 rounded-full transition-colors ${automation.isActive ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-600'
                                            }`}
                                    >
                                        <div className={`w-3 h-3 bg-white rounded-full transition-transform ${automation.isActive ? 'translate-x-4' : 'translate-x-0.5'
                                            }`} />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(automation)}
                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                    >
                                        <Settings className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteAutomation(automation.id)}
                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-red-500 dark:text-red-400"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="text-gray-500 dark:text-gray-400">{getTriggerLabel(automation)}</span>
                                <ArrowRight className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                                <span className="text-indigo-600 dark:text-indigo-400">{getActionLabel(automation)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && editingAutomation && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-200 dark:border-transparent">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {editingAutomation.id ? 'Editar Automação' : 'Nova Automação'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                                <input
                                    type="text"
                                    value={editingAutomation.name || ''}
                                    onChange={(e) => setEditingAutomation({ ...editingAutomation, name: e.target.value })}
                                    placeholder="Ex: Tag Premium para interessados"
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                />
                            </div>

                            {/* Trigger Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quando</label>
                                <select
                                    value={editingAutomation.triggerType}
                                    onChange={(e) => setEditingAutomation({
                                        ...editingAutomation,
                                        triggerType: e.target.value as any,
                                        triggerCondition: { operator: 'equals' }
                                    })}
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                                >
                                    <option value="DATAKEY_MATCH">DataKey tem valor</option>
                                    <option value="STAGE_CHANGE">Lead entra na etapa</option>
                                    <option value="INACTIVITY">Lead inativo por X dias</option>
                                    <option value="LEAD_CREATED">Novo Lead Criado</option>
                                    <option value="TAG_ADDED">Tag Adicionada</option>
                                    <option value="MESSAGE_RECEIVED">Mensagem Recebida</option>
                                </select>
                            </div>

                            {/* Trigger Condition */}
                            {editingAutomation.triggerType === 'TAG_ADDED' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Qual Tag?</label>
                                    <select
                                        value={editingAutomation.triggerCondition?.tagId || ''}
                                        onChange={(e) => setEditingAutomation({
                                            ...editingAutomation,
                                            triggerCondition: { ...editingAutomation.triggerCondition, tagId: e.target.value }
                                        })}
                                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                                    >
                                        <option value="">Qualquer Tag</option>
                                        {Array.isArray(tags) && tags.map(tag => (
                                            <option key={tag.id} value={tag.id}>{tag.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {editingAutomation.triggerType === 'MESSAGE_RECEIVED' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contém texto (opcional)</label>
                                    <input
                                        type="text"
                                        value={editingAutomation.triggerCondition?.keyword || ''}
                                        onChange={(e) => setEditingAutomation({
                                            ...editingAutomation,
                                            triggerCondition: { ...editingAutomation.triggerCondition, keyword: e.target.value }
                                        })}
                                        placeholder="Ex: preço, comprar, olá"
                                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Deixe vazio para qualquer mensagem</p>
                                </div>
                            )}
                            {editingAutomation.triggerType === 'DATAKEY_MATCH' && (
                                <div className="grid grid-cols-3 gap-2">
                                    <input
                                        type="text"
                                        value={editingAutomation.triggerCondition?.dataKey || ''}
                                        onChange={(e) => setEditingAutomation({
                                            ...editingAutomation,
                                            triggerCondition: { ...editingAutomation.triggerCondition, dataKey: e.target.value }
                                        })}
                                        placeholder="dataKey"

                                        list="availableDataKeys"
                                        className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                    />
                                    <datalist id="availableDataKeys">
                                        {Array.isArray(availableDataKeys) && availableDataKeys.map(key => (
                                            <option key={key} value={key} />
                                        ))}
                                    </datalist>
                                    <select
                                        value={editingAutomation.triggerCondition?.operator || 'equals'}
                                        onChange={(e) => setEditingAutomation({
                                            ...editingAutomation,
                                            triggerCondition: { ...editingAutomation.triggerCondition, operator: e.target.value as any }
                                        })}
                                        className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                                    >
                                        <option value="equals">=</option>
                                        <option value="contains">contém</option>
                                        <option value="exists">existe</option>
                                        <option value="not_exists">não existe</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={editingAutomation.triggerCondition?.value || ''}
                                        onChange={(e) => setEditingAutomation({
                                            ...editingAutomation,
                                            triggerCondition: { ...editingAutomation.triggerCondition, value: e.target.value }
                                        })}
                                        placeholder="valor"
                                        className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                    />
                                </div>
                            )}

                            {editingAutomation.triggerType === 'STAGE_CHANGE' && (
                                <select
                                    value={editingAutomation.triggerCondition?.stageId || ''}
                                    onChange={(e) => setEditingAutomation({
                                        ...editingAutomation,
                                        triggerCondition: { ...editingAutomation.triggerCondition, stageId: e.target.value }
                                    })}
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                                >
                                    <option value="">Selecione uma etapa</option>
                                    {Array.isArray(stages) && stages.map(stage => (
                                        <option key={stage.id} value={stage.id}>{stage.name}</option>
                                    ))}
                                </select>
                            )}

                            {editingAutomation.triggerType === 'INACTIVITY' && (
                                <input
                                    type="number"
                                    value={editingAutomation.triggerCondition?.inactivityDays || 3}
                                    onChange={(e) => setEditingAutomation({
                                        ...editingAutomation,
                                        triggerCondition: { ...editingAutomation.triggerCondition, inactivityDays: parseInt(e.target.value) }
                                    })}
                                    placeholder="Dias de inatividade"
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                />
                            )}

                            {/* Action Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Então</label>
                                <select
                                    value={editingAutomation.actionType}
                                    onChange={(e) => setEditingAutomation({
                                        ...editingAutomation,
                                        actionType: e.target.value as any,
                                        actionConfig: {}
                                    })}
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                                >
                                    <option value="ADD_TAG">Adicionar Tag</option>
                                    <option value="REMOVE_TAG">Remover Tag</option>
                                    <option value="MOVE_STAGE">Mover para Etapa</option>
                                    <option value="SEND_MESSAGE">Enviar Mensagem</option>
                                    <option value="WEBHOOK">Enviar Webhook</option>
                                </select>
                            </div>

                            {/* Action Config */}
                            {editingAutomation.actionType === 'SEND_MESSAGE' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mensagem</label>
                                    <textarea
                                        value={editingAutomation.actionConfig?.message || ''}
                                        onChange={(e) => setEditingAutomation({
                                            ...editingAutomation,
                                            actionConfig: { ...editingAutomation.actionConfig, message: e.target.value }
                                        })}
                                        placeholder="Digite a mensagem para enviar..."
                                        rows={3}
                                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Dica: Use {"{{name}}"} para inserir o nome do lead.</p>
                                </div>
                            )}
                            {(editingAutomation.actionType === 'ADD_TAG') && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="createTag"
                                            checked={isCreatingTag}
                                            onChange={(e) => setIsCreatingTag(e.target.checked)}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="createTag" className="text-sm text-gray-700 dark:text-gray-300">
                                            Criar nova tag
                                        </label>
                                    </div>

                                    {isCreatingTag ? (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newTagName}
                                                onChange={(e) => setNewTagName(e.target.value)}
                                                placeholder="Nome da tag"
                                                className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                                            />
                                            <input
                                                type="color"
                                                value={newTagColor}
                                                onChange={(e) => setNewTagColor(e.target.value)}
                                                className="h-9 w-9 p-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                                            />
                                        </div>
                                    ) : (
                                        <select
                                            value={editingAutomation.actionConfig?.tagId || ''}
                                            onChange={(e) => setEditingAutomation({
                                                ...editingAutomation,
                                                actionConfig: { tagId: e.target.value }
                                            })}
                                            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                                        >
                                            <option value="">Selecione uma tag</option>
                                            {Array.isArray(tags) && tags.map(tag => (
                                                <option key={tag.id} value={tag.id}>{tag.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}

                            {editingAutomation.actionType === 'REMOVE_TAG' && (
                                <select
                                    value={editingAutomation.actionConfig?.tagId || ''}
                                    onChange={(e) => setEditingAutomation({
                                        ...editingAutomation,
                                        actionConfig: { tagId: e.target.value }
                                    })}
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                                >
                                    <option value="">Selecione a tag para remover</option>
                                    {Array.isArray(tags) && tags.map(tag => (
                                        <option key={tag.id} value={tag.id}>{tag.name}</option>
                                    ))}
                                </select>
                            )}

                            {editingAutomation.actionType === 'MOVE_STAGE' && (
                                <select
                                    value={editingAutomation.actionConfig?.stageId || ''}
                                    onChange={(e) => setEditingAutomation({
                                        ...editingAutomation,
                                        actionConfig: { stageId: e.target.value }
                                    })}
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                                >
                                    <option value="">Selecione uma etapa</option>
                                    {Array.isArray(stages) && stages.map(stage => (
                                        <option key={stage.id} value={stage.id}>{stage.name}</option>
                                    ))}
                                </select>
                            )}

                            {editingAutomation.actionType === 'WEBHOOK' && (
                                <input
                                    type="url"
                                    value={editingAutomation.actionConfig?.webhookUrl || ''}
                                    onChange={(e) => setEditingAutomation({
                                        ...editingAutomation,
                                        actionConfig: { webhookUrl: e.target.value }
                                    })}
                                    placeholder="https://hooks.zapier.com/..."
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                />
                            )}
                        </div>

                        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveAutomation}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
