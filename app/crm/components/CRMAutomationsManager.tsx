'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Settings, Zap, Tag, ArrowRight, Globe, X, ChevronDown, Loader2, RefreshCw } from 'lucide-react';
import api from '@/app/lib/api-client';

interface CRMAutomation {
    id: string;
    name: string;
    triggerType: 'DATAKEY_MATCH' | 'STAGE_CHANGE' | 'STATE_CHANGE' | 'INACTIVITY' | 'LEAD_CREATED' | 'TAG_ADDED' | 'MESSAGE_RECEIVED';
    isLegacyOrComplex?: boolean; // New flag
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
    onClose?: () => void;
}

export default function CRMAutomationsManager({
    agentId,
    organizationId,
    stages = [],
    tags = [],
    availableDataKeys = [],
    onRefresh,
    onClose
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

    // ... (rest of methods unchanged)
    const loadAutomations = async () => {
        try {
            setLoading(true);
            setAutomations([]); // Clear previous to avoid stale ID actions
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
                // Check if actions is an array (legacy/complex) or object (standard)
                isLegacyOrComplex: Array.isArray(item.actions),
                triggerCondition: !Array.isArray(item.actions) ? (item.actions?.triggerCondition || {}) : {},
                actionType: !Array.isArray(item.actions) ? (item.actions?.actionType || 'ADD_TAG') : 'COMPLEX_ACTION',
                actionConfig: !Array.isArray(item.actions) ? (item.actions?.actionConfig || {}) : {},
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

    // ... (rest of methods)

    const handleEdit = (automation: CRMAutomation) => {
        setEditingAutomation(automation);
        setIsCreatingTag(false);
        setNewTagName('');
        setNewTagColor('#6366f1');
        setShowModal(true);
    };

    const handleDeleteAutomation = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta automação?')) return;

        if (!organizationId) {
            console.error('[CRM Manager] Blocked: Invalid Organization ID', organizationId);
            alert('Erro: ID da organização inválido. Recarregue a página.');
            return;
        }

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

        // Validation
        if (editingAutomation.triggerType === 'STAGE_CHANGE' && !editingAutomation.triggerCondition?.stageId) {
            alert('Selecione uma etapa para o gatilho');
            return;
        }
        if (editingAutomation.triggerType === 'TAG_ADDED' && !editingAutomation.triggerCondition?.tagId) {

        }
        if (editingAutomation.triggerType === 'DATAKEY_MATCH' && !editingAutomation.triggerCondition?.dataKey) {
            alert('Informe a DataKey');
            return;
        }

        if (editingAutomation.actionType === 'MOVE_STAGE' && !editingAutomation.actionConfig?.stageId) {
            alert('Selecione a etapa de destino');
            return;
        }
        if ((editingAutomation.actionType === 'ADD_TAG' || editingAutomation.actionType === 'REMOVE_TAG') && !isCreatingTag && !editingAutomation.actionConfig?.tagId) {
            alert('Selecione uma tag');
            return;
        }
        if (editingAutomation.actionType === 'SEND_MESSAGE' && !editingAutomation.actionConfig?.message) {
            alert('Digite a mensagem');
            return;
        }

        try {
            // Verify IDs against loaded lists to prevent Foreign Key errors (stale IDs)
            const safeStageId = (Array.isArray(stages) ? stages : []).find(s => s.id === editingAutomation.triggerCondition?.stageId)?.id || null;
            const safeStateId = editingAutomation.triggerCondition?.stateId || null; // State validation hard without state list, usually safe

            // Prepare payload
            // We stuff everything into 'actions' property because backend schema expects 'actions' Json
            const payload = {
                name: editingAutomation.name,
                organizationId,
                triggerType: editingAutomation.triggerType,
                isActive: editingAutomation.isActive ?? true,
                crmStageId: safeStageId, // Only use valid stage ID
                agentStateId: safeStateId,

                // Pack configuration into 'actions' JSON
                actions: {
                    triggerCondition: {
                        ...editingAutomation.triggerCondition,
                        stageId: safeStageId // Ensure consistency
                    },
                    actionType: editingAutomation.actionType,
                    actionConfig: {
                        ...editingAutomation.actionConfig,
                    }
                }
            };

            // Handle New Tag Creation
            if (editingAutomation.actionType === 'ADD_TAG' && isCreatingTag && newTagName) {
                const createdTag = await api.tags.create({
                    name: newTagName,
                    color: newTagColor,
                    organizationId
                });

                // Update payload with new tag ID
                // @ts-ignore
                payload.actions.actionConfig.tagId = createdTag.id;

                // Refresh global data
                onRefresh();
            } else if (editingAutomation.actionType === 'ADD_TAG' || editingAutomation.actionType === 'REMOVE_TAG') {
                // Validate existing Tag ID
                const validTag = (Array.isArray(tags) ? tags : []).find(t => t.id === editingAutomation.actionConfig?.tagId);
                if (!validTag) {
                    // If tag not found (and not creating new), alert or clear?
                    // Validation above already checks existence, but double check for FK safety
                    // If we are here, validation passed or ignored. 
                    // If invalid, we shouldn't send it if possible, but action requires it.
                    // Let DB throw error? Or rely on validation block we added earlier.
                    // We trust validation block for required fields.
                }
            }

            if (editingAutomation.id) {
                await api.crm.automations.update(editingAutomation.id, payload);
            } else {
                await api.crm.automations.create({
                    ...payload,
                    crmConfigId: null
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
        if (automation.isLegacyOrComplex) return 'Ação Ext. / Complexa';
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
        <div className="bg-white dark:bg-gray-800 rounded-xl flex flex-col h-[80vh] border border-gray-200 dark:border-transparent overflow-hidden">
            <div className="flex-none p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Gerenciar Automações</h3>
                    <button onClick={onRefresh} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X className="w-6 h-6" />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <button
                    onClick={handleCreate}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-4 text-sm font-medium bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg border-dashed transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Criar Nova Automação
                </button>


                {
                    loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-500" />
                        </div>
                    ) : automations.length === 0 ? (
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
                                                disabled={automation.isLegacyOrComplex}
                                                className={`p-1 rounded ${automation.isLegacyOrComplex ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                                title={automation.isLegacyOrComplex ? "Edição indisponível para este formato" : "Editar"}
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
                    )
                }

                {/* Modal */}
                {
                    showModal && editingAutomation && (
                        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] border border-gray-200 dark:border-transparent animate-in fade-in zoom-in duration-200">
                                <div className="flex-none flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {editingAutomation.id ? 'Editar Automação' : 'Nova Automação'}
                                    </h2>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Nome da Automação</label>
                                        <input
                                            type="text"
                                            value={editingAutomation.name || ''}
                                            onChange={(e) => setEditingAutomation({ ...editingAutomation, name: e.target.value })}
                                            placeholder="Ex: Mover para Agendados ao receber interesse"
                                            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                                        />
                                    </div>

                                    {/* Trigger Section */}
                                    <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30 space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                            <span className="text-sm font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wide">Gatilho (Quando...)</span>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tipo de Evento</label>
                                            <select
                                                value={editingAutomation.triggerType}
                                                onChange={(e) => setEditingAutomation({
                                                    ...editingAutomation,
                                                    triggerType: e.target.value as any,
                                                    triggerCondition: { operator: 'equals' }
                                                })}
                                                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                            >
                                                <option value="DATAKEY_MATCH">DataKey tem valor específico</option>
                                                <option value="STAGE_CHANGE">Lead entra em uma etapa</option>
                                                <option value="INACTIVITY">Lead inativo por X dias</option>
                                                <option value="LEAD_CREATED">Novo Lead é criado</option>
                                                <option value="TAG_ADDED">Tag é adicionada</option>
                                                <option value="MESSAGE_RECEIVED">Mensagem é recebida</option>
                                            </select>
                                        </div>

                                        {/* Trigger Condition */}
                                        {editingAutomation.triggerType === 'TAG_ADDED' && (
                                            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Qual Tag verificar?</label>
                                                <select
                                                    value={editingAutomation.triggerCondition?.tagId || ''}
                                                    onChange={(e) => setEditingAutomation({
                                                        ...editingAutomation,
                                                        triggerCondition: { ...editingAutomation.triggerCondition, tagId: e.target.value }
                                                    })}
                                                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white"
                                                >
                                                    <option value="">Qualquer Tag</option>
                                                    {(Array.isArray(tags) ? tags : []).map(tag => (
                                                        <option key={tag.id} value={tag.id}>{tag.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {editingAutomation.triggerType === 'MESSAGE_RECEIVED' && (
                                            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Contém texto (opcional)</label>
                                                <input
                                                    type="text"
                                                    value={editingAutomation.triggerCondition?.keyword || ''}
                                                    onChange={(e) => setEditingAutomation({
                                                        ...editingAutomation,
                                                        triggerCondition: { ...editingAutomation.triggerCondition, keyword: e.target.value }
                                                    })}
                                                    placeholder="Ex: preço, comprar, olá"
                                                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Deixe vazio para qualquer mensagem</p>
                                            </div>
                                        )}
                                        {editingAutomation.triggerType === 'DATAKEY_MATCH' && (
                                            <div className="grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <input
                                                    type="text"
                                                    value={editingAutomation.triggerCondition?.dataKey || ''}
                                                    onChange={(e) => setEditingAutomation({
                                                        ...editingAutomation,
                                                        triggerCondition: { ...editingAutomation.triggerCondition, dataKey: e.target.value }
                                                    })}
                                                    placeholder="dataKey"
                                                    list="availableDataKeys"
                                                    className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                                />
                                                <datalist id="availableDataKeys">
                                                    {(Array.isArray(availableDataKeys) ? availableDataKeys : []).map(key => (
                                                        <option key={key} value={key} />
                                                    ))}
                                                </datalist>
                                                <select
                                                    value={editingAutomation.triggerCondition?.operator || 'equals'}
                                                    onChange={(e) => setEditingAutomation({
                                                        ...editingAutomation,
                                                        triggerCondition: { ...editingAutomation.triggerCondition, operator: e.target.value as any }
                                                    })}
                                                    className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white"
                                                >
                                                    <option value="equals">igual a</option>
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
                                                    className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                                />
                                            </div>
                                        )}

                                        {editingAutomation.triggerType === 'STAGE_CHANGE' && (
                                            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Qual etapa?</label>
                                                <select
                                                    value={editingAutomation.triggerCondition?.stageId || ''}
                                                    onChange={(e) => setEditingAutomation({
                                                        ...editingAutomation,
                                                        triggerCondition: { ...editingAutomation.triggerCondition, stageId: e.target.value }
                                                    })}
                                                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white"
                                                >
                                                    <option value="">Selecione uma etapa</option>
                                                    {(Array.isArray(stages) ? stages : []).map(stage => (
                                                        <option key={stage.id} value={stage.id}>{stage.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {editingAutomation.triggerType === 'INACTIVITY' && (
                                            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Dias sem interação</label>
                                                <input
                                                    type="number"
                                                    value={editingAutomation.triggerCondition?.inactivityDays || 3}
                                                    onChange={(e) => setEditingAutomation({
                                                        ...editingAutomation,
                                                        triggerCondition: { ...editingAutomation.triggerCondition, inactivityDays: parseInt(e.target.value) }
                                                    })}
                                                    placeholder="Dias de inatividade"
                                                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Section */}
                                    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <ArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                            <span className="text-sm font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wide">Ação (Então...)</span>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">O que deve acontecer?</label>
                                            <select
                                                value={editingAutomation.actionType}
                                                onChange={(e) => setEditingAutomation({
                                                    ...editingAutomation,
                                                    actionType: e.target.value as any,
                                                    actionConfig: {}
                                                })}
                                                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                            >
                                                <option value="ADD_TAG">Adicionar uma Tag</option>
                                                <option value="REMOVE_TAG">Remover uma Tag</option>
                                                <option value="MOVE_STAGE">Mover para outra Etapa</option>
                                                <option value="SEND_MESSAGE">Enviar Mensagem (WhatsApp)</option>
                                                <option value="WEBHOOK">Disparar Webhook</option>
                                            </select>
                                        </div>

                                        {/* Action Config */}
                                        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                            {editingAutomation.actionType === 'SEND_MESSAGE' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Conteúdo da Mensagem</label>
                                                    <textarea
                                                        value={editingAutomation.actionConfig?.message || ''}
                                                        onChange={(e) => setEditingAutomation({
                                                            ...editingAutomation,
                                                            actionConfig: { ...editingAutomation.actionConfig, message: e.target.value }
                                                        })}
                                                        placeholder="Digite a mensagem para enviar..."
                                                        rows={4}
                                                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:ring-2 focus:ring-emerald-500 outline-none"
                                                    />
                                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1">
                                                        <Tag className="w-3 h-3" />
                                                        Dica: Use {"{{name}}"} para inserir o nome do lead.
                                                    </p>
                                                </div>
                                            )}

                                            {(editingAutomation.actionType === 'ADD_TAG') && (
                                                <div className="space-y-3">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Configuração da Tag</label>
                                                    <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                                        <input
                                                            type="checkbox"
                                                            id="createTag"
                                                            checked={isCreatingTag}
                                                            onChange={(e) => setIsCreatingTag(e.target.checked)}
                                                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                                                        />
                                                        <label htmlFor="createTag" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                                                            Criar uma nova tag
                                                        </label>
                                                    </div>

                                                    {isCreatingTag ? (
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={newTagName}
                                                                onChange={(e) => setNewTagName(e.target.value)}
                                                                placeholder="Nome da nova tag"
                                                                className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white"
                                                            />
                                                            <input
                                                                type="color"
                                                                value={newTagColor}
                                                                onChange={(e) => setNewTagColor(e.target.value)}
                                                                className="h-10 w-12 p-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <select
                                                            value={editingAutomation.actionConfig?.tagId || ''}
                                                            onChange={(e) => setEditingAutomation({
                                                                ...editingAutomation,
                                                                actionConfig: { tagId: e.target.value }
                                                            })}
                                                            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white"
                                                        >
                                                            <option value="">Selecione uma tag existente</option>
                                                            {(Array.isArray(tags) ? tags : []).map(tag => (
                                                                <option key={tag.id} value={tag.id}>{tag.name}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>
                                            )}

                                            {editingAutomation.actionType === 'REMOVE_TAG' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Qual tag remover?</label>
                                                    <select
                                                        value={editingAutomation.actionConfig?.tagId || ''}
                                                        onChange={(e) => setEditingAutomation({
                                                            ...editingAutomation,
                                                            actionConfig: { tagId: e.target.value }
                                                        })}
                                                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white"
                                                    >
                                                        <option value="">Selecione a tag</option>
                                                        {(Array.isArray(tags) ? tags : []).map(tag => (
                                                            <option key={tag.id} value={tag.id}>{tag.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {editingAutomation.actionType === 'MOVE_STAGE' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Para qual etapa?</label>
                                                    <select
                                                        value={editingAutomation.actionConfig?.stageId || ''}
                                                        onChange={(e) => setEditingAutomation({
                                                            ...editingAutomation,
                                                            actionConfig: { stageId: e.target.value }
                                                        })}
                                                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white"
                                                    >
                                                        <option value="">Selecione a etapa de destino</option>
                                                        {(Array.isArray(stages) ? stages : []).map(stage => (
                                                            <option key={stage.id} value={stage.id}>{stage.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {editingAutomation.actionType === 'WEBHOOK' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">URL do Webhook</label>
                                                    <input
                                                        type="url"
                                                        value={editingAutomation.actionConfig?.webhookUrl || ''}
                                                        onChange={(e) => setEditingAutomation({
                                                            ...editingAutomation,
                                                            actionConfig: { webhookUrl: e.target.value }
                                                        })}
                                                        placeholder="https://hooks.zapier.com/..."
                                                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-none flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm">
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSaveAutomation}
                                        className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                                    >
                                        <Zap className="w-4 h-4" />
                                        {editingAutomation.id ? 'Salvar Alterações' : 'Criar Automação'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>
        </div>
    );
}
