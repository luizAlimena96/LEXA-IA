import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { CrmConfig, Automation, WorkflowAction, AutomationsTabProps } from './interfaces';
import CRMStageSelector from '@/app/components/CRMStageSelector';
import WorkflowCanvas from './WorkflowCanvas';
import ActionModal from './ActionModal';
import api from '@/app/lib/api-client';

export default function AutomationsTab({
    agentId,
    crmConfigs,
    selectedCrmConfig,
    setSelectedCrmConfig,
    selectedCrmStage,
    setSelectedCrmStage,
    automations,
    setAutomations,
    fetchAutomations
}: AutomationsTabProps) {
    const [showWorkflowModal, setShowWorkflowModal] = useState(false);
    const [showActionModal, setShowActionModal] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState<Automation | null>(null);
    const [editingActionIndex, setEditingActionIndex] = useState<number | null>(null);
    const [editingAction, setEditingAction] = useState<Partial<WorkflowAction>>({
        id: crypto.randomUUID(),
        order: 1,
        name: '',
        method: 'POST',
        url: '',
        bodyTemplate: '{}',
        headers: {},
        actionType: 'HTTP_REQUEST',
    });

    const selectedCrm = crmConfigs.find(c => c.id === selectedCrmConfig);

    useEffect(() => {
        if (selectedCrm && selectedCrm.authType && selectedCrm.apiKey) {
            const authHeader = selectedCrm.authType === 'bearer'
                ? `Bearer ${selectedCrm.apiKey}`
                : selectedCrm.apiKey;

            setEditingAction(prev => ({
                ...prev,
                headers: {
                    ...prev.headers,
                    'Authorization': authHeader
                }
            }));
        }
    }, [selectedCrm]);

    const handleCreateWorkflow = () => {
        setEditingWorkflow({
            id: '',
            name: '',
            description: '',
            crmConfigId: selectedCrmConfig,
            crmStageId: selectedCrmStage,
            triggerType: 'STATE_CHANGE',
            actions: [],
            order: automations.length + 1,
            isActive: true,
        });
        setShowWorkflowModal(true);
    };

    const handleEditWorkflow = (automation: Automation) => {
        setEditingWorkflow(automation);
        setShowWorkflowModal(true);
    };

    const handleDeleteWorkflow = async (id: string) => {
        if (!confirm('Tem certeza que deseja apagar este workflow?')) {
            return;
        }

        try {
            await api.crm.automations.delete(id);
            fetchAutomations();
        } catch (error) {
            console.error('Error deleting workflow:', error);
            alert('Erro ao apagar workflow');
        }
    };

    const handleSaveWorkflow = async () => {
        if (!editingWorkflow) return;

        try {
            const payload = {
                crmConfigId: selectedCrmConfig,
                crmStageId: selectedCrmStage,
                name: editingWorkflow.name,
                description: editingWorkflow.description,
                triggerType: 'STATE_CHANGE',
                actions: editingWorkflow.actions,
                order: editingWorkflow.order,
            };

            if (editingWorkflow.id) {
                await api.crm.automations.update(editingWorkflow.id, payload);
            } else {
                await api.crm.automations.create(payload);
            }

            setShowWorkflowModal(false);
            setEditingWorkflow(null);
            fetchAutomations();
        } catch (error) {
            console.error('Error saving workflow:', error);
            alert('Erro ao salvar workflow');
        }
    };

    const handleAddAction = (afterIndex?: number) => {
        const newOrder = afterIndex !== undefined ? afterIndex + 2 : (editingWorkflow?.actions.length || 0) + 1;
        setEditingAction({
            id: crypto.randomUUID(),
            order: newOrder,
            name: '',
            method: 'POST',
            url: '',
            bodyTemplate: '{}',
            headers: selectedCrm && selectedCrm.authType && selectedCrm.apiKey ? {
                'Authorization': selectedCrm.authType === 'bearer'
                    ? `Bearer ${selectedCrm.apiKey}`
                    : selectedCrm.apiKey
            } : {},
            actionType: 'HTTP_REQUEST',
        });
        setEditingActionIndex(null);
        setShowActionModal(true);
    };

    const handleEditAction = (action: WorkflowAction, index: number) => {
        setEditingAction(action);
        setEditingActionIndex(index);
        setShowActionModal(true);
    };

    const handleDeleteAction = (index: number) => {
        if (!editingWorkflow) return;
        const newActions = editingWorkflow.actions.filter((_, i) => i !== index);
        newActions.forEach((action, i) => {
            action.order = i + 1;
        });
        setEditingWorkflow({ ...editingWorkflow, actions: newActions });
    };

    const handleMoveAction = (fromIndex: number, toIndex: number) => {
        if (!editingWorkflow) return;
        const newActions = [...editingWorkflow.actions];
        const [movedAction] = newActions.splice(fromIndex, 1);
        newActions.splice(toIndex, 0, movedAction);
        newActions.forEach((action, i) => {
            action.order = i + 1;
        });
        setEditingWorkflow({ ...editingWorkflow, actions: newActions });
    };

    const handleSaveAction = (action: Partial<WorkflowAction>, bodyFormat: string, bodyFields: Array<{ key: string, value: string }>) => {
        if (!editingWorkflow || !action.name || !action.url) {
            alert('Preencha todos os campos obrigatórios');
            return;
        }

        let finalBodyTemplate = action.bodyTemplate;
        if (bodyFormat === 'form-urlencoded') {
            const params = bodyFields
                .filter(f => f.key && f.value)
                .map(f => `${encodeURIComponent(f.key)}=${encodeURIComponent(f.value)}`)
                .join('&');
            finalBodyTemplate = params;
        } else if (bodyFormat === 'form-data') {
            const formData: Record<string, string> = {};
            bodyFields.filter(f => f.key && f.value).forEach(f => {
                formData[f.key] = f.value;
            });
            finalBodyTemplate = JSON.stringify(formData);
        }

        const finalAction: WorkflowAction = {
            ...action as WorkflowAction,
            bodyTemplate: finalBodyTemplate
        };

        let newActions = [...editingWorkflow.actions];

        if (editingActionIndex !== null) {
            newActions[editingActionIndex] = finalAction;
        } else {
            newActions.push(finalAction);
        }

        newActions.sort((a, b) => a.order - b.order);
        newActions.forEach((a, i) => {
            a.order = i + 1;
        });

        setEditingWorkflow({ ...editingWorkflow, actions: newActions });
        setShowActionModal(false);
        setEditingAction({
            id: crypto.randomUUID(),
            order: 1,
            name: '',
            method: 'POST',
            url: '',
            bodyTemplate: '{}',
            headers: {},
            actionType: 'HTTP_REQUEST',
        });
        setEditingActionIndex(null);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Workflows CRM</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Configure workflows com múltiplas ações encadeadas que serão executadas quando a IA mudar o estado do lead.
                </p>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            CRM
                        </label>
                        <select
                            value={selectedCrmConfig}
                            onChange={(e) => setSelectedCrmConfig(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">Selecione um CRM...</option>
                            {crmConfigs.map((crm) => (
                                <option key={crm.id} value={crm.id}>
                                    {crm.name} ({crm.crmType})
                                </option>
                            ))}
                        </select>
                        {selectedCrm && selectedCrm.authType && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                ✓ Autenticação {selectedCrm.authType} configurada automaticamente
                            </p>
                        )}
                    </div>

                    <CRMStageSelector
                        agentId={agentId}
                        value={selectedCrmStage}
                        onChange={(id) => setSelectedCrmStage(id || '')}
                        label="Etapa do CRM"
                        placeholder="Todas as etapas"
                        disabled={!selectedCrmConfig}
                    />
                </div>
            </div>

            {selectedCrmConfig && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {selectedCrmStage ? 'Workflows para esta Etapa' : 'Todos os Workflows'}
                        </h3>
                        {selectedCrmStage && (
                            <button
                                onClick={handleCreateWorkflow}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Novo Workflow
                            </button>
                        )}
                    </div>

                    {automations.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <p>{selectedCrmStage ? 'Nenhum workflow configurado para esta etapa' : 'Nenhum workflow configurado'}</p>
                            {selectedCrmStage && <p className="text-sm mt-2">Clique em "Novo Workflow" para começar</p>}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {automations.map((automation) => (
                                <div
                                    key={automation.id}
                                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                {!selectedCrmStage && automation.crmStage && (
                                                    <span
                                                        className="text-xs font-semibold px-2 py-1 rounded text-white"
                                                        style={{ backgroundColor: automation.crmStage.color || '#6366f1' }}
                                                    >
                                                        {automation.crmStage.name}
                                                    </span>
                                                )}
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {automation.name}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    ({automation.actions?.length || 0} ações)
                                                </span>
                                            </div>
                                            {automation.description && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {automation.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEditWorkflow(automation)}
                                                className="px-3 py-1 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDeleteWorkflow(automation.id)}
                                                className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                            >
                                                Deletar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {showWorkflowModal && editingWorkflow && (
                <div
                    className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setShowWorkflowModal(false)}
                >
                    <div
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                {editingWorkflow.id ? 'Editar Workflow' : 'Novo Workflow'}
                            </h2>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Nome do Workflow *
                                    </label>
                                    <input
                                        type="text"
                                        value={editingWorkflow.name}
                                        onChange={(e) => setEditingWorkflow({ ...editingWorkflow, name: e.target.value })}
                                        placeholder="Ex: Criar Deal no Pipedrive"
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Descrição
                                    </label>
                                    <textarea
                                        value={editingWorkflow.description || ''}
                                        onChange={(e) => setEditingWorkflow({ ...editingWorkflow, description: e.target.value })}
                                        placeholder="Descreva o que este workflow faz"
                                        rows={2}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ações do Workflow</h3>
                                <WorkflowCanvas
                                    actions={editingWorkflow.actions || []}
                                    onEditAction={handleEditAction}
                                    onDeleteAction={handleDeleteAction}
                                    onMoveAction={handleMoveAction}
                                    onAddAction={handleAddAction}
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowWorkflowModal(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveWorkflow}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                                >
                                    Salvar Workflow
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ActionModal
                show={showActionModal}
                action={editingAction}
                isEditing={editingActionIndex !== null}
                onSave={handleSaveAction}
                onCancel={() => setShowActionModal(false)}
                onChange={setEditingAction}
                crmAuth={selectedCrm && selectedCrm.authType && selectedCrm.apiKey ? {
                    type: selectedCrm.authType,
                    value: selectedCrm.authType === 'bearer' ? `Bearer ${selectedCrm.apiKey}` : selectedCrm.apiKey,
                    name: selectedCrm.name
                } : undefined}
            />
        </div>
    );
}
