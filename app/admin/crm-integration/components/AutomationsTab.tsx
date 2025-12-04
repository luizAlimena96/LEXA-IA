import { useState } from 'react';
import { Plus, Database, Settings, Trash2 } from 'lucide-react';
import { CrmConfig, Automation, AutomationAction } from './types';

interface AutomationsTabProps {
    crmConfigs: CrmConfig[];
    selectedCrmConfig: string;
    setSelectedCrmConfig: (id: string) => void;
    matrixItems: any[];
    agentStates: any[];
    selectedState: string;
    setSelectedState: (id: string) => void;
    automations: Automation[];
    setAutomations: (automations: Automation[]) => void;
    fetchAutomations: () => Promise<void>;
}

export default function AutomationsTab({
    crmConfigs,
    selectedCrmConfig,
    setSelectedCrmConfig,
    matrixItems,
    agentStates,
    selectedState,
    setSelectedState,
    automations,
    setAutomations,
    fetchAutomations
}: AutomationsTabProps) {
    const [showActionModal, setShowActionModal] = useState(false);
    const [editingAction, setEditingAction] = useState<Partial<AutomationAction> & {
        id?: string,
        name: string,
        description?: string,
        triggerType?: string,
        delayMinutes?: number,
        actionType?: string,
        messageTemplate?: string
    }>({
        name: '',
        method: 'POST',
        url: '',
        bodyTemplate: '{}',
        headers: {},
        triggerType: 'STATE_CHANGE',
        delayMinutes: 30,
        actionType: 'HTTP_REQUEST',
        messageTemplate: ''
    });

    const handleSaveAction = async () => {
        try {
            const isMatrix = matrixItems.find(m => m.id === selectedState);

            // Prepare actions array based on actionType
            const actionConfig: any = {
                name: editingAction.name,
                description: editingAction.description,
            };

            if (editingAction.actionType === 'SEND_MESSAGE') {
                actionConfig.actionType = 'SEND_MESSAGE';
                actionConfig.messageTemplate = editingAction.messageTemplate;
            } else {
                actionConfig.method = editingAction.method;
                actionConfig.url = editingAction.url;
                actionConfig.bodyTemplate = editingAction.bodyTemplate;
                actionConfig.headers = editingAction.headers;
            }

            const payload = {
                crmConfigId: selectedCrmConfig,
                agentStateId: isMatrix ? null : selectedState,
                matrixItemId: isMatrix ? selectedState : null,
                name: editingAction.name,
                description: editingAction.description,
                triggerType: editingAction.triggerType || 'STATE_CHANGE',
                delayMinutes: editingAction.triggerType === 'NO_RESPONSE' ? Number(editingAction.delayMinutes) : null,
                actions: [actionConfig],
                order: automations.length + 1,
            };

            const method = editingAction.id ? 'PATCH' : 'POST';
            const url = editingAction.id
                ? `/api/crm-automations/${editingAction.id}`
                : '/api/crm-automations';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setShowActionModal(false);
                fetchAutomations();
                setEditingAction({
                    name: '',
                    method: 'POST',
                    url: '',
                    bodyTemplate: '{}',
                    headers: {},
                    triggerType: 'STATE_CHANGE',
                    delayMinutes: 30,
                    actionType: 'HTTP_REQUEST',
                    messageTemplate: ''
                });
            } else {
                alert('Erro ao salvar automação');
            }
        } catch (error) {
            console.error('Error saving automation:', error);
            alert('Erro ao salvar automação');
        }
    };

    const handleDeleteAction = async (id: string) => {
        if (!confirm('Tem certeza que deseja apagar esta ação?')) {
            return;
        }

        try {
            const res = await fetch(`/api/crm-automations/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setAutomations(automations.filter(a => a.id !== id));
            } else {
                alert('Erro ao apagar automação');
            }
        } catch (error) {
            console.error('Error deleting automation:', error);
            alert('Erro ao apagar automação');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header com seletores */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Automações CRM</h2>
                <p className="text-sm text-gray-600 mb-6">
                    Configure ações automáticas que serão executadas quando a IA mudar o estado do lead.
                </p>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            CRM
                        </label>
                        <select
                            value={selectedCrmConfig}
                            onChange={(e) => setSelectedCrmConfig(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Selecione um CRM...</option>
                            {crmConfigs.map((crm) => (
                                <option key={crm.id} value={crm.id}>
                                    {crm.name} ({crm.crmType})
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Crie múltiplos CRMs em Configuração
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estado da IA
                        </label>
                        <select
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            disabled={!selectedCrmConfig}
                        >
                            <option value="">Selecione um estado...</option>
                            <optgroup label="Estados do Agente">
                                {agentStates.map((state) => (
                                    <option key={state.id} value={state.id}>
                                        {state.name}
                                    </option>
                                ))}
                            </optgroup>
                            <optgroup label="Itens da Matriz">
                                {matrixItems.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.title} ({item.category})
                                    </option>
                                ))}
                            </optgroup>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Ex: INICIO, EM_CONTATO, QUALIFICADO
                        </p>
                    </div>
                </div>
            </div>

            {/* Lista de Automações */}
            {selectedCrmConfig && selectedState && (
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Ações para este Estado
                        </h3>
                        <button
                            onClick={() => {
                                setEditingAction({
                                    name: '',
                                    method: 'POST',
                                    url: '',
                                    bodyTemplate: '{}',
                                    headers: {},
                                    triggerType: 'STATE_CHANGE',
                                    delayMinutes: 30,
                                    actionType: 'HTTP_REQUEST',
                                    messageTemplate: ''
                                });
                                setShowActionModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                        >
                            <Plus className="w-4 h-4" />
                            Nova Ação
                        </button>
                    </div>

                    {automations.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhuma ação configurada para este estado</p>
                            <p className="text-sm mt-2">Clique em "Nova Ação" para começar</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {automations.map((automation: any) => (
                                <div
                                    key={automation.id}
                                    className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-xs font-semibold px-2 py-1 rounded ${automation.triggerType === 'NO_RESPONSE'
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    {automation.triggerType === 'NO_RESPONSE'
                                                        ? `Sem Resposta (${automation.delayMinutes} min)`
                                                        : 'Mudança de Estado'}
                                                </span>
                                                <span className="font-medium text-gray-900">
                                                    {automation.name}
                                                </span>
                                            </div>

                                            {/* Show details based on action type */}
                                            {automation.actions && automation.actions[0]?.actionType === 'SEND_MESSAGE' ? (
                                                <p className="text-sm text-gray-600">
                                                    <span className="font-semibold">Mensagem:</span> {automation.actions[0].messageTemplate?.substring(0, 50)}...
                                                </p>
                                            ) : (
                                                <p className="text-sm text-gray-600 font-mono">
                                                    {automation.actions && automation.actions[0]?.method} {automation.actions && automation.actions[0]?.url}
                                                </p>
                                            )}

                                            {automation.description && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {automation.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    const actionData = automation.actions && automation.actions.length > 0 ? automation.actions[0] : {} as any;
                                                    setEditingAction({
                                                        id: automation.id,
                                                        name: automation.name,
                                                        description: automation.description,
                                                        triggerType: automation.triggerType || 'STATE_CHANGE',
                                                        delayMinutes: automation.delayMinutes || 30,
                                                        actionType: actionData.actionType || 'HTTP_REQUEST',
                                                        messageTemplate: actionData.messageTemplate || '',
                                                        url: actionData.url || '',
                                                        method: actionData.method || 'POST',
                                                        bodyTemplate: actionData.bodyTemplate || '{}',
                                                        headers: actionData.headers || {},
                                                    });
                                                    setShowActionModal(true);
                                                }}
                                                className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                                            >
                                                <Settings className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAction(automation.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Variáveis Disponíveis */}
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2 text-sm">
                            Variáveis Disponíveis
                        </h4>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                                <p className="font-semibold text-blue-800">Lead:</p>
                                <code className="text-blue-600">{'{{lead.name}}'}</code><br />
                                <code className="text-blue-600">{'{{lead.phone}}'}</code><br />
                                <code className="text-blue-600">{'{{lead.email}}'}</code>
                            </div>
                            <div>
                                <p className="font-semibold text-blue-800">Conversa:</p>
                                <code className="text-blue-600">{'{{conversation.id}}'}</code><br />
                                <code className="text-blue-600">{'{{conversation.lastMessage}}'}</code>
                            </div>
                            <div>
                                <p className="font-semibold text-blue-800">Salvas:</p>
                                <code className="text-blue-600">{'{{personId}}'}</code><br />
                                <code className="text-blue-600">{'{{dealId}}'}</code><br />
                                <p className="text-blue-600 text-xs mt-1">Extraídas de ações anteriores</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Nova Ação */}
            {showActionModal && editingAction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {editingAction.id ? 'Editar Ação' : 'Nova Ação'}
                            </h2>

                            <div className="space-y-4">
                                {/* Nome */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nome da Ação *
                                    </label>
                                    <input
                                        type="text"
                                        value={editingAction.name}
                                        onChange={(e) => setEditingAction({ ...editingAction, name: e.target.value })}
                                        placeholder="Ex: Criar Card no CRM"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                {/* Descrição */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Descrição
                                    </label>
                                    <textarea
                                        value={editingAction.description || ''}
                                        onChange={(e) => setEditingAction({ ...editingAction, description: e.target.value })}
                                        placeholder="Descreva o que esta ação faz"
                                        rows={2}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                {/* Trigger Configuration */}
                                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Gatilho
                                        </label>
                                        <select
                                            value={editingAction.triggerType || 'STATE_CHANGE'}
                                            onChange={(e) => setEditingAction({ ...editingAction, triggerType: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="STATE_CHANGE">Mudança de Estado</option>
                                            <option value="NO_RESPONSE">Sem Resposta do Lead</option>
                                        </select>
                                    </div>

                                    {editingAction.triggerType === 'NO_RESPONSE' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Atraso (minutos)
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={editingAction.delayMinutes || 30}
                                                onChange={(e) => setEditingAction({ ...editingAction, delayMinutes: parseInt(e.target.value) })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Tempo após a última msg do lead</p>
                                        </div>
                                    )}
                                </div>

                                {/* Action Type Configuration */}
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tipo de Ação
                                        </label>
                                        <select
                                            value={editingAction.actionType || 'HTTP_REQUEST'}
                                            onChange={(e) => setEditingAction({ ...editingAction, actionType: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="HTTP_REQUEST">Requisição HTTP (Webhook/API)</option>
                                            <option value="SEND_MESSAGE">Enviar Mensagem (WhatsApp)</option>
                                        </select>
                                    </div>
                                </div>

                                {editingAction.actionType === 'SEND_MESSAGE' ? (
                                    /* Send Message Configuration */
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Mensagem
                                        </label>
                                        <textarea
                                            value={editingAction.messageTemplate || ''}
                                            onChange={(e) => setEditingAction({ ...editingAction, messageTemplate: e.target.value })}
                                            placeholder="Olá {{lead.name}}, ainda tem interesse?"
                                            rows={4}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Use variáveis como {'{{lead.name}}'}</p>
                                    </div>
                                ) : (
                                    /* HTTP Request Configuration */
                                    <>
                                        {/* Método e URL */}
                                        <div className="grid grid-cols-4 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Método
                                                </label>
                                                <select
                                                    value={editingAction.method}
                                                    onChange={(e) => setEditingAction({ ...editingAction, method: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                >
                                                    <option value="GET">GET</option>
                                                    <option value="POST">POST</option>
                                                    <option value="PUT">PUT</option>
                                                    <option value="PATCH">PATCH</option>
                                                    <option value="DELETE">DELETE</option>
                                                </select>
                                            </div>
                                            <div className="col-span-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    URL *
                                                </label>
                                                <input
                                                    type="url"
                                                    value={editingAction.url}
                                                    onChange={(e) => setEditingAction({ ...editingAction, url: e.target.value })}
                                                    placeholder="https://api.seucrm.com/v1/leads"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                        </div>

                                        {/* Body Template */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Body (JSON)
                                            </label>
                                            <textarea
                                                value={editingAction.bodyTemplate}
                                                onChange={(e) => setEditingAction({ ...editingAction, bodyTemplate: e.target.value })}
                                                placeholder='{"name": "{{lead.name}}", "phone": "{{lead.phone}}"}'
                                                rows={6}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                            />
                                        </div>

                                        {/* Headers Customizados */}
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Headers (Opcional)
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const headers = editingAction.headers || {};
                                                        const newKey = `header${Object.keys(headers).length + 1}`;
                                                        setEditingAction({
                                                            ...editingAction,
                                                            headers: { ...headers, [newKey]: '' }
                                                        });
                                                    }}
                                                    className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    Adicionar Header
                                                </button>
                                            </div>
                                            <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                                                {Object.entries(editingAction.headers || {}).map(([key, value], index) => (
                                                    <div key={index} className="flex gap-2 items-center">
                                                        <input
                                                            type="text"
                                                            value={key}
                                                            onChange={(e) => {
                                                                const headers = { ...editingAction.headers };
                                                                delete headers[key];
                                                                headers[e.target.value] = value;
                                                                setEditingAction({ ...editingAction, headers });
                                                            }}
                                                            placeholder="Authorization"
                                                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={value as string}
                                                            onChange={(e) => {
                                                                const headers = { ...editingAction.headers };
                                                                headers[key] = e.target.value;
                                                                setEditingAction({ ...editingAction, headers });
                                                            }}
                                                            placeholder="Bearer sua_chave_aqui"
                                                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const headers = { ...editingAction.headers };
                                                                delete headers[key];
                                                                setEditingAction({ ...editingAction, headers });
                                                            }}
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                                {Object.keys(editingAction.headers || {}).length === 0 && (
                                                    <p className="text-xs text-gray-400 text-center py-2">Nenhum header extra</p>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        onClick={() => setShowActionModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSaveAction}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                    >
                                        Salvar Ação
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
