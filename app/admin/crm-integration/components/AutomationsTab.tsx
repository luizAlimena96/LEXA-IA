import { useState } from 'react';
import { Plus, Database, Settings, Trash2 } from 'lucide-react';
import { CrmConfig, Automation, AutomationAction } from './types';
import CRMStageSelector from '@/app/components/CRMStageSelector';

interface AutomationsTabProps {
    agentId: string;
    crmConfigs: CrmConfig[];
    selectedCrmConfig: string;
    setSelectedCrmConfig: (id: string) => void;
    selectedCrmStage: string;
    setSelectedCrmStage: (id: string) => void;
    automations: Automation[];
    setAutomations: (automations: Automation[]) => void;
    fetchAutomations: () => Promise<void>;
}

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
    const [showActionModal, setShowActionModal] = useState(false);
    const [bodyFormat, setBodyFormat] = useState<'json' | 'form-urlencoded' | 'form-data'>('json');
    const [showVariableSelector, setShowVariableSelector] = useState(false);
    const [bodyFields, setBodyFields] = useState<Array<{ key: string, value: string }>>([{ key: '', value: '' }]);
    const [editingAction, setEditingAction] = useState<Partial<AutomationAction> & {
        id?: string,
        name: string,
        description?: string,
        triggerType?: string,
        actionType?: string,
        messageTemplate?: string,
        phoneNumbers?: string
    }>({
        name: '',
        method: 'POST',
        url: '',
        bodyTemplate: '{}',
        headers: {},
        triggerType: 'STATE_CHANGE',
        actionType: 'HTTP_REQUEST',
        messageTemplate: '',
        phoneNumbers: ''
    });

    const handleSaveAction = async () => {
        try {
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
                crmStageId: selectedCrmStage,
                name: editingAction.name,
                description: editingAction.description,
                triggerType: editingAction.triggerType || 'STATE_CHANGE',
                delayMinutes: null,
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
                    actionType: 'HTTP_REQUEST',
                    messageTemplate: '',
                    phoneNumbers: ''
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

                    <CRMStageSelector
                        agentId={agentId}
                        value={selectedCrmStage}
                        onChange={(id) => setSelectedCrmStage(id || '')}
                        label="Etapa do CRM"
                        placeholder="Selecione uma etapa..."
                        required
                        disabled={!selectedCrmConfig}
                    />
                </div>
            </div>

            {selectedCrmConfig && selectedCrmStage && (
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
                                    actionType: 'HTTP_REQUEST',
                                    messageTemplate: '',
                                    phoneNumbers: ''
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
                                                        actionType: actionData.actionType || 'HTTP_REQUEST',
                                                        messageTemplate: actionData.messageTemplate || '',
                                                        phoneNumbers: actionData.phoneNumbers || '',
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

            {showActionModal && editingAction && (
                <div
                    className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setShowActionModal(false)}
                >
                    <div
                        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {editingAction.id ? 'Editar Ação' : 'Nova Ação'}
                            </h2>

                            <div className="space-y-4">
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

                                <div className="p-4 bg-indigo-50 border-2 border-indigo-500 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-3 h-3 rounded-full bg-indigo-500" />
                                        <span className="font-semibold text-sm text-indigo-900">Gatilho: Mudança de Estado</span>
                                    </div>
                                    <p className="text-xs text-indigo-700">Esta ação será executada imediatamente quando o lead mudar para o estado selecionado</p>
                                </div>

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
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Números de Telefone *
                                            </label>
                                            <input
                                                type="text"
                                                value={editingAction.phoneNumbers || ''}
                                                onChange={(e) => setEditingAction({ ...editingAction, phoneNumbers: e.target.value })}
                                                placeholder="5511999999999 ou 5511999999999,5511888888888"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">💡 Separe múltiplos números com vírgula ou use variável {`{{lead.phone}}`}</p>
                                        </div>
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
                                            <p className="text-xs text-gray-500 mt-1">Use variáveis como {"{{lead.name}}"}</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
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

                                        {/* Headers Section - Moved above body */}
                                        <div className="mb-4">
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
                                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
                                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                                                            <th className="px-3 py-2 w-10"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200">
                                                        {Object.entries(editingAction.headers || {}).map(([key, value], index) => (
                                                            <tr key={index} className="hover:bg-gray-50">
                                                                <td className="px-3 py-2">
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
                                                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                                                                    />
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    <input
                                                                        type="text"
                                                                        value={value as string}
                                                                        onChange={(e) => {
                                                                            const headers = { ...editingAction.headers };
                                                                            headers[key] = e.target.value;
                                                                            setEditingAction({ ...editingAction, headers });
                                                                        }}
                                                                        placeholder="Bearer sua_chave_aqui"
                                                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                                                                    />
                                                                </td>
                                                                <td className="px-3 py-2">
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
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {Object.keys(editingAction.headers || {}).length === 0 && (
                                                            <tr>
                                                                <td colSpan={3} className="px-3 py-4 text-center text-xs text-gray-400">
                                                                    Nenhum header configurado
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">💡 Autenticação é configurada na aba de Configurações</p>
                                        </div>

                                        {/* Body Section */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Body
                                                </label>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowVariableSelector(!showVariableSelector)}
                                                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                                    >
                                                        {showVariableSelector ? '✖ Fechar' : '📝 Variáveis'}
                                                    </button>
                                                    <select
                                                        value={bodyFormat}
                                                        onChange={(e) => {
                                                            const newFormat = e.target.value as any;
                                                            setBodyFormat(newFormat);
                                                            // Reset bodyFields when changing format
                                                            if (newFormat !== 'json') {
                                                                setBodyFields([{ key: '', value: '' }]);
                                                            }
                                                        }}
                                                        className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                    >
                                                        <option value="json">JSON</option>
                                                        <option value="form-urlencoded">x-www-form-urlencoded</option>
                                                        <option value="form-data">form-data</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {showVariableSelector && (
                                                <div className="mb-3 p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-300 rounded-lg shadow-sm">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className="text-lg">🎯</span>
                                                        <p className="text-sm font-bold text-blue-900">Variáveis Disponíveis - Clique para inserir</p>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {/* Dados Básicos */}
                                                        <div className="bg-white rounded-lg p-3 border border-blue-200">
                                                            <p className="text-xs font-bold text-blue-900 mb-2 flex items-center gap-1">
                                                                <span>👤</span> Dados Básicos
                                                            </p>
                                                            <div className="space-y-1">
                                                                {['name', 'phone', 'email', 'cpf'].map(field => (
                                                                    <button
                                                                        key={field}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const variable = `{{lead.${field}}}`;
                                                                            if (bodyFormat === 'json') {
                                                                                setEditingAction({
                                                                                    ...editingAction,
                                                                                    bodyTemplate: (editingAction.bodyTemplate || '') + variable
                                                                                });
                                                                            } else {
                                                                                // Insert into first empty value field in table
                                                                                const emptyIndex = bodyFields.findIndex(f => !f.value);
                                                                                if (emptyIndex !== -1) {
                                                                                    const newFields = [...bodyFields];
                                                                                    newFields[emptyIndex].value = variable;
                                                                                    setBodyFields(newFields);
                                                                                }
                                                                            }
                                                                        }}
                                                                        className="block w-full text-left px-2 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded transition-all hover:shadow-sm"
                                                                    >
                                                                        <code className="text-blue-700 font-semibold break-all">{`{{lead.${field}}}`}</code>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Status e Estado */}
                                                        <div className="bg-white rounded-lg p-3 border border-green-200">
                                                            <p className="text-xs font-bold text-green-900 mb-2 flex items-center gap-1">
                                                                <span>📊</span> Status
                                                            </p>
                                                            <div className="space-y-1">
                                                                {['currentState', 'status'].map(field => (
                                                                    <button
                                                                        key={field}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const variable = `{{lead.${field}}}`;
                                                                            if (bodyFormat === 'json') {
                                                                                setEditingAction({
                                                                                    ...editingAction,
                                                                                    bodyTemplate: (editingAction.bodyTemplate || '') + variable
                                                                                });
                                                                            } else {
                                                                                const emptyIndex = bodyFields.findIndex(f => !f.value);
                                                                                if (emptyIndex !== -1) {
                                                                                    const newFields = [...bodyFields];
                                                                                    newFields[emptyIndex].value = variable;
                                                                                    setBodyFields(newFields);
                                                                                }
                                                                            }
                                                                        }}
                                                                        className="block w-full text-left px-2 py-1.5 text-xs bg-green-50 hover:bg-green-100 border border-green-300 rounded transition-all hover:shadow-sm"
                                                                    >
                                                                        <code className="text-green-700 font-semibold break-all">{`{{lead.${field}}}`}</code>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Dados Extraídos */}
                                                        <div className="bg-white rounded-lg p-3 border border-purple-200">
                                                            <p className="text-xs font-bold text-purple-900 mb-2 flex items-center gap-1">
                                                                <span>🔍</span> Extraídos
                                                            </p>
                                                            <div className="space-y-1">
                                                                {[
                                                                    { label: 'campo1', value: 'extractedData.campo1' },
                                                                    { label: 'campo2', value: 'extractedData.campo2' },
                                                                    { label: 'valor', value: 'extractedData.valor' }
                                                                ].map(field => (
                                                                    <button
                                                                        key={field.value}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const variable = `{{lead.${field.value}}}`;
                                                                            if (bodyFormat === 'json') {
                                                                                setEditingAction({
                                                                                    ...editingAction,
                                                                                    bodyTemplate: (editingAction.bodyTemplate || '') + variable
                                                                                });
                                                                            } else {
                                                                                const emptyIndex = bodyFields.findIndex(f => !f.value);
                                                                                if (emptyIndex !== -1) {
                                                                                    const newFields = [...bodyFields];
                                                                                    newFields[emptyIndex].value = variable;
                                                                                    setBodyFields(newFields);
                                                                                }
                                                                            }
                                                                        }}
                                                                        className="block w-full text-left px-2 py-1.5 text-xs bg-purple-50 hover:bg-purple-100 border border-purple-300 rounded transition-all hover:shadow-sm"
                                                                        title={`{{lead.${field.value}}}`}
                                                                    >
                                                                        <code className="text-purple-700 font-semibold text-[10px] break-all leading-tight">
                                                                            {`{{lead.${field.value}}}`}
                                                                        </code>
                                                                    </button>
                                                                ))}
                                                                <p className="text-[9px] text-purple-600 mt-2 italic leading-tight">* Personalize conforme seus dados</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* JSON Editor */}
                                            {bodyFormat === 'json' && (
                                                <>
                                                    <textarea
                                                        value={editingAction.bodyTemplate}
                                                        onChange={(e) => setEditingAction({ ...editingAction, bodyTemplate: e.target.value })}
                                                        placeholder='{\n  "name": "{{lead.name}}",\n  "phone": "{{lead.phone}}",\n  "email": "{{lead.email}}"\n}'
                                                        rows={8}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">💡 Formato JSON - Use chaves, aspas e vírgulas corretamente</p>
                                                </>
                                            )}

                                            {/* Form URL Encoded Table */}
                                            {bodyFormat === 'form-urlencoded' && (
                                                <>
                                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
                                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                                                                    <th className="px-3 py-2 w-10"></th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-200">
                                                                {bodyFields.map((field, index) => (
                                                                    <tr key={index} className="hover:bg-gray-50">
                                                                        <td className="px-3 py-2">
                                                                            <input
                                                                                type="text"
                                                                                value={field.key}
                                                                                onChange={(e) => {
                                                                                    const newFields = [...bodyFields];
                                                                                    newFields[index].key = e.target.value;
                                                                                    setBodyFields(newFields);
                                                                                }}
                                                                                placeholder="name"
                                                                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                                                                            />
                                                                        </td>
                                                                        <td className="px-3 py-2">
                                                                            <input
                                                                                type="text"
                                                                                value={field.value}
                                                                                onChange={(e) => {
                                                                                    const newFields = [...bodyFields];
                                                                                    newFields[index].value = e.target.value;
                                                                                    setBodyFields(newFields);
                                                                                }}
                                                                                placeholder="{{lead.name}}"
                                                                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                                                                            />
                                                                        </td>
                                                                        <td className="px-3 py-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const newFields = bodyFields.filter((_, i) => i !== index);
                                                                                    setBodyFields(newFields.length > 0 ? newFields : [{ key: '', value: '' }]);
                                                                                }}
                                                                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setBodyFields([...bodyFields, { key: '', value: '' }])}
                                                        className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        Adicionar Campo
                                                    </button>
                                                    <p className="text-xs text-gray-500 mt-1">💡 Será convertido para: key1=value1&key2=value2</p>
                                                </>
                                            )}

                                            {/* Form Data Table */}
                                            {bodyFormat === 'form-data' && (
                                                <>
                                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
                                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                                                                    <th className="px-3 py-2 w-10"></th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-200">
                                                                {bodyFields.map((field, index) => (
                                                                    <tr key={index} className="hover:bg-gray-50">
                                                                        <td className="px-3 py-2">
                                                                            <input
                                                                                type="text"
                                                                                value={field.key}
                                                                                onChange={(e) => {
                                                                                    const newFields = [...bodyFields];
                                                                                    newFields[index].key = e.target.value;
                                                                                    setBodyFields(newFields);
                                                                                }}
                                                                                placeholder="name"
                                                                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                                                                            />
                                                                        </td>
                                                                        <td className="px-3 py-2">
                                                                            <input
                                                                                type="text"
                                                                                value={field.value}
                                                                                onChange={(e) => {
                                                                                    const newFields = [...bodyFields];
                                                                                    newFields[index].value = e.target.value;
                                                                                    setBodyFields(newFields);
                                                                                }}
                                                                                placeholder="{{lead.name}}"
                                                                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                                                                            />
                                                                        </td>
                                                                        <td className="px-3 py-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const newFields = bodyFields.filter((_, i) => i !== index);
                                                                                    setBodyFields(newFields.length > 0 ? newFields : [{ key: '', value: '' }]);
                                                                                }}
                                                                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setBodyFields([...bodyFields, { key: '', value: '' }])}
                                                        className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        Adicionar Campo
                                                    </button>
                                                    <p className="text-xs text-gray-500 mt-1">💡 Formato multipart/form-data</p>
                                                </>
                                            )}
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
                </div >
            )
            }
        </div >
    );
}
