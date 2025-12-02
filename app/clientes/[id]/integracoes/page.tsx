'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Plus, Edit, Trash2, Play, FileText, CheckCircle, XCircle, Loader } from 'lucide-react';
import ZapSignConfig from './ZapSignConfig';

export default function IntegracoesPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const params = useParams();
    const orgId = params.id as string;

    const [webhooks, setWebhooks] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showLogsModal, setShowLogsModal] = useState(false);
    const [editingWebhook, setEditingWebhook] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [testingId, setTestingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        event: 'lead.created',
        url: '',
        method: 'POST',
        headers: '{\n  "Authorization": "Bearer YOUR_API_KEY",\n  "Content-Type": "application/json"\n}',
        bodyTemplate: '{\n  "name": "{lead.name}",\n  "email": "{lead.email}",\n  "phone": "{lead.phone}"\n}',
        isActive: true,
    });

    useEffect(() => {
        if (session?.user?.role === 'SUPER_ADMIN' && orgId) {
            loadWebhooks();
            loadLogs();
        }
    }, [session, orgId]);

    const loadWebhooks = async () => {
        try {
            const res = await fetch(`/api/organizations/${orgId}/crm/webhooks`, {
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                setWebhooks(data);
            }
        } catch (error) {
            console.error('Error loading webhooks:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadLogs = async () => {
        try {
            const res = await fetch(`/api/organizations/${orgId}/crm/logs?limit=20`, {
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch (error) {
            console.error('Error loading logs:', error);
        }
    };

    const handleCreate = () => {
        setEditingWebhook(null);
        setFormData({
            name: '',
            event: 'lead.created',
            url: '',
            method: 'POST',
            headers: '{\n  "Authorization": "Bearer YOUR_API_KEY",\n  "Content-Type": "application/json"\n}',
            bodyTemplate: '{\n  "name": "{lead.name}",\n  "email": "{lead.email}",\n  "phone": "{lead.phone}"\n}',
            isActive: true,
        });
        setShowModal(true);
    };

    const handleEdit = (webhook: any) => {
        setEditingWebhook(webhook);
        setFormData({
            name: webhook.name,
            event: webhook.event,
            url: webhook.url,
            method: webhook.method,
            headers: JSON.stringify(webhook.headers || {}, null, 2),
            bodyTemplate: JSON.stringify(webhook.bodyTemplate || {}, null, 2),
            isActive: webhook.isActive,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const payload = {
                ...formData,
                headers: JSON.parse(formData.headers),
                bodyTemplate: JSON.parse(formData.bodyTemplate),
            };

            const url = editingWebhook
                ? `/api/organizations/${orgId}/crm/webhooks?webhookId=${editingWebhook.id}`
                : `/api/organizations/${orgId}/crm/webhooks`;

            const res = await fetch(url, {
                method: editingWebhook ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setShowModal(false);
                loadWebhooks();
            } else {
                alert('Erro ao salvar webhook');
            }
        } catch (error) {
            console.error('Error saving webhook:', error);
            alert('Erro ao salvar webhook. Verifique o JSON.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente deletar este webhook?')) return;

        try {
            const res = await fetch(`/api/organizations/${orgId}/crm/webhooks?webhookId=${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (res.ok) {
                loadWebhooks();
            }
        } catch (error) {
            console.error('Error deleting webhook:', error);
        }
    };

    const handleTest = async (id: string) => {
        setTestingId(id);
        try {
            const res = await fetch(`/api/organizations/${orgId}/crm/webhooks/test?webhookId=${id}`, {
                method: 'POST',
                credentials: 'include',
            });

            const result = await res.json();
            alert(result.success ? '✅ Teste bem-sucedido!' : `❌ Erro: ${result.error}`);
            loadLogs();
        } catch (error) {
            alert('❌ Erro ao testar webhook');
        } finally {
            setTestingId(null);
        }
    };

    const loadTemplate = async (crmType: string) => {
        try {
            const res = await fetch(`/api/crm/templates?type=${crmType}&event=${formData.event}`, {
                credentials: 'include',
            });

            if (res.ok) {
                const template = await res.json();
                setFormData({
                    ...formData,
                    headers: JSON.stringify(template.headers || {}, null, 2),
                    bodyTemplate: JSON.stringify(template.body || {}, null, 2),
                });
            }
        } catch (error) {
            console.error('Error loading template:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Integrações</h1>
                <p className="text-gray-600 mt-2">Configure integrações com serviços externos</p>
            </div>

            {/* ZapSign Configuration */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">ZapSign - Assinatura de Contratos</h2>
                <ZapSignConfig orgId={orgId} />
            </div>

            {/* Webhooks List */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Webhooks Configurados</h2>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                    >
                        <Plus className="w-5 h-5" />
                        Adicionar Webhook
                    </button>
                </div>

                <div className="space-y-3">
                    {webhooks.map((webhook) => (
                        <div key={webhook.id} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-semibold text-gray-900">{webhook.name}</h3>
                                        <span className={`px-2 py-1 rounded-full text-xs ${webhook.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {webhook.isActive ? '✅ Ativo' : '⏸️ Inativo'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600">Evento: <code className="bg-gray-100 px-2 py-1 rounded">{webhook.event}</code></p>
                                    <p className="text-sm text-gray-600">URL: {webhook.url}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleTest(webhook.id)}
                                        disabled={testingId === webhook.id}
                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                                        title="Testar"
                                    >
                                        {testingId === webhook.id ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => handleEdit(webhook)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                        title="Editar"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(webhook.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                        title="Deletar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {webhooks.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p>Nenhum webhook configurado</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Logs */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Logs Recentes</h2>
                    <button
                        onClick={() => setShowLogsModal(true)}
                        className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                        Ver todos
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left">Data/Hora</th>
                                <th className="px-4 py-2 text-left">Webhook</th>
                                <th className="px-4 py-2 text-left">Evento</th>
                                <th className="px-4 py-2 text-left">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.slice(0, 10).map((log) => (
                                <tr key={log.id} className="border-t">
                                    <td className="px-4 py-2">{new Date(log.createdAt).toLocaleString('pt-BR')}</td>
                                    <td className="px-4 py-2">{log.webhook.name}</td>
                                    <td className="px-4 py-2"><code className="bg-gray-100 px-2 py-1 rounded text-xs">{log.event}</code></td>
                                    <td className="px-4 py-2">
                                        {log.success ? (
                                            <span className="text-green-600 flex items-center gap-1">
                                                <CheckCircle className="w-4 h-4" />
                                                {log.statusCode}
                                            </span>
                                        ) : (
                                            <span className="text-red-600 flex items-center gap-1">
                                                <XCircle className="w-4 h-4" />
                                                Erro
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {logs.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            Nenhum log disponível
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-6">
                                {editingWebhook ? 'Editar Webhook' : 'Adicionar Webhook'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Nome *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            className="w-full px-4 py-2 border rounded-lg"
                                            placeholder="Ex: DataCrazy - Criar Lead"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Evento *</label>
                                        <select
                                            value={formData.event}
                                            onChange={(e) => setFormData({ ...formData, event: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg"
                                        >
                                            <option value="lead.created">lead.created</option>
                                            <option value="lead.updated">lead.updated</option>
                                            <option value="conversation.status_changed">conversation.status_changed</option>
                                            <option value="message.received">message.received</option>
                                        </select>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium mb-2">URL *</label>
                                        <input
                                            type="url"
                                            value={formData.url}
                                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                            required
                                            className="w-full px-4 py-2 border rounded-lg"
                                            placeholder="https://api.datacrazy.io/webhook"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Método</label>
                                        <select
                                            value={formData.method}
                                            onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg"
                                        >
                                            <option value="POST">POST</option>
                                            <option value="PUT">PUT</option>
                                            <option value="PATCH">PATCH</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Template</label>
                                        <select
                                            onChange={(e) => e.target.value && loadTemplate(e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg"
                                        >
                                            <option value="">Carregar template...</option>
                                            <option value="datacrazy">DataCrazy</option>
                                            <option value="rdstation">RD Station</option>
                                            <option value="pipedrive">Pipedrive</option>
                                            <option value="hubspot">HubSpot</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Headers (JSON)</label>
                                    <textarea
                                        value={formData.headers}
                                        onChange={(e) => setFormData({ ...formData, headers: e.target.value })}
                                        rows={4}
                                        className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Body Template (JSON)</label>
                                    <textarea
                                        value={formData.bodyTemplate}
                                        onChange={(e) => setFormData({ ...formData, bodyTemplate: e.target.value })}
                                        rows={8}
                                        className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Use variáveis: {'{lead.name}'}, {'{lead.email}'}, {'{lead.phone}'}, etc.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4"
                                    />
                                    <label className="text-sm">Ativo</label>
                                </div>

                                <div className="flex gap-3 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                                    >
                                        {editingWebhook ? 'Atualizar' : 'Criar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
