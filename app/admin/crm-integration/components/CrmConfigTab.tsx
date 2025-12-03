import { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, Trash2 } from 'lucide-react';
import { CrmConfig } from './types';

interface CrmConfigTabProps {
    crmConfigs: CrmConfig[];
    fetchCrmConfigs: () => Promise<void>;
    selectedCrmConfig: string;
    setSelectedCrmConfig: (id: string) => void;
    orgId: string;
    config: any;
    setConfig: (config: any) => void;
    crmName: string;
    setCrmName: (name: string) => void;
}

export default function CrmConfigTab({
    crmConfigs,
    fetchCrmConfigs,
    selectedCrmConfig,
    setSelectedCrmConfig,
    orgId,
    config,
    setConfig,
    crmName,
    setCrmName
}: CrmConfigTabProps) {
    const [showApiKey, setShowApiKey] = useState(false);

    // Load selected config into form when selectedCrmConfig changes
    useEffect(() => {
        if (selectedCrmConfig) {
            const crm = crmConfigs.find(c => c.id === selectedCrmConfig);
            if (crm) {
                setCrmName(crm.name);
                setConfig({
                    crmType: crm.crmType,
                    crmEnabled: crm.isActive,
                    crmWebhookUrl: crm.baseUrl,
                    crmApiKey: crm.apiKey,
                    crmAuthType: crm.authType,
                });
            }
        }
    }, [selectedCrmConfig, crmConfigs, setCrmName, setConfig]);

    const handleSaveConfig = async () => {
        if (!crmName.trim()) {
            alert('Por favor, preencha o nome do CRM');
            return;
        }
        if (!config.crmWebhookUrl.trim()) {
            alert('Por favor, preencha a URL Base da API');
            return;
        }

        try {
            const method = selectedCrmConfig ? 'PATCH' : 'POST';
            const url = selectedCrmConfig
                ? `/api/crm-configs/${selectedCrmConfig}`
                : '/api/crm-configs';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: crmName,
                    crmType: config.crmType,
                    baseUrl: config.crmWebhookUrl,
                    authType: config.crmAuthType,
                    apiKey: config.crmApiKey,
                    organizationId: orgId,
                    isActive: config.crmEnabled,
                }),
            });

            if (res.ok) {
                alert(selectedCrmConfig ? 'CRM atualizado com sucesso!' : 'CRM criado com sucesso!');
                await fetchCrmConfigs();
                // Limpar formulário
                resetForm();
            } else {
                alert('Erro ao salvar configuração');
            }
        } catch (error) {
            console.error('Error saving:', error);
            alert('Erro ao salvar configuração');
        }
    };

    const handleDeleteCrm = async (id: string) => {
        if (!confirm('Tem certeza que deseja apagar este CRM? Isso removerá todas as automações associadas.')) {
            return;
        }

        try {
            const res = await fetch(`/api/crm-configs/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                alert('CRM apagado com sucesso!');
                await fetchCrmConfigs();
                if (selectedCrmConfig === id) {
                    resetForm();
                }
            } else {
                alert('Erro ao apagar CRM');
            }
        } catch (error) {
            console.error('Error deleting CRM:', error);
            alert('Erro ao apagar CRM');
        }
    };

    const handleEditCrm = (crm: CrmConfig) => {
        setSelectedCrmConfig(crm.id);
        // Form population is handled by useEffect
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setCrmName('');
        setConfig({
            crmType: 'custom',
            crmEnabled: true,
            crmWebhookUrl: '',
            crmApiKey: '',
            crmAuthType: 'bearer',
        });
        setSelectedCrmConfig('');
    };

    return (
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Configuração do CRM</h2>
                <button
                    onClick={handleSaveConfig}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                    <Save className="w-5 h-5" />
                    Salvar Configuração
                </button>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do CRM *
                </label>
                <input
                    type="text"
                    value={crmName}
                    onChange={(e) => setCrmName(e.target.value)}
                    placeholder="Ex: Datacrazy do Luiz"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Nome para identificar este CRM
                </p>
            </div>

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
                    <option value="bearer">Bearer Token (Authorization: Bearer)</option>
                    <option value="apikey">API Key (X-API-Key header)</option>
                    <option value="access-token">Access Token (access-token header)</option>
                    <option value="basic">Basic Auth</option>
                    <option value="custom">Custom Header</option>
                    <option value="none">Sem Autenticação</option>
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

            {/* Lista de CRMs Salvos */}
            {crmConfigs.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            CRMs Configurados
                        </h3>
                        {selectedCrmConfig && (
                            <button
                                onClick={resetForm}
                                className="text-sm text-gray-600 hover:text-gray-900"
                            >
                                Cancelar Edição
                            </button>
                        )}
                    </div>
                    <div className="space-y-3">
                        {crmConfigs.map((crm) => (
                            <div
                                key={crm.id}
                                className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${selectedCrmConfig === crm.id
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-gray-900">{crm.name}</h4>
                                        {selectedCrmConfig === crm.id && (
                                            <span className="text-xs px-2 py-1 bg-indigo-600 text-white rounded">
                                                Editando
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {crm.crmType} • {crm.baseUrl}
                                    </p>
                                    <span className={`inline-block text-xs px-2 py-1 rounded mt-2 ${crm.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {crm.isActive ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditCrm(crm)}
                                        className="px-3 py-2 text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg transition-colors"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCrm(crm.id)}
                                        className="px-3 py-2 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
                                    >
                                        Apagar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
