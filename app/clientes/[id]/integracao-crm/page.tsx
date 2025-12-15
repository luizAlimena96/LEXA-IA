'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Cloud, RefreshCw, TestTube, Webhook, Save, CheckCircle, XCircle } from 'lucide-react';
import api from '@/app/lib/api-client';

export default function IntegracaoCRMPage() {
    const params = useParams();
    const orgId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);

    const [config, setConfig] = useState({
        crmCalendarSyncEnabled: false,
        crmCalendarApiUrl: '',
        crmCalendarApiKey: '',
        crmCalendarSyncInterval: 15,
        crmCalendarType: 'custom',
        appointmentWebhookEnabled: false,
        appointmentWebhookUrl: '',
    });

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const data = await api.organizations.crmSync.get(orgId);
            setConfig(data);
        } catch (error) {
            console.error('Error loading config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.organizations.crmSync.save(orgId, config);
            alert('Configurações salvas com sucesso!');
            loadConfig(); // Reload to get masked API key
        } catch (error) {
            console.error('Error saving:', error);
            alert('Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const result = await api.organizations.crmSync.test(orgId, {
                apiUrl: config.crmCalendarApiUrl,
                apiKey: config.crmCalendarApiKey === '***' ? undefined : config.crmCalendarApiKey
            });
            setTestResult(result);
        } catch (error: any) {
            setTestResult({
                success: false,
                message: error.response?.data?.message || error.message
            });
        } finally {
            setTesting(false);
        }
    };

    const handleSyncNow = async () => {
        setSyncing(true);
        try {
            await api.organizations.crmSync.save(orgId, {});
            alert('Sincronização iniciada! Os eventos serão importados em breve.');
        } catch (error: any) {
            console.error('Error syncing:', error);
            alert(`Erro: ${error.response?.data?.error || 'Erro ao sincronizar'}`);
        } finally {
            setSyncing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Integração CRM</h1>
                    <p className="text-gray-600 mt-2">Configure sincronização de calendário e webhooks</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    {saving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
            </div>

            {/* Sincronização de Calendário CRM */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <Cloud className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-xl font-bold text-gray-900">Sincronização de Calendário CRM</h2>
                </div>
                <p className="text-gray-600 mb-6">
                    Sincronize eventos do seu CRM com o Google Calendar para evitar conflitos de agendamento
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="flex items-center gap-2 mb-4">
                            <input
                                type="checkbox"
                                checked={config.crmCalendarSyncEnabled}
                                onChange={(e) => setConfig({ ...config, crmCalendarSyncEnabled: e.target.checked })}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Ativar sincronização automática
                            </span>
                        </label>
                    </div>

                    {config.crmCalendarSyncEnabled && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tipo de CRM
                                    </label>
                                    <select
                                        value={config.crmCalendarType}
                                        onChange={(e) => setConfig({ ...config, crmCalendarType: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    >
                                        <option value="custom">Custom / Genérico</option>
                                        <option value="datacrazy">DataCrazy</option>
                                        <option value="rdstation">RD Station</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Intervalo de sincronização (minutos)
                                    </label>
                                    <input
                                        type="number"
                                        min="5"
                                        step="5"
                                        value={config.crmCalendarSyncInterval}
                                        onChange={(e) => setConfig({ ...config, crmCalendarSyncInterval: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    URL da API do CRM
                                </label>
                                <input
                                    type="url"
                                    value={config.crmCalendarApiUrl}
                                    onChange={(e) => setConfig({ ...config, crmCalendarApiUrl: e.target.value })}
                                    placeholder="https://api.seucrm.com/events"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    API Key do CRM
                                </label>
                                <input
                                    type="password"
                                    value={config.crmCalendarApiKey}
                                    onChange={(e) => setConfig({ ...config, crmCalendarApiKey: e.target.value })}
                                    placeholder="Sua chave de API"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    A chave será armazenada de forma segura
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4 border-t">
                                <button
                                    onClick={handleTest}
                                    disabled={testing || !config.crmCalendarApiUrl}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <TestTube className="w-4 h-4" />
                                    {testing ? 'Testando...' : 'Testar Conexão'}
                                </button>

                                <button
                                    onClick={handleSyncNow}
                                    disabled={syncing || !config.crmCalendarApiUrl}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                                    {syncing ? 'Sincronizando...' : 'Sincronizar Agora'}
                                </button>
                            </div>

                            {testResult && (
                                <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                    <div className="flex items-center gap-2">
                                        {testResult.success ? (
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-600" />
                                        )}
                                        <p className={`font-medium ${testResult.success ? 'text-green-900' : 'text-red-900'}`}>
                                            {testResult.message}
                                        </p>
                                    </div>
                                    {testResult.eventsCount !== undefined && (
                                        <p className="text-sm text-green-700 mt-1">
                                            Eventos encontrados: {testResult.eventsCount}
                                        </p>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Webhook Pós-Agendamento */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Webhook className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-xl font-bold text-gray-900">Webhook Pós-Agendamento</h2>
                </div>
                <p className="text-gray-600 mb-6">
                    Receba notificações em tempo real quando um agendamento for criado
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="flex items-center gap-2 mb-4">
                            <input
                                type="checkbox"
                                checked={config.appointmentWebhookEnabled}
                                onChange={(e) => setConfig({ ...config, appointmentWebhookEnabled: e.target.checked })}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Ativar webhook
                            </span>
                        </label>
                    </div>

                    {config.appointmentWebhookEnabled && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    URL do Webhook
                                </label>
                                <input
                                    type="url"
                                    value={config.appointmentWebhookUrl}
                                    onChange={(e) => setConfig({ ...config, appointmentWebhookUrl: e.target.value })}
                                    placeholder="https://seu-sistema.com/webhook/agendamento"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-2">Payload enviado:</h3>
                                <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
                                    {`{
  "horario_evento": "2024-01-15T14:00:00.000Z",
  "whatsapp": "11999999999",
  "status": "SCHEDULED",
  "lead": {
    "name": "João Silva",
    "email": "joao@email.com",
    "phone": "11999999999"
  },
  "appointment": {
    "id": "uuid",
    "title": "Reunião",
    "duration": 60,
    "notes": "Observações"
  }
}`}
                                </pre>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
