'use client';

import { useState, useEffect } from 'react';
import { useOrganization } from '@/app/contexts/OrganizationContext';
import { Save, RefreshCw, Facebook, Webhook, Database, MessageCircle, Terminal, Trash2 } from 'lucide-react';
import { useCRMRealtime } from '@/app/hooks/useCRMRealtime';
import api from '@/app/lib/api-client';

interface MetaConfig {
    metaAccessToken: string;
    metaVerifyToken: string;
    metaGraphApiVersion: string;
    metaPageId: string;
    metaWelcomeMessage: string;
    metaIntegrationEnabled: boolean;
}

export default function MetaIntegrationPage() {
    const { selectedOrgId: orgId } = useOrganization();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<MetaConfig>({
        metaAccessToken: '',
        metaVerifyToken: '',
        metaGraphApiVersion: 'v24.0',
        metaPageId: '',
        metaWelcomeMessage: 'Olá, falo com {{nome}}?',
        metaIntegrationEnabled: false,
    });
    const [webhookLogs, setWebhookLogs] = useState<any[]>([]);

    useCRMRealtime({
        organizationId: orgId,
        onUpdate: (event: any) => {
            if (event.type === 'meta_debug') {
                setWebhookLogs((prev) => [
                    {
                        timestamp: new Date(),
                        payload: event.data
                    },
                    ...prev
                ].slice(0, 50));
            }
        },
        enabled: !!orgId
    });

    useEffect(() => {
        if (orgId) {
            fetchConfig();
        }
    }, [orgId]);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const orgs = await api.organizations.list();
            const org = orgs.find((o: any) => o.id === orgId);
            if (org) {
                setConfig({
                    metaAccessToken: org.metaAccessToken || '',
                    metaVerifyToken: org.metaVerifyToken || '',
                    metaGraphApiVersion: org.metaGraphApiVersion || 'v24.0',
                    metaPageId: org.metaPageId || '',
                    metaWelcomeMessage: org.metaWelcomeMessage || 'Olá, falo com {{nome}}?',
                    metaIntegrationEnabled: org.metaIntegrationEnabled || false,
                });
            }
        } catch (error) {
            console.error('Error loading config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.organizations.update(orgId!, config);
            alert('Configurações salvas com sucesso!');
        } catch (error) {
            console.error('Error saving config:', error);
            alert('Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const webhookUrl = typeof window !== 'undefined'
        ? `${window.location.origin.replace('lexa-ia.com.br', 'api.lexa-ia.com.br')}/webhooks/meta-leads`
        : '';

    if (loading || !orgId) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <Facebook className="w-8 h-8 text-blue-600" />
                    Meta Lead Ads
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Configure a integração com Meta Lead Ads.
                </p>
            </div>

            {/* Webhook URL Info */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                    <Webhook className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900 dark:text-blue-100">URL do Webhook</span>
                </div>
                <code className="text-sm bg-white dark:bg-gray-800 px-3 py-2 rounded block break-all">
                    {webhookUrl}
                </code>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                    Configure esta URL no Facebook Developers como webhook para Lead Ads.
                </p>
            </div>

            <div className="space-y-6">
                {/* Meta Configuration */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Facebook className="w-5 h-5 text-blue-600" />
                        Configuração Meta
                    </h2>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.metaIntegrationEnabled}
                                    onChange={(e) => setConfig({ ...config, metaIntegrationEnabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                            </label>
                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                                Integração Ativa
                            </span>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Access Token (Facebook Page)
                            </label>
                            <textarea
                                value={config.metaAccessToken}
                                onChange={(e) => setConfig({ ...config, metaAccessToken: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="EAAQbYAZBXU..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Verify Token
                                </label>
                                <input
                                    type="text"
                                    value={config.metaVerifyToken}
                                    onChange={(e) => setConfig({ ...config, metaVerifyToken: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="seu_token_verificacao"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Graph API Version
                                </label>
                                <select
                                    value={config.metaGraphApiVersion}
                                    onChange={(e) => setConfig({ ...config, metaGraphApiVersion: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="v24.0">v24.0</option>
                                    <option value="v23.0">v23.0</option>
                                    <option value="v22.0">v22.0</option>
                                    <option value="v21.0">v21.0</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Page ID (opcional)
                            </label>
                            <input
                                type="text"
                                value={config.metaPageId}
                                onChange={(e) => setConfig({ ...config, metaPageId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="123456789012345"
                            />
                        </div>
                    </div>
                </div>

                {/* Welcome Message */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-green-600" />
                        Mensagem de Boas-Vindas
                    </h2>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Template da Mensagem
                        </label>
                        <textarea
                            value={config.metaWelcomeMessage}
                            onChange={(e) => setConfig({ ...config, metaWelcomeMessage: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Olá, falo com {{nome}}?"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Use {'{{nome}}'} para inserir o nome do lead automaticamente.
                        </p>
                    </div>
                </div>



                {/* Save Button */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={fetchConfig}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Recarregar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Salvar Configurações
                    </button>
                </div>

                {/* Webhook Monitor */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Terminal className="w-5 h-5 text-purple-600" />
                            Monitor de Webhook (Tempo Real)
                        </h2>
                        <button
                            onClick={() => setWebhookLogs([])}
                            className="text-sm text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 flex items-center gap-1"
                        >
                            <Trash2 className="w-4 h-4" />
                            Limpar Logs
                        </button>
                    </div>

                    <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm h-96 overflow-y-auto">
                        {webhookLogs.length === 0 ? (
                            <div className="text-gray-500 text-center py-8">
                                Aguardando eventos do webhook...
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {webhookLogs.map((log, index) => (
                                    <div key={index} className="border-b border-gray-800 last:border-0 pb-4 last:pb-0">
                                        <div className="flex items-center gap-2 text-purple-400 mb-1 text-xs">
                                            <span className="opacity-75">{log.timestamp.toLocaleTimeString()}</span>
                                            <span>Received Webhook</span>
                                        </div>
                                        <pre className="text-green-400 whitespace-pre-wrap break-all">
                                            {JSON.stringify(log.payload, null, 2)}
                                        </pre>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
