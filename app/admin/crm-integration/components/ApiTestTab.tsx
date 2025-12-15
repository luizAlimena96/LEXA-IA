import { useState } from 'react';
import { Send, Code, CheckCircle, XCircle, Copy, Plus, Trash2 } from 'lucide-react';
import { CRMEndpoint, FieldMapping, ApiTestTabProps } from './interfaces';
import api from '@/app/lib/api-client';

export default function ApiTestTab({
    crmWebhookUrl,
    fieldMappings,
    crmApiKey,
    crmAuthType
}: ApiTestTabProps) {
    const [testing, setTesting] = useState(false);
    const [response, setResponse] = useState<any>(null);
    const [responseTime, setResponseTime] = useState<number>(0);

    // Request Builder State
    const [selectedEndpoint, setSelectedEndpoint] = useState(0);
    const [requestMethod, setRequestMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('GET');
    const [requestUrl, setRequestUrl] = useState('');
    const [bodyType, setBodyType] = useState<'raw' | 'form-urlencoded'>('raw');
    const [requestHeaders, setRequestHeaders] = useState<Record<string, string>>({
        'Content-Type': 'application/json',
    });
    const [customHeaders, setCustomHeaders] = useState<Array<{ key: string; value: string; enabled: boolean }>>([]);
    const [requestBody, setRequestBody] = useState('{\n  "name": "João Silva",\n  "phone": "11999999999",\n  "email": "joao@email.com",\n  "status": "novo"\n}');
    const [formData, setFormData] = useState<Array<{ key: string; value: string; enabled: boolean }>>([
        { key: 'name', value: 'João Silva', enabled: true },
        { key: 'phone', value: '11999999999', enabled: true },
    ]);

    const endpoints: CRMEndpoint[] = [
        { name: 'Listar Eventos', method: 'GET', url: '/api/events', description: 'Buscar eventos do calendário' },
        { name: 'Criar Lead', method: 'POST', url: '/api/leads', description: 'Criar novo lead no CRM' },
        { name: 'Atualizar Lead', method: 'PATCH', url: '/api/leads/{id}', description: 'Atualizar dados do lead' },
        { name: 'Criar Agendamento', method: 'POST', url: '/api/appointments', description: 'Criar agendamento no CRM' },
    ];

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

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copiado para área de transferência!');
    };

    const handleTestRequest = async () => {
        setTesting(true);
        setResponse(null);
        const startTime = Date.now();

        try {
            const headers: Record<string, string> = { ...requestHeaders };

            // Add custom headers
            customHeaders.forEach(header => {
                if (header.enabled && header.key && header.value) {
                    headers[header.key] = header.value;
                }
            });

            // Apply authentication based on type
            if (crmApiKey) {
                switch (crmAuthType) {
                    case 'bearer':
                        headers['Authorization'] = `Bearer ${crmApiKey}`;
                        break;
                    case 'apikey':
                        headers['X-API-Key'] = crmApiKey;
                        break;
                    case 'access-token':
                        headers['access-token'] = crmApiKey;
                        break;
                    case 'basic':
                        headers['Authorization'] = `Basic ${btoa(crmApiKey)}`;
                        break;
                    case 'custom':
                        // User should add custom header manually in customHeaders
                        break;
                    case 'none':
                        // No authentication
                        break;
                }
            }

            // Use URL completa diretamente (não concatenar)
            const fullUrl = requestUrl.startsWith('http')
                ? requestUrl
                : (crmWebhookUrl + requestUrl);

            // Prepare body
            let bodyToSend = undefined;
            if (['POST', 'PUT', 'PATCH'].includes(requestMethod)) {
                if (bodyType === 'form-urlencoded') {
                    // Convert form data to URLSearchParams
                    const params = new URLSearchParams();
                    formData.forEach(field => {
                        if (field.enabled && field.key) {
                            params.append(field.key, field.value);
                        }
                    });
                    bodyToSend = params.toString();
                    headers['Content-Type'] = 'application/x-www-form-urlencoded';
                } else {
                    // Raw JSON
                    bodyToSend = requestBody;
                    headers['Content-Type'] = 'application/json';
                }
            }

            const proxyData = await api.crm.proxy({
                url: fullUrl,
                method: requestMethod,
                headers,
                body: bodyToSend,
            });

            const endTime = Date.now();

            if (proxyData.error) {
                setResponse({
                    status: proxyData.status || 0,
                    statusText: proxyData.statusText || 'Error',
                    error: proxyData.error,
                    details: proxyData.details,
                });
            } else {
                setResponse({
                    status: proxyData.status,
                    statusText: proxyData.statusText,
                    headers: proxyData.headers,
                    data: proxyData.data,
                });
            }

            setResponseTime(proxyData.responseTime || (endTime - startTime));
        } catch (error: any) {
            setResponse({
                status: 0,
                statusText: 'Client Error',
                error: error.message,
                details: {
                    message: 'Erro ao fazer requisição. Verifique a URL e tente novamente.',
                    originalError: error.message,
                }
            });
            setResponseTime(Date.now() - startTime);
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Send className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Request
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                        >
                            {endpoints.map((ep, idx) => (
                                <option key={idx} value={idx}>
                                    {ep.method} - {ep.name}
                                </option>
                            ))}
                        </select>
                    </div>


                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            URL Completa
                        </label>
                        <div className="flex gap-2">
                            <select
                                value={requestMethod}
                                onChange={(e) => setRequestMethod(e.target.value as any)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 font-semibold dark:bg-gray-700 dark:text-white"
                                style={{ minWidth: '120px' }}
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
                                placeholder="https://api.exemplo.com/v1/leads"
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Digite a URL completa incluindo https://
                        </p>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Headers
                            </label>
                            <button
                                onClick={() => setCustomHeaders([...customHeaders, { key: '', value: '', enabled: true }])}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" />
                                Adicionar Header
                            </button>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700">
                            {customHeaders.map((header, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                    <input
                                        type="checkbox"
                                        checked={header.enabled}
                                        onChange={(e) => {
                                            const updated = [...customHeaders];
                                            updated[index].enabled = e.target.checked;
                                            setCustomHeaders(updated);
                                        }}
                                        className="w-4 h-4"
                                    />
                                    <input
                                        type="text"
                                        value={header.key}
                                        onChange={(e) => {
                                            const updated = [...customHeaders];
                                            updated[index].key = e.target.value;
                                            setCustomHeaders(updated);
                                        }}
                                        placeholder="Header-Name"
                                        className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 dark:bg-gray-600 dark:text-white"
                                    />
                                    <input
                                        type="text"
                                        value={header.value}
                                        onChange={(e) => {
                                            const updated = [...customHeaders];
                                            updated[index].value = e.target.value;
                                            setCustomHeaders(updated);
                                        }}
                                        placeholder="Value"
                                        className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 dark:bg-gray-600 dark:text-white"
                                    />
                                    <button
                                        onClick={() => setCustomHeaders(customHeaders.filter((_, i) => i !== index))}
                                        className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {customHeaders.length === 0 && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">Nenhum header customizado</p>
                            )}
                        </div>
                    </div>

                    {['POST', 'PUT', 'PATCH'].includes(requestMethod) && (
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Body
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setBodyType('raw')}
                                        className={`px-3 py-1 text-xs rounded ${bodyType === 'raw' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}
                                    >
                                        Raw (JSON)
                                    </button>
                                    <button
                                        onClick={() => setBodyType('form-urlencoded')}
                                        className={`px-3 py-1 text-xs rounded ${bodyType === 'form-urlencoded' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}
                                    >
                                        x-www-form-urlencoded
                                    </button>
                                </div>
                            </div>

                            {bodyType === 'raw' ? (
                                <>
                                    <div className="flex justify-end mb-1">
                                        <button
                                            onClick={() => setRequestBody(generateExamplePayload())}
                                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                                        >
                                            Gerar Exemplo
                                        </button>
                                    </div>
                                    <textarea
                                        value={requestBody}
                                        onChange={(e) => setRequestBody(e.target.value)}
                                        rows={12}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm dark:bg-gray-700 dark:text-white"
                                    />
                                </>
                            ) : (
                                <div className="space-y-2 border border-gray-300 dark:border-gray-600 rounded-lg p-3 dark:bg-gray-700">
                                    <div className="flex justify-end mb-2">
                                        <button
                                            onClick={() => setFormData([...formData, { key: '', value: '', enabled: true }])}
                                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Adicionar Campo
                                        </button>
                                    </div>
                                    {formData.map((field, index) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <input
                                                type="checkbox"
                                                checked={field.enabled}
                                                onChange={(e) => {
                                                    const updated = [...formData];
                                                    updated[index].enabled = e.target.checked;
                                                    setFormData(updated);
                                                }}
                                                className="w-4 h-4"
                                            />
                                            <input
                                                type="text"
                                                value={field.key}
                                                onChange={(e) => {
                                                    const updated = [...formData];
                                                    updated[index].key = e.target.value;
                                                    setFormData(updated);
                                                }}
                                                placeholder="key"
                                                className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 dark:bg-gray-600 dark:text-white"
                                            />
                                            <input
                                                type="text"
                                                value={field.value}
                                                onChange={(e) => {
                                                    const updated = [...formData];
                                                    updated[index].value = e.target.value;
                                                    setFormData(updated);
                                                }}
                                                placeholder="value"
                                                className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 dark:bg-gray-600 dark:text-white"
                                            />
                                            <button
                                                onClick={() => setFormData(formData.filter((_, i) => i !== index))}
                                                className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={handleTestRequest}
                        disabled={testing || (!crmWebhookUrl && !requestUrl.startsWith('http'))}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Send className="w-5 h-5" />
                        {testing ? 'Enviando...' : 'Enviar Request'}
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Code className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Response
                </h2>

                {response ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center gap-2">
                                {response.status >= 200 && response.status < 300 ? (
                                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                )}
                                <span className="font-semibold dark:text-white">
                                    {response.status} {response.statusText}
                                </span>
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">{responseTime}ms</span>
                        </div>

                        {response.error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-red-900 dark:text-red-300 mb-1">Erro na Requisição</h4>
                                        <p className="text-sm text-red-700 dark:text-red-400 mb-2">{response.error}</p>
                                        {response.details && (
                                            <div className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-2 rounded mt-2">
                                                <pre className="whitespace-pre-wrap">
                                                    {JSON.stringify(response.details, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                        <div className="mt-3 text-xs text-red-600 dark:text-red-400">
                                            <p className="font-semibold mb-1">💡 Dicas:</p>
                                            <ul className="list-disc list-inside space-y-1">
                                                <li>Verifique se a URL está correta</li>
                                                <li>Confirme que o header access-token está configurado</li>
                                                <li>Teste a mesma URL no Postman para comparar</li>
                                                <li>Verifique os logs do servidor no terminal</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {response.data && (
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Response Body
                                    </label>
                                    <button
                                        onClick={() => copyToClipboard(JSON.stringify(response.data, null, 2))}
                                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
                                    >
                                        <Copy className="w-3 h-3" />
                                        Copiar
                                    </button>
                                </div>
                                <pre className="p-4 bg-gray-900 text-green-400 rounded-lg overflow-x-auto text-xs">
                                    {JSON.stringify(response.data, null, 2)}
                                </pre>
                            </div>
                        )}

                        {response.headers && Object.keys(response.headers).length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Response Headers
                                </label>
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 max-h-40 overflow-y-auto">
                                    {Object.entries(response.headers).map(([key, value]) => (
                                        <div key={key} className="text-xs mb-1">
                                            <span className="font-semibold text-gray-700 dark:text-gray-300">{key}:</span>{' '}
                                            <span className="text-gray-600 dark:text-gray-400">{value as string}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Envie um request para ver a resposta</p>
                    </div>
                )}
            </div>
        </div>
    );
}
