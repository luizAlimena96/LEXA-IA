'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    Send, Code, Database, Settings, CheckCircle, XCircle,
    Copy, Eye, EyeOff, Plus, Trash2, Save, PlayCircle
} from 'lucide-react';

interface FieldMapping {
    lexaField: string;
    crmField: string;
    transform?: string;
}

interface CRMEndpoint {
    name: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    description: string;
}

export default function CRMIntegrationPage() {
    const params = useParams();
    const orgId = params.id as string;

    const [activeTab, setActiveTab] = useState<'config' | 'test' | 'mapping'>('config');
    const [loading, setLoading] = useState(true);
    const [testing, setTesting] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);

    // Configuração
    const [config, setConfig] = useState({
        crmType: 'custom',
        crmEnabled: true,
        crmWebhookUrl: '',
        crmApiKey: '',
        crmAuthType: 'bearer',
    });

    // Endpoints
    const [endpoints, setEndpoints] = useState<CRMEndpoint[]>([
        { name: 'Listar Eventos', method: 'GET', url: '/api/events', description: 'Buscar eventos do calendário' },
        { name: 'Criar Lead', method: 'POST', url: '/api/leads', description: 'Criar novo lead no CRM' },
        { name: 'Atualizar Lead', method: 'PATCH', url: '/api/leads/{id}', description: 'Atualizar dados do lead' },
        { name: 'Criar Agendamento', method: 'POST', url: '/api/appointments', description: 'Criar agendamento no CRM' },
    ]);

    // Request Builder
    const [selectedEndpoint, setSelectedEndpoint] = useState(0);
    const [requestMethod, setRequestMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('GET');
    const [requestUrl, setRequestUrl] = useState('');
    const [requestHeaders, setRequestHeaders] = useState<Record<string, string>>({
        'Content-Type': 'application/json',
    });
    const [requestBody, setRequestBody] = useState('{\n  "name": "João Silva",\n  "phone": "11999999999",\n  "email": "joao@email.com",\n  "status": "novo"\n}');

    // Response
    const [response, setResponse] = useState<any>(null);
    const [responseTime, setResponseTime] = useState<number>(0);

    // Field Mapping
    const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([
        { lexaField: 'lead.name', crmField: 'nome', transform: '' },
        { lexaField: 'lead.phone', crmField: 'telefone', transform: '' },
        { lexaField: 'lead.email', crmField: 'email', transform: '' },
        { lexaField: 'lead.status', crmField: 'status_funil', transform: '' },
        { lexaField: 'appointment.scheduledAt', crmField: 'data_agendamento', transform: 'toISOString' },
        { lexaField: 'appointment.duration', crmField: 'duracao_minutos', transform: '' },
    ]);

    const lexaFields = [
        'lead.name', 'lead.phone', 'lead.email', 'lead.status', 'lead.source', 'lead.notes',
        'appointment.scheduledAt', 'appointment.duration', 'appointment.title', 'appointment.notes',
        'conversation.status', 'conversation.lastMessage'
    ];

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const res = await fetch(`/api/organizations/${orgId}`);
            if (res.ok) {
                const data = await res.json();
                setConfig({
                    crmType: data.crmType || 'custom',
                    crmEnabled: data.crmEnabled || false,
                    crmWebhookUrl: data.crmWebhookUrl || '',
                    crmApiKey: data.crmApiKey || '',
                    crmAuthType: data.crmAuthType || 'bearer',
                });

                if (data.crmFieldMapping) {
                    setFieldMappings(data.crmFieldMapping);
                }
            }
        } catch (error) {
            console.error('Error loading config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTestRequest = async () => {
        setTesting(true);
        setResponse(null);
        const startTime = Date.now();

        try {
            const headers: Record<string, string> = { ...requestHeaders };

            if (config.crmAuthType === 'bearer' && config.crmApiKey) {
                headers['Authorization'] = `Bearer ${config.crmApiKey}`;
            } else if (config.crmAuthType === 'apikey' && config.crmApiKey) {
                headers['X-API-Key'] = config.crmApiKey;
            }

            const fullUrl = config.crmWebhookUrl + requestUrl;

            const options: RequestInit = {
                method: requestMethod,
                headers,
            };

            if (['POST', 'PUT', 'PATCH'].includes(requestMethod)) {
                options.body = requestBody;
            }

            const res = await fetch(fullUrl, options);
            const data = await res.json();
            const endTime = Date.now();

            setResponse({
                status: res.status,
                statusText: res.statusText,
                headers: Object.fromEntries(res.headers.entries()),
                data,
            });
            setResponseTime(endTime - startTime);
        } catch (error: any) {
            setResponse({
                status: 0,
                statusText: 'Error',
                error: error.message,
            });
            setResponseTime(Date.now() - startTime);
        } finally {
            setTesting(false);
        }
    };

    const handleSaveConfig = async () => {
        try {
            const res = await fetch(`/api/organizations/${orgId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    crmType: config.crmType,
                    crmEnabled: config.crmEnabled,
                    crmWebhookUrl: config.crmWebhookUrl,
                    crmApiKey: config.crmApiKey,
                    crmAuthType: config.crmAuthType,
                    crmFieldMapping: fieldMappings,
                }),
            });

            if (res.ok) {
                alert('Configuração salva com sucesso!');
            } else {
                alert('Erro ao salvar configuração');
            }
        } catch (error) {
            console.error('Error saving:', error);
            alert('Erro ao salvar configuração');
        }
    };

    const addFieldMapping = () => {
        setFieldMappings([...fieldMappings, { lexaField: '', crmField: '', transform: '' }]);
    };

    const removeFieldMapping = (index: number) => {
        setFieldMappings(fieldMappings.filter((_, i) => i !== index));
    };

    const updateFieldMapping = (index: number, field: keyof FieldMapping, value: string) => {
        const updated = [...fieldMappings];
        updated[index] = { ...updated[index], [field]: value };
        setFieldMappings(updated);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copiado para área de transferência!');
    };

    const generateExamplePayload = () => {
        const payload: any = {};
        fieldMappings.forEach(mapping => {
            if (mapping.crmField) {
                const value = mapping.lexaField.includes('phone') ? '11999999999' :
                    mapping.lexaField.includes('email') ? 'exemplo@email.com' :
                        mapping.lexaField.includes('scheduledAt') ? new Date().toISOString() :
                            mapping.lexaField.includes('duration') ? 60 :
                                mapping.lexaField.includes('status') ? 'novo' :
                                    'Exemplo';
                payload[mapping.crmField] = value;
            }
        });
        return JSON.stringify(payload, null, 2);
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
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Integração CRM - Super Admin</h1>
                    <p className="text-gray-600 mt-2">Configure e teste integrações com CRMs externos</p>
                </div>
                <button
                    onClick={handleSaveConfig}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                    <Save className="w-5 h-5" />
                    Salvar Configuração
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b">
                <button
                    onClick={() => setActiveTab('config')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'config'
                            ? 'text-indigo-600 border-b-2 border-indigo-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <Settings className="w-4 h-4 inline mr-2" />
                    Configuração
                </button>
                <button
                    onClick={() => setActiveTab('test')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'test'
                            ? 'text-indigo-600 border-b-2 border-indigo-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <PlayCircle className="w-4 h-4 inline mr-2" />
                    Testar API
                </button>
                <button
                    onClick={() => setActiveTab('mapping')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'mapping'
                            ? 'text-indigo-600 border-b-2 border-indigo-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <Database className="w-4 h-4 inline mr-2" />
                    Mapeamento de Campos
                </button>
            </div>

            {/* Tab: Configuração */}
            {activeTab === 'config' && (
                <div className="bg-white rounded-lg shadow p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de CRM
                        </label>
                        <select
                            value={config.crmType}
                            onChange={(e) => setConfig({ ...config, crmType: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="custom">Custom / API Própria</option>
                            <option value="datacrazy">DataCrazy</option>
                            <option value="rdstation">RD Station</option>
                            <option value="pipedrive">Pipedrive</option>
                            <option value="hubspot">HubSpot</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            URL Base da API
                        </label>
                        <input
                            type="url"
                            value={config.crmWebhookUrl}
                            onChange={(e) => setConfig({ ...config, crmWebhookUrl: e.target.value })}
                            placeholder="https://api.seucrm.com"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Autenticação
                        </label>
                        <select
                            value={config.crmAuthType}
                            onChange={(e) => setConfig({ ...config, crmAuthType: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="bearer">Bearer Token</option>
                            <option value="apikey">API Key (Header)</option>
                            <option value="basic">Basic Auth</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            API Key / Token
                        </label>
                        <div className="relative">
                            <input
                                type={showApiKey ? 'text' : 'password'}
                                value={config.crmApiKey}
                                onChange={(e) => setConfig({ ...config, crmApiKey: e.target.value })}
                                placeholder="Sua chave de API"
                                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={config.crmEnabled}
                                onChange={(e) => setConfig({ ...config, crmEnabled: e.target.checked })}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Ativar integração CRM
                            </span>
                        </label>
                    </div>
                </div>
            )}

            {/* Tab: Testar API */}
            {activeTab === 'test' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Request */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Send className="w-5 h-5 text-indigo-600" />
                            Request
                        </h2>

                        <div className="space-y-4">
                            {/* Endpoints Rápidos */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Endpoints Rápidos
                                </label>
                                <select
                                    value={selectedEndpoint}
                                    onChange={(e) => {
                                        const idx = parseInt(e.target.value);
                                        setSelectedEndpoint(idx);
                                        setRequestMethod(endpoints[idx].method);
                                        setRequestUrl(endpoints[idx].url);
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    {endpoints.map((ep, idx) => (
                                        <option key={idx} value={idx}>
                                            {ep.method} - {ep.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Method + URL */}
                            <div className="flex gap-2">
                                <select
                                    value={requestMethod}
                                    onChange={(e) => setRequestMethod(e.target.value as any)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="GET">GET</option>
                                    <option value="POST">POST</option>
                                    <option value="PUT">PUT</option>
                                    <option value="PATCH">PATCH</option>
                                    <option value="DELETE">DELETE</option>
                                </select>
                                <input
                                    type="text"
                                    value={requestUrl}
                                    onChange={(e) => setRequestUrl(e.target.value)}
                                    placeholder="/api/endpoint"
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Body */}
                            {['POST', 'PUT', 'PATCH'].includes(requestMethod) && (
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Body (JSON)
                                        </label>
                                        <button
                                            onClick={() => setRequestBody(generateExamplePayload())}
                                            className="text-xs text-indigo-600 hover:text-indigo-700"
                                        >
                                            Gerar Exemplo
                                        </button>
                                    </div>
                                    <textarea
                                        value={requestBody}
                                        onChange={(e) => setRequestBody(e.target.value)}
                                        rows={12}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                    />
                                </div>
                            )}

                            {/* Send Button */}
                            <button
                                onClick={handleTestRequest}
                                disabled={testing || !config.crmWebhookUrl}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                <Send className="w-5 h-5" />
                                {testing ? 'Enviando...' : 'Enviar Request'}
                            </button>
                        </div>
                    </div>

                    {/* Response */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Code className="w-5 h-5 text-indigo-600" />
                            Response
                        </h2>

                        {response ? (
                            <div className="space-y-4">
                                {/* Status */}
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        {response.status >= 200 && response.status < 300 ? (
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-600" />
                                        )}
                                        <span className="font-semibold">
                                            {response.status} {response.statusText}
                                        </span>
                                    </div>
                                    <span className="text-sm text-gray-600">{responseTime}ms</span>
                                </div>

                                {/* Response Data */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Response Body
                                        </label>
                                        <button
                                            onClick={() => copyToClipboard(JSON.stringify(response.data || response.error, null, 2))}
                                            className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                        >
                                            <Copy className="w-3 h-3" />
                                            Copiar
                                        </button>
                                    </div>
                                    <pre className="p-4 bg-gray-900 text-green-400 rounded-lg overflow-x-auto text-xs">
                                        {JSON.stringify(response.data || response.error, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Envie um request para ver a resposta</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tab: Mapeamento de Campos */}
            {activeTab === 'mapping' && (
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Mapeamento de Campos</h2>
                        <button
                            onClick={addFieldMapping}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Adicionar Campo
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div className="grid grid-cols-12 gap-3 text-sm font-medium text-gray-700 pb-2 border-b">
                            <div className="col-span-4">Campo LEXA</div>
                            <div className="col-span-4">Campo CRM</div>
                            <div className="col-span-3">Transformação</div>
                            <div className="col-span-1"></div>
                        </div>

                        {fieldMappings.map((mapping, index) => (
                            <div key={index} className="grid grid-cols-12 gap-3 items-center">
                                <div className="col-span-4">
                                    <select
                                        value={mapping.lexaField}
                                        onChange={(e) => updateFieldMapping(index, 'lexaField', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                    >
                                        <option value="">Selecione...</option>
                                        {lexaFields.map(field => (
                                            <option key={field} value={field}>{field}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-4">
                                    <input
                                        type="text"
                                        value={mapping.crmField}
                                        onChange={(e) => updateFieldMapping(index, 'crmField', e.target.value)}
                                        placeholder="nome_campo_crm"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                    />
                                </div>
                                <div className="col-span-3">
                                    <select
                                        value={mapping.transform || ''}
                                        onChange={(e) => updateFieldMapping(index, 'transform', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                    >
                                        <option value="">Nenhuma</option>
                                        <option value="toISOString">toISOString()</option>
                                        <option value="toLowerCase">toLowerCase()</option>
                                        <option value="toUpperCase">toUpperCase()</option>
                                        <option value="trim">trim()</option>
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <button
                                        onClick={() => removeFieldMapping(index)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Preview */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-2">Preview do Payload:</h3>
                        <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
                            {generateExamplePayload()}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}
